import { Navigate, Outlet } from 'react-router-dom';

const PrivateLayout = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateLayout;