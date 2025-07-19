use std::{
    net::SocketAddr,
    sync::Arc,
    thread,
    time::Duration,
    collections::HashMap,
    env,
    error::Error,
    fmt
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
use tokio_postgres as postgres;

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

#[derive(Clone, Debug)]
struct TableCellData {
    text: String
}

type TableData = Vec<Vec<TableCellData>>;

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

type SharedTable = Arc<Vec<Vec<Mutex<TableCell>>>>;
type TableId = i64;// corresponds to Postgres BIGINT
type SharedTablesMap = Arc<Mutex<HashMap<TableId, SharedTable>>>;
type SharedClientId = Arc<Mutex<u64>>;

#[derive(Debug, Clone, Copy)]
struct NoTableError {
    table_id: TableId
}

impl NoTableError {
    fn new(table_id: TableId) -> Self {
        Self { table_id: table_id }
    }
}

impl fmt::Display for NoTableError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "no table with id = {}", self.table_id)
    }
}

impl Error for NoTableError {}

async fn fetch_table(db_cli: &postgres::Client, table_id: TableId) -> Result<SharedTable, Box<dyn Error>> {
    let rows = db_cli.query("SELECT name, width, height FROM tables WHERE id = $1", &[&table_id]).await?;

    let (width, height) = if let Some(row) = rows.first() {
        let id : TableId = row.get(0);
        let name : &str = row.get(1);
        let width : i32 = row.get(2);
        let height : i32 = row.get(3);

        (width, height)
    } else {
        return Err(Box::new(NoTableError::new(table_id)))
    };

    let width = width as usize;
    let height = height as usize;

    // Get cells within table
    let rows = db_cli.query("SELECT row_num, column_num, text FROM table_cells WHERE table_id = $1", &[&table_id]).await?;

    let mut table_data = vec![ vec![ String::new(); width as usize ]; height as usize ];

    for row in rows {
        let i_row : i32 = row.get(0);
        let i_col : i32 = row.get(1);
        let text : &str = row.get(2);

        table_data[i_row as usize][i_col as usize] = String::from(text);
    }// end for row in rows

    let table: SharedTable = Arc::new((0..height)
        .map(|i_row| {
            (0..width).map(|i_col| Mutex::new(TableCell {
                text: table_data[i_row][i_col].clone(),
                lock: None
            })).collect()
        }).collect());

    Ok(table)
}

