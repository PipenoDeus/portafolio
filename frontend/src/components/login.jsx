import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log('📤 Enviando datos al backend:', formData);

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      console.log('📥 Estado de respuesta HTTP:', response.status);

      const result = await response.json();
      console.log('📥 Respuesta del backend:', result);

      if (!response.ok) {
        console.warn('⚠️ Error devuelto por el backend:', result.error);
        setError(result.error || 'Error desconocido');
        return;
      }

      const { token } = result;
      const decoded = jwtDecode(token);

      if (decoded && decoded.email && decoded.rol) {
        localStorage.setItem('email', decoded.email);
        localStorage.setItem('role', decoded.rol);
        localStorage.setItem('token', token);

        console.log('💾 Email guardado en localStorage:', decoded.email);
        console.log('💾 Rol guardado en localStorage:', decoded.rol);

        login({ email: decoded.email, rol: decoded.rol }, token);
        console.log('🔀 Redirigiendo a /');
        navigate('/');
      } else {
        console.warn('⚠️ Token inválido o datos incompletos:', decoded);
        setError('Datos del usuario incompletos');
      }
    } catch (err) {
      console.error('❌ Error de red o servidor:', err);
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1 }}>
        <div className="container mt-5 mb-5">
          <h2 className="text-center mb-4" style={{ fontWeight: 'bold' }}>Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="mx-auto p-4 shadow rounded" style={{ maxWidth: '600px', backgroundColor: '#f9f9f9' }}>
            <div className="mb-3">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            {error && <p className="text-danger">{error}</p>}
            <button type="submit" className="btn btn-dark w-100">Entrar</button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
