use std::{
    net::SocketAddr,
    sync::{
        Arc,
        atomic,
        atomic::AtomicU32
    },
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
    InsertRows { client_id: u64, insertion_index: usize, num_rows: usize },
    AcquireLock { client_id: u64, cell: (usize, usize) },
    ReleaseLock { cell: (usize, usize) },
}

type SharedTableCells = Vec<Vec<Arc<Mutex<TableCell>>>>;
struct SharedTable {
    cells: Mutex<SharedTableCells>,
    client_count: AtomicU32,
    sender: broadcast::Sender<ClientMessage>
}
type SharedTablesMap = Arc<Mutex<HashMap<TableId, Arc<SharedTable>>>>;
type TableId = i64;// corresponds to Postgres BIGINT
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

async fn fetch_table(db_cli: &postgres::Client, table_id: TableId) -> Result<SharedTableCells, NoTableError> {
    let rows = match db_cli.query("SELECT width, height FROM tables WHERE id = $1", &[&table_id]).await {
        Err(_) => { return Err(NoTableError::new(table_id)); },
        Ok(rows) => rows
    };

    let (width, height) = if let Some(row) = rows.first() {
        let width : i32 = row.get(0);
        let height : i32 = row.get(1);

        (width, height)
    } else {
        return Err(NoTableError::new(table_id))
    };

    let width = width as usize;
    let height = height as usize;

    // Get cells within table
    let rows = match db_cli.query("SELECT row_num, column_num, text FROM table_cells WHERE table_id = $1", &[&table_id]).await {
        Err(_) => { return Err(NoTableError::new(table_id)); },
        Ok(rows) => rows
    };

    let mut table_data = vec![ vec![ String::new(); width as usize ]; height as usize ];

    for row in rows {
        let i_row : i32 = row.get(0);
        let i_col : i32 = row.get(1);
        let text : &str = row.get(2);

        match (TryInto::<usize>::try_into(i_row), TryInto::<usize>::try_into(i_col)) {
            (Err(e_row), Ok(_)) => {
                eprintln!("ERROR: could not convert {} into usize row index: {}", i_row, e_row);
            },
            (Ok(_), Err(e_col)) => {
                eprintln!("ERROR: could not convert {} into usize col index: {}", i_col, e_col);
            },
            (Err(e_row), Err(e_col)) => {
                eprintln!(
                    "ERROR: could not convert {}, {} into usize indices: {}, {}",
                    i_row, i_col, e_row, e_col
                );
            },
            (Ok(i_row), Ok(i_col)) => match table_data.get_mut(i_row) {
                None => {
                    eprintln!(
                        "ERROR: row index {} falls outside table of dimension {}x{}",
                        i_row, height, width
                    );
                },
                Some(row) => match row.get_mut(i_col) {
                    None => {
                        eprintln!(
                            "ERROR: col index {} falls outside table of dimension {}x{}",
                            i_col, height, width
                        );
                    },
                    Some(cell_text) => {
                        *cell_text = String::from(text);
                    }
                }
            }
        };// end match (TryInto::<usize>::try_into(i_row), TryInto::<usize>::try_into(i_col))
    }// end for row in rows

    let table: SharedTableCells = (0..height)
        .map(|i_row| {
            (0..width).map(|i_col| Arc::new(Mutex::new(TableCell {
                text: table_data[i_row][i_col].clone(),
                lock: None
            }))).collect()
        }).collect();

    Ok(table)
}

// === Pseudocode =================================================================================
//
// Table:
//  - MutexLockedCells[][]
//  - client_count
//  - broadcast_channel
//  - lock_manager_thread_handle
// TableMap: TableId => Table
//
// ================================================================================================

