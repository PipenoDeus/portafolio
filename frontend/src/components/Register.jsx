import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  TextField,
  Button,
  Box,
  Typography,
  ThemeProvider,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import theme from '../theme';

const cities = [
  { id: 'Villa Alemana', nombre: 'Villa Alemana' },
  { id: 'Quilpué', nombre: 'Quilpué' },
  { id: 'Viña del Mar', nombre: 'Viña del Mar' },
  { id: 'Valparaíso', nombre: 'Valparaíso' },
  { id: 'Concón', nombre: 'Concón' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    number: '',
    city: '',
    birthdate: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
const navigate = useNavigate();


const handleSubmit = async (e) => {
  e.preventDefault();

  const birthDate = new Date(formData.birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  const isTooYoung =
    age < 14 ||
    (age === 14 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)));

  if (isTooYoung) {
    alert('Debes tener al menos 14 años para registrarte.');
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      alert('¡Registro exitoso!');
      navigate('/login');
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Ocurrió un error al registrar.');
  }
};

  return (
    <ThemeProvider theme={theme}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 600,
          mx: 'auto',
          mt: 4,
          backgroundColor: '#f9f9f9',
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" gutterBottom align="center" fontWeight="bold">
          Registro
        </Typography>

        <TextField
          variant="standard"
          fullWidth
          label="Correo Electrónico"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
        />

        <TextField
          variant="standard"
          fullWidth
          label="Contraseña"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          required
        />

        <TextField
          variant="standard"
          fullWidth
          label="Nombre"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          margin="normal"
          required
        />

        <TextField
          variant="standard"
          fullWidth
          label="Apellido"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          margin="normal"
          required
        />

        <TextField
          variant="standard"
          fullWidth
          label="Número de Teléfono"
          name="number"
          type="tel"
          value={formData.number}
          onChange={handleChange}
          margin="normal"
          required
        />

        <FormControl fullWidth margin="normal" variant="standard" required>
          <InputLabel>Ciudad</InputLabel>
          <Select
            name="city"
            value={formData.city}
            onChange={handleChange}
            label="Ciudad"
          >
            {cities.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          variant="standard"
          fullWidth
          label="Fecha de Nacimiento"
          name="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={handleChange}
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ mt: 3, mx: 'auto', display: 'block' }}
        >
          Registrarse
        </Button>
      </Box>
    </ThemeProvider>
  );
};

export default Register;
