import React, { useEffect, useState } from 'react';
import supabase from '../connection/supabaseClient';
import { ThemeProvider } from '@emotion/react';
import theme from '../theme';
import { Typography } from '@mui/material';
import './Gimnasios.css'

const Gimnasios = () => {
  const [gimnasios, setGimnasios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cityName, setCityName] = useState('');


  useEffect(() => {
    const fetchGimnasios = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/gimnasios/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Error al obtener los gimnasios');
        }
        const data = await response.json();
        setGimnasios(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCities = async () => {
      const { data, error } = await supabase
        .from('Ciudad')
        .select('id, nombre');

      if (error) {
        console.error('Error fetching cities:', error);
        return;
      }

      const cityMap = {};
      data.forEach(city => {
        cityMap[city.id] = city.nombre;
      });

      setCityName(cityMap);
    };
    fetchCities()
    fetchGimnasios();
  }, []);

  if (loading) return <p>Cargando gimnasios...</p>;

  if (error) return <p>{`Error: ${error}`}</p>;

  return (
    <ThemeProvider theme={theme}>
      <div className="custom1">
        <Typography variant="h3" gutterBottom>
          Gimnasios asociados
        </Typography>
        <Typography
          variant="h3"
          gutterBottom
          sx={{ fontSize: '17px', fontWeight: 500 }}>
          <div className="row">
            {gimnasios.length === 0 ? (
              <p>No hay gimnasios registrados.</p>
            ) : (
              gimnasios.map((gym) => (
                <div key={gym.id} className="col-md-4 mb-4">
                  <div className="card h-100">
                    {gym.imagen_url && (
                      <img
                        src={gym.imagen_url}
                        alt={gym.nombre}
                        className="card-img-top"
                        style={{
                          height: '200px', objectFit: 'cover'
                        }}
                      />
                    )}
                    <div className="card-body">
                      <h4 className="card-title">{gym.nombre}</h4>
                      <p className="card-text">
                        <strong>Dirección:</strong> {gym.direccion}<br />
                        <strong>Ciudad:</strong> {cityName[gym.ciudad] || 'Desconocida'}<br />
                        <strong>Teléfono:</strong> {gym.telefono}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Typography>
      </div>
    </ThemeProvider>
  );
};

export default Gimnasios;