#[tokio::main]
async fn main() {
    // All services serve on port 3000 by default
    let port = 3000u16;
    let shared_tables = Arc::new(Mutex::new(HashMap::<TableId, SharedTable>::new()));
    let next_client_id: SharedClientId = Arc::new(Mutex::new(0u64));
    let (tx, _rx) = broadcast::channel::<ClientMessage>(100);

    // Configure database client
    let (db_user, db_dbname, db_pass) = match (env::var("POSTGRES_USER"), env::var("POSTGRES_DB"), env::var("POSTGRES_PASSWORD")) {
        (Ok(user), Ok(dbname), Ok(pass)) => (user, dbname, pass),
        (e_user, e_dbname, e_pass) => {
            if let Err(e) = e_user {
                eprintln!("Could not get POSTGRES_USER: {}", e);
            }
            if let Err(e) = e_dbname {
                eprintln!("Could not get POSTGRES_DB: {}", e);
            }
            if let Err(e) = e_pass {
                eprintln!("Could not get POSTGRES_PASSWORD: {}", e);
            }
            return;
        }
    };
    let conn_str = format!("host=database user={} dbname={} password={}", db_user, db_dbname, db_pass);
    let (db_cli, db_conn) = match postgres::connect(conn_str.as_str(), postgres::NoTls).await {
        Ok(cli) => cli,
        Err(e) => {
            eprintln!("ERROR: could not connect to database -- {}", e);
            return;
        }
    };

    tokio::spawn(async move {
        if let Err(e) = db_conn.await {
            eprintln!("database connection error: {}", e);
        };
    });

    let (table, table_width, table_height) = {
        // Test database query.
        let rows = match db_cli.query("SELECT id, name, width, height FROM tables LIMIT 1", &[]).await {
            Ok(rows) => rows,
            Err(e) => {
                eprintln!("Could not query database: {}", e);
                return;
            }
        };

        let (table_id, _table_name, width, height) = if let Some(row) = rows.first() {
            let id : TableId = row.get(0);
            let name : &str = row.get(1);
            let width : i32 = row.get(2);
            let height : i32 = row.get(3);

            (id, String::from(name), width, height)
        } else {
            eprintln!("ERROR: no tables in database");
            return;
        };

        let width = width as usize;
        let height = height as usize;

        // Get cells within table
        let rows = match db_cli.query("SELECT row_num, column_num, text FROM table_cells WHERE table_id = $1", &[&table_id]).await {
            Ok(rows) => rows,
            Err(e) => {
                eprintln!("ERROR: could not fetch cells for table {:?} -- {}", table_id, e);
                return;
            }
        };

        let mut table_data = vec![ vec![ String::new(); width as usize ]; height as usize ];

        for row in rows {
            let i_row : i32 = row.get(0);
            let i_col : i32 = row.get(1);
            let text : &str = row.get(2);

            table_data[i_row as usize][i_col as usize] = String::from(text);
        }// end for row in rows

        let table: SharedTable = Arc::new((0..height)
            .map(|i_row| {
                (0..width).map(|i_col| Mutex::new(TableCell {
                    text: table_data[i_row][i_col].clone(),
                    lock: None
                })).collect()
            }).collect());

        (table, width, height)
    };

    shared_tables.lock().await.insert(1, Arc::clone(&table));

    {
        let table_clone = Arc::clone(&table);
        let tx_clone = tx.clone();

        thread::spawn(move || {
            block_on(async move {
                loop {
                    for row in 0..table_height {
                        for col in 0..table_width {
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

    let shared_tables_filter = warp::any().map({
        let shared_tables = Arc::clone(&shared_tables);
        move || Arc::clone(&shared_tables)
    });

    let next_client_id_filter = warp::any().map({
        let next_client_id = Arc::clone(&next_client_id);
        move || Arc::clone(&next_client_id)
    });

    let tx_filter = warp::any().map({
        let tx = tx.clone();
        move || tx.clone()
    });

    let ws_route = warp::path!("ws" / TableId)
        .and(warp::ws())
        .and(shared_tables_filter)
        .and(next_client_id_filter)
        .and(tx_filter)
        .map(|table_id, ws: warp::ws::Ws, shared_tables, next_client_id, tx| {
            ws.on_upgrade(move |socket| handle_connection(socket, table_id, shared_tables, next_client_id, tx))
        });

    let addr: SocketAddr = ([0, 0, 0, 0], port).into();
    println!("Rust WebSocket server running at ws://{}", addr);
    warp::serve(ws_route).run(addr).await;
}

async fn handle_connection(ws: WebSocket, table_id: TableId, shared_tables: SharedTablesMap, next_client_id: SharedClientId, tx: broadcast::Sender<ClientMessage>) {
    let mut shared_table : Option<SharedTable> = match shared_tables.lock().await.get(&table_id) {
        None => None,
        Some(shared_table) => Some(shared_table.clone())
    };

    match &mut shared_table {
        None => {
            println!("Table with id {} not found", table_id);
        },
        Some(ref mut table) => {
            let (mut user_ws_tx, mut user_ws_rx) = ws.split();
            let mut rx = tx.subscribe();
            let current_client_id;

            {
                let mut id_lock = next_client_id.lock().await;
                current_client_id = *id_lock;
                *id_lock += 1;
            }

            let init_table = {
                let mut snapshot = vec![];
                for row in &**table {
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
    };// end match &shared_tables.get(&table_id)
}
