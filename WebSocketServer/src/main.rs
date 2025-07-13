use std::{
    net::SocketAddr,
    sync::Arc,
};

use futures::{SinkExt, StreamExt, lock::Mutex};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use warp::ws::{Message, WebSocket};
use warp::Filter;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ClientMessage {
    Init { client_id: u64, text: String, lock_owner_id: Option<u64> },
    Insert { client_id: u64, index: usize, text: String },
    Delete { client_id: u64, start: usize, end: usize },
    Replace { client_id: u64, start: usize, end: usize, text: String },
    AcquireLock { client_id: u64 },
    ReleaseLock,
}

type SharedText = Arc<Mutex<String>>;
type SharedClientId = Arc<Mutex<u64>>;
type LockOwnerId = Arc<Mutex<Option<u64>>>;

#[tokio::main]
async fn main() {
    let lock_owner_id = Arc::new(Mutex::new(Option::<u64>::None));
    let client_id = Arc::new(Mutex::new(0u64));
    let text = Arc::new(Mutex::new(String::from("Hello, World!")));
    let (tx, _rx) = broadcast::channel::<ClientMessage>(100);

    let lock_owner_id_filter = warp::any().map({
        let lock_owner_id = Arc::clone(&lock_owner_id);
        move || Arc::clone(&lock_owner_id)
    });

    let client_id_filter = warp::any().map({
        let client_id = Arc::clone(&client_id);
        move || Arc::clone(&client_id)
    });

    let text_filter = warp::any().map({
        let text = Arc::clone(&text);
        move || Arc::clone(&text)
    });

    let tx_filter = warp::any().map({
        let tx = tx.clone();
        move || tx.clone()
    });

    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(lock_owner_id_filter)
        .and(client_id_filter)
        .and(text_filter)
        .and(tx_filter)
        .map(|ws: warp::ws::Ws, lock_owner_id, client_id, text, tx| {
            ws.on_upgrade(move |socket| handle_connection(socket, lock_owner_id, client_id, text, tx))
        });

    let addr: SocketAddr = ([0, 0, 0, 0], 8080).into();
    println!("Rust WebSocket server running at ws://{}", addr);
    warp::serve(ws_route).run(addr).await;
}

async fn handle_connection(ws: WebSocket, lock_owner_id: LockOwnerId, client_id: SharedClientId, text: SharedText, tx: broadcast::Sender<ClientMessage>) {
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let mut rx = tx.subscribe();
    let mut current_client_id = u64::MAX;

    // Send initial text to the user
    {
        let lock_owner_id = lock_owner_id.lock().await;
        let mut client_id = client_id.lock().await;

        current_client_id = *client_id;

        let current_text = text.lock().await.clone();
        let init_msg = ClientMessage::Init{
            client_id: current_client_id, lock_owner_id: *lock_owner_id, text: current_text
        };
        let json = serde_json::to_string(&init_msg).unwrap();
        let _ = user_ws_tx.send(Message::text(json)).await;

        *client_id += 1;
    }

    let send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let json = serde_json::to_string(&msg).unwrap();
            if user_ws_tx.send(Message::text(json)).await.is_err() {
                break;
            }
        }
    });

    let text_clone = Arc::clone(&text);
    let tx_clone = tx.clone();
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = user_ws_rx.next().await {
            if let Ok(text_str) = msg.to_str() {
                if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(text_str) {
                    let mut lock_owner_id = lock_owner_id.lock().await;

                    match *lock_owner_id {
                        None => {
                            // broadcast that a user has acquired the lock
                            let lock_msg = ClientMessage::AcquireLock{ client_id: current_client_id };
                            let _ = tx_clone.send(lock_msg);

                            *lock_owner_id = Some(current_client_id);
                            apply_text_change(&client_msg, &text_clone).await;
                            let _ = tx_clone.send(client_msg);
                        },
                        Some(id) => if current_client_id == id {
                            apply_text_change(&client_msg, &text_clone).await;
                            let _ = tx_clone.send(client_msg);
                        }
                    };
                }
            }
        }

        // Release lock on client disconnect
        {
            let mut lock_owner_id = lock_owner_id.lock().await;

            match *lock_owner_id {
                None => {},
                Some(id) => if id == current_client_id {
                    let _ = tx_clone.send(ClientMessage::ReleaseLock);
                    *lock_owner_id = None;
                }
            };
        }
    });

    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    println!("Client disconnected");
}

async fn apply_text_change(msg: &ClientMessage, shared_text: &SharedText) {
    use ClientMessage::*;

    let mut text = shared_text.lock().await;

    match msg {
        Insert { client_id: _, index, text: insert } => {
            if *index <= text.len() {
                text.insert_str(*index, insert);
            }
        }
        Delete { client_id: _, start, end } => {
            if *start <= *end && *end <= text.len() {
                text.replace_range(*start..*end, "");
            }
        }
        Replace { client_id: _, start, end, text: replacement } => {
            if *start <= *end && *end <= text.len() {
                text.replace_range(*start..*end, replacement);
            }
        }
        Init { .. } | AcquireLock { .. } | ReleaseLock => {
            // These events should not trigger on the server
        },
    }
}
