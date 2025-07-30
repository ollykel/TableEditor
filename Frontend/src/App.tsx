import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from '@/context/AuthContext';
import { AuthorizedFetchContextLayout } from '@/context/AuthorizedFetchContext';

import PrivateRoute from '@/components/PrivateRoute';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import CreateAccountPage from '@/pages/CreateAccountPage';
import TablePage from '@/pages/TablePage';
import LandingPage from '@/pages/LandingPage';
import NotFoundPage from '@/pages/NotFoundPage';

const APP_ROUTE_PREFIX = '/app';

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
                <LandingPage
                  onLoginUrl={`${APP_ROUTE_PREFIX}/home`}
                  createAccountUrl={`${APP_ROUTE_PREFIX}/create_account`}
                />
              }
            />
            <Route
              path={APP_ROUTE_PREFIX}
              element={
                <LandingPage
                  onLoginUrl={`${APP_ROUTE_PREFIX}/home`}
                  createAccountUrl={`${APP_ROUTE_PREFIX}/create_account`}
                />
              }
            />

            <Route
              path={`${APP_ROUTE_PREFIX}/create_account`}
              element={ <CreateAccountPage /> }
            />

            <Route
              path={`${APP_ROUTE_PREFIX}/login`}
              element={
                <LoginPage
                  onLoginUrl={`${APP_ROUTE_PREFIX}/home`}
                />
              }
            />

            {/** protected routes **/}
            <Route element={<AuthorizedFetchContextLayout />}>
              <Route
                path={`${APP_ROUTE_PREFIX}/home`}
                element={<PrivateRoute fallbackUrl="/">
                  <HomePage />
                </PrivateRoute>}
              />
              <Route
                path={`${APP_ROUTE_PREFIX}/tables/:tableId`}
                element={<PrivateRoute fallbackUrl="/">
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
