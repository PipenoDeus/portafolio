import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const TournamentPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { token, user } = useAuth();


  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/torneo/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        const data = await response.json();

        if (response.ok) {
          setTournaments(data);
        } else {
          console.error('Error fetching tournaments:', data.detail || data.error);
        }
      } catch (err) {
        console.error('Network error:', err);
      }
    };

    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((t) =>
    t.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Torneos</Typography>

{user && (user.rol === 'entrenador' || user.rol === 'admin') && (
  <Button variant="contained" color="primary" onClick={() => navigate('/crear-torneo')}>
    Crear Torneo
  </Button>
)}
      </Box>

      <TextField
        label="Buscar torneo"
        variant="outlined"
        fullWidth
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Grid container spacing={3}>
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament) => (
            <Grid item xs={12} md={6} lg={4} key={tournament.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{tournament.nombre}</Typography>
                  <Typography color="text.secondary">
                    Inicio: {new Date(tournament.inicio).toLocaleDateString()}
                  </Typography>
                  <Typography color="text.secondary">
                    Final: {new Date(tournament.final).toLocaleDateString()}
                  </Typography>
                  <Typography color="text.secondary">
                    Lugar: {tournament.lugar || 'Desconocido'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/torneo/${tournament.id}`)}>
                    Ver Detalles
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="body1">No hay torneos disponibles.</Typography>
        )}
      </Grid>
    </Box>
  );
};

export default TournamentPage;
 