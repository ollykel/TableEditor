import { useLocation } from "react-router-dom";
import { Navigate} from "react-router-dom";
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/context/AuthContext';

export interface PrivateRouteProps {}

const PrivateRoute = (props: PropsWithChildren<PrivateRouteProps>): React.ReactNode => {
  const location = useLocation();
  const { children } = props;
  const { isAuthenticated } = useAuth();
  const redirectUrl = encodeURIComponent(`${location.pathname}?${location.search}`);
  const fallbackUrl = `/app/login?redirect=${redirectUrl}`;

  return isAuthenticated ? children : <Navigate to={fallbackUrl} replace />;
}

export default PrivateRoute;
