// === TableEditor =============================================================
//
// Edits a table via a connection over a web socket. Prevents two people from
// working on a cell at the same time using mutual exclusion.
//
// =============================================================================

// TableEditor.tsx
import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { TableCell as CellComponent } from './TableCell';

const WS_URI = 'ws://localhost:8080/ws';

type TableCellData = { text: string; lock?: { owner_id: number; duration_secs: number } };

// Define the types for incoming and outgoing messages
// type InitMessage = { type: "init"; client_id: number; lock_owner_id?: number; table: TableCellData[][] };
// type InsertMessage = { type: "insert"; client_id: number; cell: [number, number]; index: number; text: string };
// type DeleteMessage = { type: "delete"; client_id: number; cell: [number, number]; start: number; end: number };
// type ReplaceMessage = { type: "replace"; client_id: number; cell: [number, number]; start: number; end: number; text: string };
// type AcquireLockMessage = { type: "acquire_lock"; client_id: number; cell: [number, number] };
// type ReleaseLockMessage = { type: "release_lock" };

export const TableEditor: React.FC = () => {
  const { connect, isConnected } = useWebSocket();
  const [table, setTable] = React.useState<TableCellData[][]>(
    Array.from({ length: 3 }, () => Array(3).fill({ text: '' }))
  );
  const [clientId, setClientId] = useState<number>(-1);

  const handleInit = (event: any): void => {
    try {
      const msg = JSON.parse(event.data);
      console.log('RECEIVED INIT:', msg);
      if (msg.type === 'init' && Array.isArray(msg.table)) {
        setClientId(msg.client_id);
        setTable(msg.table);
      }
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      connect(WS_URI, handleInit);
    }
  }, [isConnected, connect]);

  // TODO: remove debug
  console.log('Table:', table);

  const makeCell = (row: number, col: number): React.JSX.Element => {
    const text = table[row][col].text;
    const setText = (newText: string): void => {
      const targetRow = table[row];
      setTable([
        ...table.slice(0, row),
        [
          ...targetRow.slice(0, col),
          { text: newText },
          ...targetRow.slice(col + 1)
        ],
        ...table.slice(row + 1)
      ]);
    };

    return (<CellComponent
      key={`${row}-${col}`}
      clientId={clientId}
      row={row} col={col}
      text={text}
      setText={setText}
    />);
  };

  return (
    <div>
      <h2>Collaborative Table Editor</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '10px' }}>
        {table.map((row, i) =>
          row.map((_, j) => makeCell(i, j))
        )}
      </div>
    </div>
  );
};
