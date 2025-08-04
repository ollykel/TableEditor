// === TableEditor =============================================================
//
// Edits a table via a connection over a web socket. Prevents two people from
// working on a cell at the same time using mutual exclusion.
//
// =============================================================================

// TableEditor.tsx
import React, { useState, useEffect, useRef } from 'react';

import { Plus } from 'lucide-react';

import { useWebSocket } from '@/context/WebSocketContext';
import { TableCell as CellComponent } from './TableCell';

import type TableProps from '@/types/TableProps';

import type {
  TableCellData,
  DiffInsert,
  DiffReplace,
  DiffDelete,
  DiffNone,
  StrDiff,
  MutateMessage,
  Message
} from '@/types/WebSocketProtocol';

const diffStrings = (olds: string, news: string): DiffInsert | DiffReplace | DiffDelete | DiffNone => {
  if (olds === news) return { type: "none" };

  // Find common prefix
  let start = 0;
  while (start < olds.length && start < news.length && olds[start] === news[start]) {
    start++;
  }

  // Find common suffix
  let endOld = olds.length;
  let endNew = news.length;
  while (
    endOld > start &&
    endNew > start &&
    olds[endOld - 1] === news[endNew - 1]
  ) {
    endOld--;
    endNew--;
  }

  const oldDiff = olds.slice(start, endOld);
  const newDiff = news.slice(start, endNew);

  if (oldDiff.length === 0 && newDiff.length > 0) {
    return { type: "insert", index: start, text: newDiff };
  }

  if (oldDiff.length > 0 && newDiff.length === 0) {
    return { type: "delete", start, end: endOld };
  }

  return { type: "replace", start, end: endOld, text: newDiff };
};

const mutateString = (olds: string, diff: StrDiff): string => {
  let outs = olds;

  switch (diff.type) {
    case 'insert':
      outs = olds.slice(0, diff.index) + diff.text + olds.slice(diff.index);
      break;
    case 'replace':
      outs = olds.slice(0, diff.start) + diff.text + olds.slice(diff.end);
      break;
    case 'delete':
      outs = olds.slice(0, diff.start) + olds.slice(diff.end);
      break;
  }// end switch (diff.type)

  return outs;
};// end const mutateString = (olds: string, diff: StrDiff): string

interface TableEditorProps {
  tableInfo: TableProps;
}

export const TableEditor: React.FC<TableEditorProps> = (props: TableEditorProps) => {
  const { tableInfo } = props;
  const { id: tableId } = tableInfo;
  const { socket, connect, isConnected } = useWebSocket();
  const [table, setTable] = useState<TableCellData[][]>(
    Array.from({ length: 3 }, () => Array(3).fill({ text: '', owner_id: -1 }))
  );
  const [clientId, setClientId] = useState<number>(-1);
  const clientIdRef = useRef<number>(clientId);
  const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUri = `${wsScheme}://${window.location.host}/ws/${tableId}`;

  useEffect(() => {
    clientIdRef.current = clientId;
  }, [clientId]);

  console.log('Client ID:', clientId);

  const mutateCell = (msg: MutateMessage): void => {
    const [row, col] = msg.cell;

    setTable((oldTable) => {
      let newCell = { ...oldTable[row][col] };
      const targetRow = oldTable[row];

      switch (msg.type) {
        case 'insert':
        case 'replace':
        case 'delete':
          console.log('Old cell:', newCell);
          newCell.text = mutateString(newCell.text, msg as StrDiff);
          console.log('New text:', newCell.text);
          break;
        case 'acquire_lock':
          newCell.owner_id = msg.client_id;
          break;
        case 'release_lock':
          newCell.owner_id = -1;
          break;
      }

      return [
        ...oldTable.slice(0, row),
        [...targetRow.slice(0, col), newCell, ...targetRow.slice(col + 1)],
        ...oldTable.slice(row + 1)
      ];
    });
  };// end mutateCell
  
  const setText = (row: number, col: number, text: string): void => {
    setTable((oldTable) => {
      const newCell = { ...oldTable[row][col], text }
      const targetRow = oldTable[row];

      return [
        ...oldTable.slice(0, row),
        [...targetRow.slice(0, col), newCell, ...targetRow.slice(col + 1)],
        ...oldTable.slice(row + 1)
      ];
    });

  };// end setText

  const handleMessage = (event: any): void => {
    try {
      const clientId = clientIdRef.current;
      const msg = JSON.parse(event.data) as Message;
      console.log('Received:', msg);
      if (msg.type === 'init') {
        if (Array.isArray(msg.table)) {
          console.log('RECEIVED INIT');
          setClientId(() => msg.client_id);
          setTable(() => msg.table);
        }
      } else if (msg.type === 'insert_rows') {
        // TODO: row insertion logic here
        const { insertion_index: insertionIndex, num_rows: numRows} =  msg;

        // Insert rows with blank text
        setTable((oldTable) => {
          const nCols = oldTable[0].length;

          return [
            ...oldTable.slice(0, insertionIndex),
            ...Array(numRows).fill(
              Array(nCols).fill({ text: '', owner_id: -1 })
            ),
            ...oldTable.slice(insertionIndex),
          ];
        });
      } else if (msg.type === 'release_lock' || msg.client_id !== clientId) {
        mutateCell(msg);
      }
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      connect(wsUri, handleMessage);
    }
  }, [isConnected, connect]);

  const makeCell = (cell: TableCellData, row: number, col: number): React.JSX.Element => {
    const clientId = clientIdRef.current;
    const { text, owner_id: ownerId } = cell;
    const handleChangeText = (newText: string): void => {
      const diff = diffStrings(text, newText);

      if (socket && diff.type !== 'none') {
        const message = { client_id: 0, cell: [row, col], ...diff};
        socket.send(JSON.stringify(message));
        setText(row, col, newText);
      }
    };

    return (<CellComponent
      key={`${row}-${col}`}
      text={text}
      clientId={clientId}
      ownerId={ownerId || -1}
      handleChangeText={handleChangeText}
    />);
  };

  const nCols = table.length > 0 ? table[0].length : 0;

  const makeInsertRow = (iRow: number) => () => {
    if (socket) {
      console.log(`Inserting row at ${iRow}`);
      socket.send(JSON.stringify({
        type: "insert_rows",
        client_id: 0,
        insertion_index: iRow,
        num_rows: 1
      }));
    }
  };

  return (
    <div className="w-min">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${nCols + 1}, auto)`, gap: '0px' }}>
        {table.map((row, iRow) =>
          [
            <div key={`${iRow}-label`} className="items-baseline">
              <button
                onClick={makeInsertRow(iRow)}
                className="hover:cursor-pointer hover:bg-blue-200"
              >
                <Plus />
              </button>
            </div>
            , ...row.map((cell, iCol) => makeCell(cell, iRow, iCol))
          ]
        )}
      </div>
    </div>
  );
};

export default TableEditor;
