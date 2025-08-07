import { createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Outlet } from 'react-router-dom';

import type { ReactNode } from 'react';

import { useAuth } from '@/context/AuthContext';

import type { UserView } from '@/types/User';
import type TableProps from '@/types/TableProps';

export interface FetchOptionsType {
  headers?: object;
  method?: string;
  body?: string;
}

export interface AuthorizedFetchContextData {
  fetchAuthenticated: (path: string, options?: FetchOptionsType) => Promise<Response>;
  fetchUsersByUsernameOrEmail: (query: string) => Promise<UserView[]>;
  addSharedUsers: (table: TableProps, users: UserView[]) => Promise<Response>;
}

const AuthorizedFetchContext = createContext<AuthorizedFetchContextData>({
  fetchAuthenticated: (_path: string, _options?: FetchOptionsType) => new Promise(
    () => new Response(null, {
      status: 400
    })
  ),
  fetchUsersByUsernameOrEmail: (_query: string) => new Promise(
    () => []
  ),
  addSharedUsers: (_table: TableProps, _users: UserView[]) => new Promise(
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

  const fetchUsersByUsernameOrEmail = async (query: string): Promise<UserView[]> => {
    const queryEncoded = encodeURIComponent(query);
    const resp = await fetchAuthenticated(`/api/v1/users?starts_with=${queryEncoded}`);

    if (! resp.ok) {
      // TODO: error handling logic here
      return [];
    } else {
      return await resp.json();
    }
  };

  const addSharedUsers = async (table: TableProps, users: UserView[]): Promise<Response> => {
    const payload = ({ userIds: users.map((u: UserView) => u.id) });

    return await fetchAuthenticated(`/api/v1/tables/${table.id}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  };

  return (
    <AuthorizedFetchContext.Provider value={{
      fetchAuthenticated,
      fetchUsersByUsernameOrEmail,
      addSharedUsers
    }}>
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
