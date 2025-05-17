import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';  // Asegúrate de importar el contexto de autenticación

const PrivateLayout = () => {
  const [isAuthorized, setIsAuthorized] = useState(null);  // null = validando
  const location = useLocation();
  const { user, role, isAuthenticated } = useAuth();  // Usamos el contexto aquí

  useEffect(() => {
    // 1) Si no hay usuario o token en el contexto
    if (!isAuthenticated) {
      setIsAuthorized(false);
      return;
    }

    // 2) Si la ruta no es /PanelAdmin, permite el acceso directamente
    if (location.pathname !== '/PanelAdmin') {
      setIsAuthorized(true);
      return;
    }

    // 3) Si es /PanelAdmin, consulta el rol al backend
    if (role === 'admin') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [location.pathname, user, role, isAuthenticated]);

  // Mientras validamos
  if (isAuthorized === null) {
    return <div>Cargando…</div>;
  }

  // Si no está autorizado, o no hay usuario…
  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  // Autorizado
  return <Outlet />;
};

export default PrivateLayout;
