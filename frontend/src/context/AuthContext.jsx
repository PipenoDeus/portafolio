import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);  // Añadimos un estado para el rol
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  const storedToken = localStorage.getItem('token');
  if (storedToken) {
    setToken(storedToken); 
    fetch('/api/user/me', {
      headers: {
        Authorization: `Bearer ${storedToken}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setUser(data);
      setRole(data.rol);
      setIsAuthenticated(true);
    })
    .catch(() => {
      logout();
    });
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

export const useAuth = () => useContext(AuthContext);
