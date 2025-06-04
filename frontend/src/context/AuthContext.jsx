import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  

  useEffect(() => {
  const storedToken = localStorage.getItem('token');
  const storedUser = JSON.parse(localStorage.getItem('user'));

  if (storedToken) {
    setToken(storedToken);
    setIsAuthenticated(true);

    if (storedUser) {
      setUser(storedUser);
      setRole(storedUser.rol);
    } else {
      fetch('/api/user/me', {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('No autorizado');
          }
          return res.json();
        })
        .then(data => {
          setUser(data);
          setRole(data.rol);
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch((err) => {
          console.error("⚠️ Error al obtener usuario desde /api/user/me:", err);
        });
    }
  }
}, []);

  const login = async (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
    setRole(userData.rol);
    setToken(token);
    setIsAuthenticated(true);
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    window.location.replace('/');
  };

  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    setRole(updatedUser.rol);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };
  

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const useAuth = () => useContext(AuthContext);


export default PublicRoute;