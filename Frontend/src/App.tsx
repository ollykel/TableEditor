import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from '@/pages/HomePage';
import TablePage from '@/pages/TablePage';
import LandingPage from '@/pages/LandingPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/** public **/}
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/tables/:tableId" element={<TablePage />} />
          {/** 404 page **/}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
