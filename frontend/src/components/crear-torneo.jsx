import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    TextField,
    Button,
    Typography,
    MenuItem,
    Alert,
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';


const CrearTorneo = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        inicio: '',
        final: '',
        lugar: '',
        descripcion: '',
    });

    const [cities, setCities] = useState([]);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();
    const { user, token } = useAuth(); // SE IMPORTA EL TOKEN Y EL USER

    useEffect(() => {
        const fetchCities = async () => {
            const { data, error } = await supabase.from('Ciudad').select('*');
            if (error) {
                console.error('Error fetching cities:', error);
            } else {
                setCities(data);
            }
        };

        fetchCities();
    }, []);

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

        if (!user || !user.id) {
            setError('Usuario no autenticado.');
            return;
        }

        if (!user || !user.id) {
            setError('Usuario no autenticado.');
            return;
        }

        const dataToSend = {
            ...formData,
            user_id: user.id,
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

            if (res.ok) {
                setSuccessMsg('¡Torneo creado con éxito!');
                setTimeout(() => navigate('/torneo'), 1500);
            } else {
                const errData = await res.json();
                setError(errData.detail || 'Error al crear torneo.');
            }
        } catch (err) {
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
