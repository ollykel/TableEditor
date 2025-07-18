import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from '@/pages/HomePage';
import TablePage from '@/pages/TablePage';


function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/** public **/}
          <Route path="/" element={<HomePage />} />
          <Route path="/tables/:tableId" element={<TablePage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
