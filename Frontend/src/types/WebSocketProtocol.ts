// === WebSocketProtocol =======================================================
//
// Define the types for incoming and outgoing messages
//
// =============================================================================

export interface TableCellData {
  text: string;
  owner_id?: number;
};

export interface DiffInsert {
  type: "insert";
  index: number;
  text: string;
};

export interface DiffReplace {
  type: "replace";
  start: number;
  end: number;
  text: string;
};

export interface DiffDelete {
  type: "delete";
  start: number;
  end: number;
};

export interface DiffNone {
  type: "none";
};

export type StrDiff = DiffInsert | DiffReplace | DiffDelete | DiffNone;

// === Server-to-Client messages ===============================================
export interface ServerMessageInit {
  type: "init";
  client_id: number;
  table: TableCellData[][];
};

export interface ServerMessageInsert extends DiffInsert {
  client_id: number;
  cell: [number, number];
};

export interface ServerMessageDelete extends DiffDelete {
  client_id: number;
  cell: [number, number];
};

export interface ServerMessageReplace extends DiffReplace {
  client_id: number;
  cell: [number, number];
};

export interface ServerMessageInsertRows {
  type: "insert_rows";
  client_id: number;
  insertion_index: number;
  num_rows: number;
}

export interface ServerMessageInsertCols {
  type: "insert_cols";
  client_id: number;
  insertion_index: number;
  num_cols: number;
}

export interface ServerMessageAcquireLock {
  type: "acquire_lock";
  client_id: number;
  cell: [number, number];
};

export interface ServerMessageReleaseLock {
  type: "release_lock";
  cell: [number, number];
};

export type ServerStringMutateMessage = ServerMessageInsert | ServerMessageDelete | ServerMessageReplace | ServerMessageAcquireLock;
export type ServerCellMutateMessage = ServerStringMutateMessage | ServerMessageReleaseLock;
export type ServerMessage = ServerMessageInit | ServerCellMutateMessage | ServerMessageInsertRows | ServerMessageInsertCols;

// === Client-to-Server messages ===============================================
export interface ClientMessageInsert extends DiffInsert {
  cell: [number, number];
};

export interface ClientMessageDelete extends DiffDelete {
  cell: [number, number];
};

export interface ClientMessageReplace extends DiffReplace {
  cell: [number, number];
};

export interface ClientMessageInsertRows {
  type: "insert_rows";
  insertion_index: number;
  num_rows: number;
}

export interface ClientMessageInsertCols {
  type: "insert_cols";
  insertion_index: number;
  num_cols: number;
}

export interface ClientMessageAcquireLock {
  type: "acquire_lock";
  cell: [number, number];
};

export interface ClientMessageReleaseLock {
  type: "release_lock";
  cell: [number, number];
};

export type ClientStringMutateMessage = ClientMessageInsert | ClientMessageDelete | ClientMessageReplace | ClientMessageAcquireLock;
export type ClientCellMutateMessage = ClientStringMutateMessage | ClientMessageReleaseLock;
export type ClientMessage = ClientCellMutateMessage | ClientMessageInsertRows | ClientMessageInsertCols;
