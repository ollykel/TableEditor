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

#[derive(Copy,Clone)]
struct SharedTextLockData {
    owner_id: u64,
    duration_secs: u32
}

type SharedText = Arc<Mutex<String>>;
type SharedClientId = Arc<Mutex<u64>>;
type SharedTextLock = Arc<Mutex<Option<SharedTextLockData>>>;

#[tokio::main]
async fn main() {
    let shared_text_lock = Arc::new(Mutex::new(Option::<SharedTextLockData>::None));
    let client_id = Arc::new(Mutex::new(0u64));
    let text = Arc::new(Mutex::new(String::from("Hello, World!")));
    let (tx, _rx) = broadcast::channel::<ClientMessage>(100);

    // thread to release lock after idle for five seconds
    {
        let shared_text_lock_clone = Arc::clone(&shared_text_lock);
        let tx_clone = tx.clone();

        let reset_lock = async move || {
           loop {
                {
                    let mut shared_text_lock = shared_text_lock_clone.lock().await;
                    let mut to_reset = false;

                    match *shared_text_lock {
                        None => {},
                        Some(ref mut info) => {
                            if info.duration_secs < 2 {
                                to_reset = true;
                            } else {
                                info.duration_secs -= 1;
                            }
                        }
                    };// end match shared_text_lock

                    if to_reset {
                        eprintln!("Resetting lock ...");
                        let _ = tx_clone.send(ClientMessage::ReleaseLock);
                        *shared_text_lock = None;
                    }
                }
                thread::sleep(Duration::from_millis(1000));
            };
        };

        thread::spawn(move || block_on(reset_lock()));
    }

    let shared_text_lock_filter = warp::any().map({
        let shared_text_lock = Arc::clone(&shared_text_lock);
        move || Arc::clone(&shared_text_lock)
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
        .and(shared_text_lock_filter)
        .and(client_id_filter)
        .and(text_filter)
        .and(tx_filter)
        .map(|ws: warp::ws::Ws, shared_text_lock, client_id, text, tx| {
            ws.on_upgrade(move |socket| handle_connection(socket, shared_text_lock, client_id, text, tx))
        });

    let addr: SocketAddr = ([0, 0, 0, 0], 8080).into();
    println!("Rust WebSocket server running at ws://{}", addr);
    warp::serve(ws_route).run(addr).await;
}

async fn handle_connection(ws: WebSocket, shared_text_lock: SharedTextLock, client_id: SharedClientId, text: SharedText, tx: broadcast::Sender<ClientMessage>) {
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let mut rx = tx.subscribe();
    let mut current_client_id = u64::MAX;

    // Send initial text to the user
    {
        let shared_text_lock = shared_text_lock.lock().await;
        let lock_owner_id : Option<u64> = match *shared_text_lock {
            None => None,
            Some(info) => Some(info.owner_id)
        };
        let mut client_id = client_id.lock().await;

        current_client_id = *client_id;

        let current_text = text.lock().await.clone();
        let init_msg = ClientMessage::Init{
            client_id: current_client_id, lock_owner_id: lock_owner_id, text: current_text
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
                if let Ok(mut client_msg) = serde_json::from_str::<ClientMessage>(text_str) {
                    let mut shared_text_lock = shared_text_lock.lock().await;

                    match *shared_text_lock {
                        None => {
                            // broadcast that a user has acquired the lock
                            let lock_msg = ClientMessage::AcquireLock{ client_id: current_client_id };
                            let _ = tx_clone.send(lock_msg);

                            *shared_text_lock = Some(SharedTextLockData{
                                owner_id: current_client_id, duration_secs: 3
                            });
                            apply_text_change(&client_msg, &text_clone).await;
                            let _ = tx_clone.send(client_msg);
                        },
                        Some(ref mut info) => if current_client_id == info.owner_id {
                            // reset duration
                            info.duration_secs = 3;

                            apply_client_id(&mut client_msg, current_client_id);
                            apply_text_change(&client_msg, &text_clone).await;
                            let _ = tx_clone.send(client_msg);
                        }
                    };
                }
            }
        }

        // Release lock on client disconnect
        {
            let mut shared_text_lock = shared_text_lock.lock().await;

            match *shared_text_lock {
                None => {},
                Some(info) => if info.owner_id == current_client_id {
                    let _ = tx_clone.send(ClientMessage::ReleaseLock);
                    *shared_text_lock = None;
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

fn apply_client_id(msg: &mut ClientMessage, cid: u64) {
    use ClientMessage::*;

    let mut dummy = 0u64;
    let mut client_id = match msg {
        Insert { ref mut client_id, .. } => client_id,
        Delete { ref mut client_id, .. } => client_id,
        Replace { ref mut client_id, .. } => client_id,
        Init { ref mut client_id, .. } => client_id,
        AcquireLock { ref mut client_id, .. } => client_id,
        _ => &mut dummy
    };

    *client_id = cid;
}// end fn apply_client_id(musg: &mut ClientMessage, client_id: u64)

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
