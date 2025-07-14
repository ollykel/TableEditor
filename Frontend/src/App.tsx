import './App.css'

import { WebSocketProvider } from '@/context/WebSocketContext';

import { TableEditor } from '@/components/TableEditor';

function App() {
  return (
    <>
      <WebSocketProvider>
        <TableEditor />
      </WebSocketProvider>
    </>
  )
}

export default App
