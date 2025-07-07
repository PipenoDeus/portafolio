import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const TorneoDetalle = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [torneo, setTorneo] = useState(null);
  const [bracket, setBracket] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchTorneo = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/torneo/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        setTorneo(data.torneo);
        setBracket(data.bracket); // Recibimos el bracket como un array de arrays
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar detalles del torneo:', err);
        setLoading(false);
      }
    };

    fetchTorneo();
  }, [id, token]);

  const handleInscribir = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/torneo/${id}/inscribir/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSnackbarMessage('Inscripción exitosa');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('Error al inscribir al torneo');
        setSnackbarSeverity('error');
      }

      setOpenSnackbar(true);
    } catch (err) {
      console.error('Error al intentar inscribir al torneo:', err);
      setSnackbarMessage('Error de conexión');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  if (!torneo) return <Typography>Error al cargar el torneo</Typography>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>{torneo.nombre}</Typography>
      <Typography variant="subtitle1" color="text.secondary">
        {torneo.descripcion}
      </Typography>
      <Typography variant="body1">Lugar: {torneo.lugar}</Typography>
      <Typography variant="body1">Inicio: {torneo.inicio}</Typography>
      <Typography variant="body1">Final: {torneo.final}</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>Estado: {torneo.status}</Typography>

      {/* Botón para inscribir al torneo */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleInscribir}
        sx={{ mt: 3 }}
      >
        Inscribirse al Torneo
      </Button>

      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" gutterBottom>Bracket</Typography>

      {bracket.length === 0 ? (
        <Typography variant="body1" color="text.secondary">Aún no hay participantes en el bracket.</Typography>
      ) : (
        <Box>
          {bracket.map((matchArray, index) => (
            // Iteramos sobre cada array dentro de bracket
            matchArray.map((match, matchIndex) => (
              <Card key={matchIndex} sx={{ mb: 2 }}>
                <CardContent>
                  {/* Aquí estamos asignando correctamente los participantes */}
                  <Typography>
                    <strong>{match.participante1}</strong> vs <strong>{match.participante2}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Fecha: {match.fecha || 'Por definir'}</Typography>
                  <Typography variant="body2" color="text.secondary">Estado: {match.ganador ? `Ganador: ${match.ganador}` : 'En espera'}</Typography>
                </CardContent>
              </Card>
            ))
          ))}
        </Box>
      )}

      {/* Snackbar para mostrar el resultado de la inscripción */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TorneoDetalle;
