import React, { useEffect, useState } from 'react';

const Clases = () => {
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClases = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/clases/');
        if (!response.ok) {
          throw new Error('Error al obtener clases');
        }
        const data = await response.json();
        setClases(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClases();
  }, []);

  if (loading) return <p className="text-center mt-4">Cargando clases...</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Clases Disponibles</h2>
      {clases.length === 0 ? (
        <p>No hay clases disponibles.</p>
      ) : (
        <div className="row">
          {clases.map((clase) => (
            <div key={clase.id} className="col-md-6 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{clase.titulo}</h5>
                  <p className="card-text">{clase.descripcion}</p>
                  <video
                    controls
                    width="100%"
                    src={clase.video_url}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clases;
