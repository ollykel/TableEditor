// === TableCell ===============================================================
//
// props:
//  - row: row number within table
//  - col: column number within table
//
// relevant context:
//  - socket: web socket with which to interface with server
//
// state:
//  - text: current contents of the cell
//
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

export interface TableCellProps {
  clientId: number;
  row: number;
  col: number;
  text: string;
  setText: (t: string) => void;
}

type DiffInsert = { type: "insert"; index: number; text: string };
type DiffReplace = { type: "replace"; start: number; end: number; text: string };
type DiffDelete = { type: "delete"; start: number; end: number };
type DiffNone = { type: "none" };

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

export const TableCell: React.FC<TableCellProps> = ({ clientId, row, col, text, setText }) => {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const { socket, isConnected } = useWebSocket();
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!socket) return;

    const handler = (event: any) => {
      try {
        const msg = JSON.parse(event.data);
        if (Array.isArray(msg.cell) && msg.cell[0] === row && msg.cell[1] === col) {
          switch (msg.type) {
            case 'insert':
              if (msg.client_id !== clientId) {
                setText(textRef.current.slice(0, msg.index) + msg.text + textRef.current.slice(msg.index));
              }
              break;
            case 'delete':
              if (msg.client_id !== clientId) {
                setText(textRef.current.slice(0, msg.start) + textRef.current.slice(msg.end));
              }
              break;
            case 'replace':
              if (msg.client_id !== clientId) {
                setText(textRef.current.slice(0, msg.start) + msg.text + textRef.current.slice(msg.end));
              }
              break;
            case 'release_lock':
              // Optional: Add UI indication the cell is unlocked
              setIsLocked(false);
              break;
            case 'acquire_lock':
              // Optional: Add UI indication the cell is locked by another user
              if (msg.client_id !== clientId) {
                setIsLocked(true);
              }
              break;
            default:
              break;
          }
        }
      } catch (e) {
        console.error('Error parsing message', e);
      }
    };

    socket.addEventListener('message', handler);
    return () => {
      socket.removeEventListener('message', handler);
    };
  }, [socket, clientId, row, col]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!socket || !isConnected) return;

    const newText = e.target.value;
    const oldText = textRef.current;

    const diff = diffStrings(oldText, newText);

    let message = null;

    if (diff.type !== "none") {
      message = { client_id: 0, cell: [row, col], ...diff };
    }

    if (message) {
      socket.send(JSON.stringify(message));
      setText(newText);
    }
  };

  return (
    <textarea
      rows={3}
      cols={30}
      value={text}
      onChange={handleChange}
      disabled={!isConnected || isLocked}
      style={{ resize: 'none', margin: '5px' }}
    />
  );
};
