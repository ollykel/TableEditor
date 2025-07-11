use std::{
    collections::HashSet,
    convert::Infallible,
    net::SocketAddr,
    sync::{Arc, Mutex},
};

use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use warp::ws::{Message, WebSocket};
use warp::Filter;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum ClientMessage {
    Init { text: String },
    Create { index: usize, text: String },
    Delete { start: usize, end: usize },
    Replace { start: usize, end: usize, text: String },
}

type SharedText = Arc<Mutex<String>>;

#[tokio::main]
async fn main() {
    let text = Arc::new(Mutex::new(String::from("Hello, World!")));
    let (tx, _rx) = broadcast::channel::<ClientMessage>(100);

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
        .and(text_filter)
        .and(tx_filter)
        .map(|ws: warp::ws::Ws, text, tx| {
            ws.on_upgrade(move |socket| handle_connection(socket, text, tx))
        });

    let addr: SocketAddr = ([0, 0, 0, 0], 8080).into();
    println!("Rust WebSocket server running at ws://{}", addr);
    warp::serve(ws_route).run(addr).await;
}

async fn handle_connection(ws: WebSocket, text: SharedText, tx: broadcast::Sender<ClientMessage>) {
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let mut rx = tx.subscribe();

    // Send initial text to the user
    {
        let current_text = text.lock().unwrap().clone();
        let init_msg = ClientMessage::Init { text: current_text };
        let json = serde_json::to_string(&init_msg).unwrap();
        let _ = user_ws_tx.send(Message::text(json)).await;
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
                    apply_text_change(&client_msg, &text_clone);
                    let _ = tx_clone.send(client_msg);
                }
            }
        }
    });

    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    println!("Client disconnected");
}

fn apply_text_change(msg: &ClientMessage, shared_text: &SharedText) {
    let mut text = shared_text.lock().unwrap();

    match msg {
        ClientMessage::Create { index, text: insert } => {
            if *index <= text.len() {
                text.insert_str(*index, insert);
            }
        }
        ClientMessage::Delete { start, end } => {
            if *start <= *end && *end <= text.len() {
                text.replace_range(*start..*end, "");
            }
        }
        ClientMessage::Replace { start, end, text: replacement } => {
            if *start <= *end && *end <= text.len() {
                text.replace_range(*start..*end, replacement);
            }
        }
        ClientMessage::Init { .. } => {
            // Init should not trigger on the server
        }
    }
}
