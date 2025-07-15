use std::{
    net::SocketAddr,
    sync::Arc,
    thread,
    time::Duration,
};

use futures::{
    SinkExt,
    StreamExt,
    lock::Mutex,
    executor::block_on
};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use warp::ws::{Message, WebSocket};
use warp::Filter;

// === CellLockData ===============================================================================
//
// Contains information on the current owner of a table cell.
//
// - owner_id: The client id of the owner
// - duration_secs: How many seconds are left before the client relinquishes ownership of the cell
// (should be refreshed whenever the client performs an operation on the cell)
//
// ================================================================================================
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
struct CellLockData {
    owner_id: u64,
    duration_secs: u32
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct TableCell {
    text: String,
    lock: Option<CellLockData>
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct TableCellClientView {
    text: String,
    owner_id: Option<u64>
}

// === ClientMessage ==============================================================================
//
// Encompasses all messages to be sent from/to clients. Cells are identified in (row, column)
// format.
//
// ================================================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ClientMessage {
    Init { client_id: u64, table: Vec<Vec<TableCellClientView>> },
    Insert { client_id: u64, cell: (usize, usize), index: usize, text: String },
    Delete { client_id: u64, cell: (usize, usize), start: usize, end: usize },
    Replace { client_id: u64, cell: (usize, usize), start: usize, end: usize, text: String },
    AcquireLock { client_id: u64, cell: (usize, usize) },
    ReleaseLock { cell: (usize, usize) },
}

type SharedTable = Arc<Vec<Vec<Arc<Mutex<TableCell>>>>>;
type SharedClientId = Arc<Mutex<u64>>;

#[tokio::main]
async fn main() {
    let table: SharedTable = Arc::new((0..3)
        .map(|_| {
            (0..3).map(|_| Arc::new(Mutex::new(TableCell {
                text: String::from("Hallo Welt"),
                lock: None
            }))).collect()
        }).collect());

    let next_client_id: SharedClientId = Arc::new(Mutex::new(0u64));
    let (tx, _rx) = broadcast::channel::<ClientMessage>(100);

    {
        let table_clone = Arc::clone(&table);
        let tx_clone = tx.clone();

        thread::spawn(move || {
            block_on(async move {
                loop {
                    for row in 0..3 {
                        for col in 0..3 {
                            let mut cell = table_clone[row][col].lock().await;
                            let mut to_reset = false;
                            if let Some(ref mut lock) = cell.lock {
                                if lock.duration_secs < 2 {
                                    to_reset = true;
                                } else {
                                    lock.duration_secs -= 1;
                                }
                            }
                            if to_reset {
                                eprintln!("Resetting lock ({}, {})", row, col);
                                cell.lock = None;
                                let _ = tx_clone.send(ClientMessage::ReleaseLock { cell: (row, col) });
                            }
                        }
                    }
                    thread::sleep(Duration::from_secs(1));
                }
            });
        });
    }

    let table_filter = warp::any().map({
        let table = Arc::clone(&table);
        move || Arc::clone(&table)
    });

    let next_client_id_filter = warp::any().map({
        let next_client_id = Arc::clone(&next_client_id);
        move || Arc::clone(&next_client_id)
    });

    let tx_filter = warp::any().map({
        let tx = tx.clone();
        move || tx.clone()
    });

    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(table_filter)
        .and(next_client_id_filter)
        .and(tx_filter)
        .map(|ws: warp::ws::Ws, table, next_client_id, tx| {
            ws.on_upgrade(move |socket| handle_connection(socket, table, next_client_id, tx))
        });

    let addr: SocketAddr = ([0, 0, 0, 0], 8080).into();
    println!("Rust WebSocket server running at ws://{}", addr);
    warp::serve(ws_route).run(addr).await;
}

async fn handle_connection(ws: WebSocket, table: SharedTable, next_client_id: SharedClientId, tx: broadcast::Sender<ClientMessage>) {
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let mut rx = tx.subscribe();
    let mut current_client_id;

    {
        let mut id_lock = next_client_id.lock().await;
        current_client_id = *id_lock;
        *id_lock += 1;
    }

    let init_table = {
        let mut snapshot = vec![];
        for row in &*table {
            let mut snap_row = vec![];
            for cell in row {
                let c = cell.lock().await;
                snap_row.push(TableCellClientView{
                    text: c.text.clone(),
                    owner_id: match &c.lock {
                        None => None,
                        Some(lock) => Some(lock.owner_id)
                    }
                });
            }
            snapshot.push(snap_row);
        }
        snapshot
    };

    let init_msg = ClientMessage::Init {
        client_id: current_client_id,
        table: init_table,
    };
    let _ = user_ws_tx.send(Message::text(serde_json::to_string(&init_msg).unwrap())).await;

    let send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let json = serde_json::to_string(&msg).unwrap();
            if user_ws_tx.send(Message::text(json)).await.is_err() {
                break;
            }
        }
    });

    let recv_task = tokio::spawn({
        let table = Arc::clone(&table);
        let tx = tx.clone();
        async move {
            while let Some(Ok(msg)) = user_ws_rx.next().await {
                if let Ok(text_str) = msg.to_str() {
                    if let Ok(mut client_msg) = serde_json::from_str::<ClientMessage>(text_str) {
                        match client_msg {
                            ClientMessage::Insert { ref mut client_id, cell: (r, c), index, ref text, .. } => {
                                let mut cell = table[r][c].lock().await;
                                *client_id = current_client_id;
                                if cell.lock.map_or(true, |l| l.owner_id == current_client_id) {
                                    if index >= cell.text.len() {
                                        cell.text.push_str(text);
                                    } else {
                                        cell.text.insert_str(index, text);
                                    }
                                    cell.lock = Some(CellLockData { owner_id: current_client_id, duration_secs: 3 });
                                    tx.send(client_msg).ok();
                                    tx.send(ClientMessage::AcquireLock { client_id: current_client_id, cell: (r, c) }).ok();
                                }
                            }
                            ClientMessage::Delete { ref mut client_id, cell: (r, c), start, end, .. } => {
                                let mut cell = table[r][c].lock().await;
                                *client_id = current_client_id;
                                if cell.lock.map_or(true, |l| l.owner_id == current_client_id) {
                                    if start <= end && end <= cell.text.len() {
                                        cell.text.replace_range(start..end, "");
                                        cell.lock = Some(CellLockData { owner_id: current_client_id, duration_secs: 3 });
                                        tx.send(client_msg).ok();
                                        tx.send(ClientMessage::AcquireLock { client_id: current_client_id, cell: (r, c) }).ok();
                                    }
                                }
                            }
                            ClientMessage::Replace { ref mut client_id, cell: (r, c), start, end, ref text, .. } => {
                                let mut cell = table[r][c].lock().await;
                                *client_id = current_client_id;
                                if cell.lock.map_or(true, |l| l.owner_id == current_client_id) {
                                    if start <= end && end <= cell.text.len() {
                                        cell.text.replace_range(start..end, text);
                                        cell.lock = Some(CellLockData { owner_id: current_client_id, duration_secs: 3 });
                                        tx.send(client_msg).ok();
                                        tx.send(ClientMessage::AcquireLock { client_id: current_client_id, cell: (r, c) }).ok();
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    });

    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    println!("Client {} disconnected", current_client_id);
}
