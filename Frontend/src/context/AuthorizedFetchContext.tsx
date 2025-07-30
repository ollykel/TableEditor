import { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Outlet } from 'react-router-dom';

import type { ReactNode } from 'react';

import { useAuth } from '@/context/AuthContext';

export interface AuthorizedFetchContextData {
  fetchAuthenticated: (path: string, params: object) => Promise<Response>;
}

const AuthorizedFetchContext = createContext<AuthContextData>({
  fetchAuthenticated: (_path: string, _params: object) => new Promise(new Response(null, {
    status: 400
  }))
});

export const AuthorizedFetchProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { isAuthenticated, getAuthToken, logout } = useAuth();

  const fetchAuthenticated = async (path: string, params: object | null): Promise<Response> => {
    if (! isAuthenticated) {
      // TODO: add redirect address to login query parameter
      navigate('/app/login');
      return new Response(null, ({
        status: 403
      }));
    } else {
      const headers = ({
        ...((params && params.headers) || ({})),
        'Authorization': `Bearer ${getAuthToken()}`
      });
      const fetchParams = ({
        ...(params || ({})),
        headers
      });
      const resp = await fetch(path, fetchParams);

      if (resp.status === 403) {
        // we are no longer authenticated; redirect to login page
        logout();
        navigate('/app/login');
      }

      return resp;
    }
  };

  return (
    <AuthorizedFetchContext.Provider value={{ fetchAuthenticated }}>
      {children}
    </AuthorizedFetchContext.Provider>
  );
}

export const AuthorizedFetchContextLayout = () => {
  return (
    <AuthorizedFetchProvider>
      <Outlet />
    </AuthorizedFetchProvider>
  );
};

export const useAuthorizedFetch = () => useContext(AuthorizedFetchContext);
