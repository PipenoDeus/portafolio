import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';  

const PrivateLayout = () => {
  const [isAuthorized, setIsAuthorized] = useState(null);  
  const location = useLocation();
  const { user, role, isAuthenticated } = useAuth();  

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAuthorized(false);
      return;
    }

    if (location.pathname !== '/PanelAdmin') {
      setIsAuthorized(true);
      return;
    }

    if (role === 'admin') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [location.pathname, user, role, isAuthenticated]);

  if (isAuthorized === null) {
    return <div>Cargando…</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateLayout;