#[tokio::main]
async fn main() {
    // All services serve on port 3000 by default
    let port = 3000u16;
    let shared_tables = Arc::new(Mutex::new(HashMap::<TableId, Arc<SharedTable>>::new()));
    let next_client_id: SharedClientId = Arc::new(Mutex::new(0u64));

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
        Ok((cli, conn)) => (Arc::new(Mutex::new(cli)), conn),
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

    let shared_tables_filter = warp::any().map({
        let shared_tables = Arc::clone(&shared_tables);
        move || Arc::clone(&shared_tables)
    });

    let db_cli_filter = warp::any().map({
        let db_cli = Arc::clone(&db_cli);
        move || Arc::clone(&db_cli)
    });

    let next_client_id_filter = warp::any().map({
        let next_client_id = Arc::clone(&next_client_id);
        move || Arc::clone(&next_client_id)
    });

    let ws_route = warp::path!("ws" / TableId)
        .and(warp::ws())
        .and(shared_tables_filter)
        .and(db_cli_filter)
        .and(next_client_id_filter)
        .map(|table_id, ws: warp::ws::Ws, shared_tables, db_cli, next_client_id| {
            ws.on_upgrade(move |socket| handle_connection(socket, shared_tables, table_id, db_cli, next_client_id))
        });

    let addr: SocketAddr = ([0, 0, 0, 0], port).into();
    println!("Rust WebSocket server running at ws://{}", addr);
    warp::serve(ws_route).run(addr).await;
}

