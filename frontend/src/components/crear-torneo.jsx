import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    TextField,
    Button,
    Typography,
    MenuItem,
    Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // ✅ importa el decoder

const cities = [
  { id: 'Villa Alemana', nombre: 'Villa Alemana' },
  { id: 'Quilpué', nombre: 'Quilpué' },
  { id: 'Viña del Mar', nombre: 'Viña del Mar' },
  { id: 'Valparaíso', nombre: 'Valparaíso' },
  { id: 'Concón', nombre: 'Concón' },
];

const CrearTorneo = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        inicio: '',
        final: '',
        lugar: '',
        descripcion: '',
    });

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();
    const { token } = useAuth(); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        const { nombre, inicio, final, lugar } = formData;

        if (!nombre || !inicio || !final || !lugar) {
            setError('Por favor completa todos los campos obligatorios.');
            return;
        }

        if (new Date(inicio) > new Date(final)) {
            setError('La fecha de inicio no puede ser posterior a la fecha final.');
            return;
        }

        let userId;
        try {
            const decoded = jwtDecode(token);
            userId = decoded?.user_id;
        } catch (err) {
            console.error('❌ Error al decodificar token:', err);
            setError('Token inválido. Inicia sesión nuevamente.');
            return;
        }

        if (!userId) {
            setError('Usuario no autenticado.');
            return;
        }

        const dataToSend = {
            ...formData,
            creado_pro: userId,
        };


        try {
            const res = await fetch('http://localhost:8000/api/crear-torneo/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(dataToSend),
            });

            const responseJson = await res.json();

            if (res.ok) {
                setSuccessMsg('¡Torneo creado con éxito!');
                setTimeout(() => navigate('/torneo'), 1500);
            } else {
                setError(responseJson.detail || 'Error al crear torneo.');
            }
        } catch (err) {
            console.error('❌ Error en fetch:', err);
            setError('Error de red o del servidor.');
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
            <Typography variant="h4" mb={3}>
                Crear Torneo
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

            <form onSubmit={handleSubmit}>
                <TextField
                    label="Nombre del Torneo"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Fecha de Inicio"
                    name="inicio"
                    type="date"
                    value={formData.inicio}
                    onChange={handleChange}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    margin="normal"
                    inputProps={{
                        min: new Date().toISOString().split('T')[0],
                    }}
                />
                <TextField
                    label="Fecha Final"
                    name="final"
                    type="date"
                    value={formData.final}
                    onChange={handleChange}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    margin="normal"
                    inputProps={{
                        min: formData.inicio || new Date().toISOString().split('T')[0],
                    }}
                />
                <TextField
                    label="Ciudad"
                    name="lugar"
                    select
                    value={formData.lugar}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                >
                    {cities.map((city) => (
                        <MenuItem key={city.id} value={city.id}>
                            {city.nombre}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    label="Descripción"
                    name="descripcion"
                    multiline
                    rows={4}
                    value={formData.descripcion}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                    Crear
                </Button>
            </form>
        </Box>
    );
};

export default CrearTorneo;
