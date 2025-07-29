import { Navigate} from "react-router-dom";
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/context/AuthContext';

export interface PrivateRouteProps {
  fallbackUrl: string;
}

const PrivateRoute = (props: PropsWithChildren<PrivateRouteProps>): any => {
  const { fallbackUrl, children } = props;
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to={fallbackUrl} replace />;
}

export default PrivateRoute;
