import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import PrivateRoute from '@/components/PrivateRoute';

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

          {/** protected routes **/}
          <Route
            path="/home"
            element={<PrivateRoute fallbackUrl="/">
              <HomePage />
            </PrivateRoute>}
          />
          <Route
            path="/tables/:tableId"
            element={<PrivateRoute fallbackUrl="/">
              <TablePage />
            </PrivateRoute>}
          />

          {/** 404 page **/}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
