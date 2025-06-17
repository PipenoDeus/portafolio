import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import CitySelect from './CitySelect';
import { TextField, Button, Box, Typography, ThemeProvider } from '@mui/material';
import theme from '../theme';
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';

const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;
  return emailRegex.test(email);
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    birthdate: '',
    city: '',
    rol: '1',
  });

  const [cities, setCities] = useState([]);
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase
        .from('Ciudad')
        .select('id, nombre');

      if (error) {
        console.error('Error fetching cities:', error);
      } else {
        setCities(data || []);
      }
    };
    fetchCities();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      if (!isValidEmail(value)) {
        setEmailError('Correo electrónico no válido');
      } else {
        setEmailError('');
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCityChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      city: e.target.value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setEmailError('');

  if (!isValidEmail(formData.email.trim())) {
    setEmailError('Correo electrónico no válido');
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email.trim(),
        password: formData.password,  // hashed on backend
        first_name: formData.first_name,
        last_name: formData.last_name,
        birthdate: formData.birthdate,
        city: formData.city,
        rol: Number(formData.rol),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert('¡Registro exitoso!');
      navigate('/login');
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al registrar:', err);
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
          fontFamily: 'Anton, sans-serif',
          fontSize: '15px',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Formulario de registro
        </Typography>

        <TextField
          variant="standard"
          fullWidth
          label="Correo Electrónico"
          name="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
          error={!!emailError}
          helperText={emailError}
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

        <CitySelect cities={cities} city={formData.city} onChange={handleCityChange} />

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

        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <FormLabel component="legend">Rol</FormLabel>
          <RadioGroup row name="rol" value={formData.rol} onChange={handleChange}>
            <FormControlLabel value="2" control={<Radio />} label="Entrenador" />
            <FormControlLabel value="1" control={<Radio />} label="Cliente" />
          </RadioGroup>
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ mt: 2, mx: 'auto', display: 'block' }}
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </Button>
      </Box>
    </ThemeProvider>
  );
};

export default Register;