// === handle_connection ==========================================================================
//
// Pseudocode:
//  1. Check for table in map
//      a. If present, proceed to AAA
//  2. Check for table in database
//      a. If not present, terminate
//      b. Add database to table map
//          i. Set client count to 0
//          ii. Spawn lock manager thread
//          iii. Create broadcast channel
//  3. Increment client count on table
//  4. Subscribe to broadcast channel
//  5. Take messages until disconnect
//  6. Decrement client count
//
// ================================================================================================
async fn handle_connection(ws: WebSocket, shared_tables: SharedTablesMap, table_id: TableId, db_cli_ref: Arc<Mutex<postgres::Client>>, next_client_id: SharedClientId) {
    // Pseudocode:
    //  1. Check for table in map
    let mut shared_table : Option<Arc<SharedTable>> = match shared_tables.lock().await.get(&table_id) {
        None => None,
    //      a. If present, proceed to AAA
        Some(table) => Some(Arc::clone(table))
    };

    // If the table is not yet held in the in-memory shared table map, fetch it from the database.
    if let None = shared_table {
        let db_cli = db_cli_ref.lock().await;

        match fetch_table(&db_cli, table_id).await {
            Ok(table_cells) => {
                let (tx, _rx) = broadcast::channel::<ClientMessage>(100);
                //      b. Add table to table map
                //          i. Set client count to 0
                //          ii. TODO: Spawn lock manager thread
                //          iii. Create broadcast channel
                let shared_table_new = Arc::new(SharedTable{
                    cells: Mutex::new(table_cells),
                    client_count: AtomicU32::new(0u32),
                    sender: tx.clone()
                });

                // === Lock Manager Thread ========================================================
                //
                // Scans all cells in the table at a one second interval. If a cell is currently
                // locked by a certain user, the time remaining on their lock is decremented by
                // one. If the time remaining reaches zero, the user's lock is released.
                //
                // When the main connection thread receives an action from the user, it should
                // reset the time remaining to the initial value, extending the duration of the
                // user's lock.
                //
                // ================================================================================
                {
                    let db_cli_clone = Arc::clone(&db_cli_ref);
                    let shared_table_clone = Arc::clone(&shared_table_new);
                    let tx_clone = tx.clone();

                    thread::spawn(move || {
                        block_on(async move {
                            loop {
                                {
                                    let shared_table_cells = shared_table_clone.cells.lock().await;
                                    let table_height = shared_table_cells.len();
                                    let table_width = shared_table_cells.first().unwrap().len();

                                    for row in 0..table_height {
                                        for col in 0..table_width {
                                            let mut cell = shared_table_cells[row][col].lock().await;
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
                                                // write back to database
                                                let db_cli = db_cli_clone.lock().await;

                                               match db_cli.execute(
                                                    "UPDATE table_cells SET text = $1 WHERE table_id = $2 AND row_num = $3 AND column_num = $4",
                                                    &[&cell.text, &table_id, &(row as i32), &(col as i32)]
                                                ).await {
                                                   Ok(n_rows) => {
                                                       println!("{} rows updated by update", n_rows);
                                                   },
                                                   Err(e) => {
                                                       println!("Could not update table cell: {}", e);
                                                   }
                                               };
                                                cell.lock = None;
                                                let _ = tx_clone.send(ClientMessage::ReleaseLock { cell: (row, col) });
                                            }
                                        }
                                    }
                                }

                                thread::sleep(Duration::from_secs(1));
                            }
                        });
                    });
                }

                shared_table = Some(Arc::clone(&shared_table_new));

                {
                    let mut shared_tables = shared_tables.lock().await;
                    shared_tables.insert(table_id, Arc::clone(&shared_table_new));
                }
            },
            Err(e) => {
    //      a. If not present, terminate
                eprintln!("ERROR: {}", e);
            }
        };// end match fetch_table(db_cli, table_id)
    }

    match &mut shared_table {
        None => {
            eprintln!("Could not access table with id = {}", table_id);
        },
        Some(ref mut table) => {
            let (mut user_ws_tx, mut user_ws_rx) = ws.split();
            let current_client_id;

            //  3. Increment client count on table
            table.client_count.fetch_add(1, atomic::Ordering::Relaxed);

            //  4. Subscribe to broadcast channel
            let mut rx = table.sender.subscribe();

            {
                let mut id_lock = next_client_id.lock().await;
                current_client_id = *id_lock;
                *id_lock += 1;
            }

            let init_table = {
                let mut snapshot = vec![];
                let table_cells = table.cells.lock().await;

                for row in table_cells.iter() {
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

            //  5. Take messages until disconnect
            let recv_task = tokio::spawn({
                let table = Arc::clone(&table);
                async move {
                    while let Some(Ok(msg)) = user_ws_rx.next().await {
                        if let Ok(text_str) = msg.to_str() {
                            if let Ok(mut client_msg) = serde_json::from_str::<ClientMessage>(text_str) {
                                match client_msg {
                                    ClientMessage::Insert { ref mut client_id, cell: (r, c), index, ref text, .. } => {
                                        let cell_ref = {
                                            let table_cells = table.cells.lock().await;

                                            Arc::clone(&table_cells[r][c])
                                        };
                                        let mut cell = cell_ref.lock().await;

                                        *client_id = current_client_id;
                                        if cell.lock.map_or(true, |l| l.owner_id == current_client_id) {
                                            if index >= cell.text.len() {
                                                cell.text.push_str(text);
                                            } else {
                                                cell.text.insert_str(index, text);
                                            }
                                            cell.lock = Some(CellLockData { owner_id: current_client_id, duration_secs: 3 });
                                            table.sender.send(client_msg).ok();
                                            table.sender.send(ClientMessage::AcquireLock { client_id: current_client_id, cell: (r, c) }).ok();
                                        }
                                    }
                                    ClientMessage::Delete { ref mut client_id, cell: (r, c), start, end, .. } => {
                                        let cell_ref = {
                                            let table_cells = table.cells.lock().await;

                                            Arc::clone(&table_cells[r][c])
                                        };
                                        let mut cell = cell_ref.lock().await;

                                        *client_id = current_client_id;
                                        if cell.lock.map_or(true, |l| l.owner_id == current_client_id) {
                                            if start <= end && end <= cell.text.len() {
                                                cell.text.replace_range(start..end, "");
                                                cell.lock = Some(CellLockData { owner_id: current_client_id, duration_secs: 3 });
                                                table.sender.send(client_msg).ok();
                                                table.sender.send(ClientMessage::AcquireLock { client_id: current_client_id, cell: (r, c) }).ok();
                                            }
                                        }
                                    }
                                    ClientMessage::Replace { ref mut client_id, cell: (r, c), start, end, ref text, .. } => {
                                        let cell_ref = {
                                            let table_cells = table.cells.lock().await;

                                            Arc::clone(&table_cells[r][c])
                                        };
                                        let mut cell = cell_ref.lock().await;
                                        *client_id = current_client_id;
                                        if cell.lock.map_or(true, |l| l.owner_id == current_client_id) {
                                            if start <= end && end <= cell.text.len() {
                                                cell.text.replace_range(start..end, text);
                                                cell.lock = Some(CellLockData { owner_id: current_client_id, duration_secs: 3 });
                                                table.sender.send(client_msg).ok();
                                                table.sender.send(ClientMessage::AcquireLock { client_id: current_client_id, cell: (r, c) }).ok();
                                            }
                                        }
                                    },
                                    ClientMessage::InsertRows { client_id: _, insertion_index, num_rows } => {
                                        // Update table in-memory
                                        // TODO: store table dimensions independently in struct
                                        let mut table_cells = table.cells.lock().await;

                                        if insertion_index > table_cells.len() {
                                            // invalid insertion index
                                            // TODO: return insertion index
                                            continue;
                                        }

                                        let n_rows_orig = table_cells.len();
                                        let n_cols = table_cells.first().unwrap().len();

                                        for _ in 0..num_rows {
                                            let mut new_row = Vec::<Arc<Mutex<TableCell>>>::new();

                                            for _ in 0..n_cols {
                                                new_row.push(Arc::new(Mutex::new(TableCell{
                                                    text: String::new(),
                                                    lock: None
                                                })));
                                            }// end for _ in 0..n_cols
                                            table_cells.insert(insertion_index, new_row);
                                        }// end for _ in 0..num_rows

                                        // TODO: Make a database transaction
                                        {
                                            // Update table dimensions
                                            let db_cli = db_cli_ref.lock().await;

                                            match db_cli.execute("UPDATE tables SET height = height + $1 WHERE id = $2", &[&(num_rows as i32), &table_id]).await {
                                                Ok(n_rows) => {
                                                   println!("{} rows updated by update", n_rows);
                                                },
                                                Err(e) => {
                                                    println!("Could not update table: {}", e);
                                                }
                                            };

                                            // increment row number of all existing cells at or
                                            // above insertion row
                                            for i_row in (insertion_index..n_rows_orig).rev() {
                                                match db_cli.execute("UPDATE table_cells SET row_num = row_num + $1 WHERE table_id = $2 AND row_num = $3", &[&(num_rows as i32), &table_id, &(i_row as i32)]).await {
                                                    Ok(n_rows) => {
                                                       println!("{} rows updated by update", n_rows);
                                                    },
                                                    Err(e) => {
                                                        println!("Could not update table: {}", e);
                                                    }
                                                };
                                            }

                                            // insert new table cells
                                            let new_text = String::new();
                                            for idx in 0..num_rows {
                                                let i_row = insertion_index + idx;

                                                for i_col in 0..n_cols {
                                                    match db_cli.execute("INSERT INTO table_cells (table_id, row_num, column_num, text) VALUES ($1, $2, $3, $4)", &[&table_id, &(i_row as i32), &(i_col as i32), &new_text]).await {
                                                        Ok(n_rows) => {
                                                           println!("{} rows updated by insertion", n_rows);
                                                        },
                                                        Err(e) => {
                                                            println!("Could not update table cells: {}", e);
                                                        }
                                                    };
                                                }// end for i_col in 0..n_cols
                                            }// end for idx in 0..n_rows
                                        }

                                        // Update clients
                                        table.sender.send(client_msg).ok();
                                    },
                                    // Do nothing for all other messages
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

            //  6. Decrement client count
            table.client_count.fetch_sub(1, atomic::Ordering::Relaxed);

            println!("Client {} disconnected", current_client_id);
        }
    };// end match &shared_tables.get(&table_id)
    //  3. Increment client count on table
    //  4. Subscribe to broadcast channel
    //  5. Take messages until disconnect
    //  6. Decrement client count
}// end handle_connection

