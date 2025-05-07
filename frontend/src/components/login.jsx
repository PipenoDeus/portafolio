import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../connection/supabaseClient';
import bcrypt from 'bcryptjs';
import { useAuth } from '../context/AuthContext'; // ⬅️ Importa el contexto

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // ⬅️ Obtener la función de login

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('boxer_profiles')
        .select('*')
        .eq('email', formData.email)
        .single();

      if (queryError || !data) {
        setError('Usuario no encontrado');
        return;
      }

      const passwordMatch = await bcrypt.compare(formData.password, data.password);
      if (!passwordMatch) {
        setError('Contraseña incorrecta');
        return;
      }

      login(data); // ⬅️ Guarda al usuario en el contexto
      navigate('/perfil');
    } catch (err) {
      console.error(err);
      setError('Error al iniciar sesión');
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
