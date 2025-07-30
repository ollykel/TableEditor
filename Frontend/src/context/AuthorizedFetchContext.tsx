import { createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Outlet } from 'react-router-dom';

import type { ReactNode } from 'react';

import { useAuth } from '@/context/AuthContext';

export interface FetchOptionsType {
  headers?: object;
  method?: string;
  body?: string;
}

export interface AuthorizedFetchContextData {
  fetchAuthenticated: (path: string, options?: FetchOptionsType) => Promise<Response>;
}

const AuthorizedFetchContext = createContext<AuthorizedFetchContextData>({
  fetchAuthenticated: (_path: string, _options?: FetchOptionsType) => new Promise(
    () => new Response(null, {
      status: 400
    })
  )
});

export const AuthorizedFetchProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, getAuthToken, logout } = useAuth();

  const fetchAuthenticated = async (path: string, options?: FetchOptionsType): Promise<Response> => {
    if (! isAuthenticated) {
      // TODO: add redirect address to login query parameter
      navigate('/app/login');
      return new Response(null, ({
        status: 403
      }));
    } else {
      const headers = ({
        ...((options && options.headers) || ({})),
        'Authorization': `Bearer ${getAuthToken()}`
      });
      const fetchParams = ({
        ...(options || ({})),
        headers
      });
      const resp = await fetch(path, fetchParams);

      if (resp.status === 403) {
        // we are no longer authenticated; redirect to login page
        const locationStr = encodeURIComponent(`${location.pathname}?${location.search}`);

        logout();
        navigate(`/app/login?redirect=${locationStr}`);
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
