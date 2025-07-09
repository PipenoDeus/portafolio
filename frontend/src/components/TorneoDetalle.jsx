import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import './bracket.css';

const TorneoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [torneo, setTorneo] = useState(null);
  const [bracket, setBracket] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [usuarioInscrito, setUsuarioInscrito] = useState(false);

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
        setBracket(data.bracket);
        setUsuarioInscrito(data.usuario_inscrito || false);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar detalles del torneo:', err);
        setLoading(false);
      }
    };

    fetchTorneo();
  }, [id, token]);

  const handleDeclararGanador = async (llaveId, ganadorId) => {
  try {
    console.log('🔍 Enviando a API declarar-ganador:');
    console.log('llave_id:', llaveId);
    console.log('ganador_id:', ganadorId);

    const response = await fetch('http://localhost:8000/api/torneo/declarar-ganador/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ llave_id: llaveId, ganador_id: ganadorId }),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const text = await response.text();
      console.error('Respuesta no JSON:', text);
      throw new Error('Respuesta inesperada del servidor');
    }

    if (response.ok) {
      console.log(' Respuesta exitosa:', data);
      setSnackbarMessage(data.message);
      setSnackbarSeverity('success');

      const torneoRes = await fetch(`http://localhost:8000/api/torneo/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const torneoData = await torneoRes.json();
      setTorneo(torneoData.torneo);
      setBracket(torneoData.bracket);
    } else {
      console.error(' Error desde API:', data);
      throw new Error(data.error || 'No se pudo declarar el ganador');
    }
  } catch (err) {
    console.error('Error al declarar ganador:', err);
    setSnackbarMessage('Error al declarar ganador');
    setSnackbarSeverity('error');
  } finally {
    setOpenSnackbar(true);
  }
};


  const handleEmpezarTorneo = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/torneo/${id}/empezar/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setSnackbarMessage(data.message || 'Torneo iniciado');
        setSnackbarSeverity('success');

        const torneoRes = await fetch(`http://localhost:8000/api/torneo/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const torneoData = await torneoRes.json();
        setTorneo(torneoData.torneo);
        setBracket(torneoData.bracket);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Error al iniciar torneo:', err);
      setSnackbarMessage('Error al iniciar torneo');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

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
        setUsuarioInscrito(true);
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

  const handleEliminar = async () => {
    const confirmar = window.confirm('¿Estás seguro de que deseas eliminar este torneo?');
    if (!confirmar) return;

    try {
      const response = await fetch('http://localhost:8000/api/torneo/eliminar/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: torneo.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage('Torneo eliminado correctamente');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        setTimeout(() => navigate('/torneos'), 2000);
      } else {
        throw new Error(data.error || 'No se pudo eliminar el torneo');
      }
    } catch (err) {
      console.error('Error al eliminar el torneo:', err);
      setSnackbarMessage('Error al eliminar el torneo');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (!torneo) return <Typography>Error al cargar el torneo</Typography>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>{torneo.nombre}</Typography>
      <Typography variant="subtitle1" color="text.secondary">{torneo.descripcion}</Typography>
      <Typography variant="body1">Lugar: {torneo.lugar}</Typography>
      <Typography variant="body1">Inicio: {torneo.inicio}</Typography>
      <Typography variant="body1">Final: {torneo.final}</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>Estado: {torneo.status}</Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleInscribir}
          sx={{ mt: 3 }}
          disabled={usuarioInscrito}
        >
          {usuarioInscrito ? 'Ya estás inscrito' : 'Inscribirse al Torneo'}
        </Button>

        {user && user.rol === 'admin' && torneo.status === 'pendiente' && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleEmpezarTorneo}
            sx={{ mt: 3 }}
          >
            Empezar Torneo
          </Button>
        )}

        {user && (user.rol === 'admin' || user.rol === 'entrenador') && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleEliminar}
            sx={{ mt: 3 }}
          >
            Eliminar Torneo
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" gutterBottom>Bracket</Typography>

      {bracket.length === 0 ? (
        <Typography variant="body1" color="text.secondary">Aún no hay participantes en el bracket.</Typography>
      ) : (
        <Box className="bracket">
          {bracket.map((round, roundIndex) => (
            <Box key={roundIndex} className="round">
              {round.map((match, matchIndex) => (
                <Box key={matchIndex} className={`match ${match.ganador ? 'ganado' : ''}`}>
                  <span>{match.participante1 || 'TBD'}</span>
                  <span>vs</span>
                  <span>{match.participante2 || 'TBD'}</span>

                  <Typography variant="caption" color="text.secondary">
                    {match.ganador ? `Ganó: ${match.ganador}` : 'En juego'}
                  </Typography>

                  {user && (user.rol === 'admin' || user.rol === 'entrenador') && !match.ganador && torneo.status === 'en_curso' && (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {match.participante1 && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleDeclararGanador(match.id, match.participante1_id)}
                        >
                          Ganó {match.participante1}
                        </Button>
                      )}
                      {match.participante2 && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleDeclararGanador(match.id, match.participante2_id)}
                        >
                          Ganó {match.participante2}
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}

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
