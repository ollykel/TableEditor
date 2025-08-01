

// Define the types for incoming and outgoing messages
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

export type StrDiff = DiffInsert | DiffReplace | DiffDelete;

export interface MessageInit {
  type: "init";
  client_id: number;
  table: TableCellData[][];
};

export interface MessageInsert extends DiffInsert {
  client_id: number;
  cell: [number, number];
};

export interface MessageDelete extends DiffDelete {
  client_id: number;
  cell: [number, number];
};

export interface MessageReplace extends DiffReplace {
  client_id: number;
  cell: [number, number];
};

export interface MessageAcquireLock {
  type: "acquire_lock";
  client_id: number;
  cell: [number, number];
};

export interface MessageReleaseLock {
  type: "release_lock";
  cell: [number, number];
};

export type ClientMutateMessage = MessageInsert | MessageDelete | MessageReplace | MessageAcquireLock;
export type MutateMessage = ClientMutateMessage | MessageReleaseLock;
export type Message = MessageInit | MutateMessage;
