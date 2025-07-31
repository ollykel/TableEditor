import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import config from '@/app.config';
import { AuthProvider } from '@/context/AuthContext';
import { AuthorizedFetchContextLayout } from '@/context/AuthorizedFetchContext';

import PrivateRoute from '@/components/PrivateRoute';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import CreateAccountPage from '@/pages/CreateAccountPage';
import TablePage from '@/pages/TablePage';
import LandingPage from '@/pages/LandingPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/** public **/}
            <Route
              path="/"
              element={
                <LandingPage />
              }
            />
            <Route
              path={config.routes.appRoot}
              element={
                <LandingPage />
              }
            />

            <Route
              path={config.routes.createAccount}
              element={ <CreateAccountPage /> }
            />

            <Route
              path={config.routes.login}
              element={
                <LoginPage />
              }
            />

            {/** protected routes **/}
            <Route element={<AuthorizedFetchContextLayout />}>
              <Route
                path={config.routes.home}
                element={<PrivateRoute>
                  <HomePage />
                </PrivateRoute>}
              />
              <Route
                path={`${config.routes.tables}/:tableId`}
                element={<PrivateRoute>
                  <TablePage />
                </PrivateRoute>}
              />
            </Route>

            {/** 404 page **/}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
