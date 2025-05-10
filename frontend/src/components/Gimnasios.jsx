import React, { useEffect, useState } from 'react';

const Gimnasios = () => {
  const [gimnasios, setGimnasios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGimnasios = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/gimnasios/');
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

    fetchGimnasios();
  }, []);

  if (loading) return <p>Cargando gimnasios...</p>;

  if (error) return <p>{`Error: ${error}`}</p>;

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
