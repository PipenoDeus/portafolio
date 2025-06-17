import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, TextField, Button, Typography, Alert, ThemeProvider } from '@mui/material';
import theme from '../theme';

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

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        console.warn('Error devuelto por el backend:', result.error);
        setError(result.error || 'Error desconocido');
        return;
      }

      const { user, token } = result;
      console.log('Usuario recibido:', user);

      if (user && user.email && user.rol) {
        localStorage.setItem('email', user.email);
        localStorage.setItem('role', user.rol);
        localStorage.setItem('token', token);

        login(user, token);

        navigate('/');
      } else {
        console.warn('Usuario inválido o incompleto:', user);
        setError('Datos del usuario incompletos');
      }
    } catch (err) {
      console.error('Error de red o servidor:', err);
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 2,
          backgroundColor: '#f9f9f9'
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            Iniciar Sesión
          </Typography>

          <TextField
            variant='standard'
            label="Correo Electrónico"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
          />

          <TextField
            variant='standard'
            label="Contraseña"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3, mx: 'auto', display: 'block' }}
          >
            Entrar
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );

};

export default Login;

