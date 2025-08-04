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

import React from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

export interface TableCellProps {
  text: string;
  clientId: number;
  ownerId: number;
  handleChangeText: (newText: string) => void;
}

export const TableCell: React.FC<TableCellProps> = ({ text, clientId, ownerId, handleChangeText }) => {
  const { isConnected } = useWebSocket();
  const isLocked = (ownerId !== -1) && (clientId !== ownerId);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    handleChangeText(newText);
  };

  return (
    <div className="border border-gray-300 w-min">
      <textarea
        className="disabled:bg-gray-200 resize-none"
        rows={3}
        cols={30}
        value={text}
        onChange={handleChange}
        disabled={!isConnected || isLocked}
        style={{ resize: 'none', margin: '5px' }}
      />
    </div>
  );
};
