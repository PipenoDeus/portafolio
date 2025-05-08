import React, { useEffect, useState } from 'react';
import supabase from '../connection/supabaseClient';

const Gimnasios = () => {
  const [gimnasios, setGimnasios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGimnasios = async () => {
      const { data, error } = await supabase.from('gimnasios').select('*');

      if (error) {
        console.error('Error al obtener gimnasios:', error);
      } else {
        setGimnasios(data);
      }

      setLoading(false);
    };

    fetchGimnasios();
  }, []);

  if (loading) return <p>Cargando gimnasios...</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gimnasios Asociados</h2>
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
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{gym.nombre}</h5>
                  <p className="card-text">
                    <strong>Dirección:</strong> {gym.direccion}<br />
                    <strong>Ciudad:</strong> {gym.ciudad}<br />
                    <strong>Teléfono:</strong> {gym.telefono}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Gimnasios;
