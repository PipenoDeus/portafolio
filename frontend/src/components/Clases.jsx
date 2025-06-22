import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import supabase from '../connection/supabaseClient';

const Clases = () => {
  const { role, user, token } = useAuth();
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [showClaseModal, setShowClaseModal] = useState(false);
  const [nuevaClase, setNuevaClase] = useState({
    titulo: '',
    descripcion: '',
    video_url: '',
    archivo: null,
  });

  useEffect(() => {
    const fetchClases = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response =
          role === 'entrenador'
            ? await axios.get(`/api/clases/entrenador/${user.id}`, { headers })
            : await axios.get('/api/clases', { headers });

        setClases(response.data);
      } catch (error) {
        console.error('Error al cargar clases:', error);
      } finally {
        setLoading(false);
      }
    };

    if (role && user && token) {
      fetchClases();
    }
  }, [role, user, token]);

const handleCreateClase = async (claseData) => {
  const token = localStorage.getItem('token');

  if (!claseData.video_url) {
    alert("Debes subir un video antes de crear la clase.");
    return;
  }

  const payload = {
    entrenador_id: user.id,
    titulo: claseData.titulo,
    descripcion: claseData.descripcion,
    video_url: claseData.video_url,
  };

  try {

    const response = await fetch('http://localhost:8000/api/clases/crear/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (response.ok) {
      alert("Clase creada exitosamente.");
      setClases([...clases, responseData.data[0]]);
      setNuevaClase({ titulo: '', descripcion: '', video_url: '', archivo: null });
      setShowClaseModal(false);
    } else {
      console.error('Error al crear clase:', responseData);
      alert('Error al crear clase. Revisa la consola.');
    }
  } catch (error) {
    console.error('Error de red:', error);
    alert('Error de red. Revisa la consola.');
  }
};

const handleArchivoChange = (e) => {
  const file = e.target.files[0];
  setNuevaClase((prev) => ({ ...prev, archivo: file }));
};

const handleSubirClase = async () => {
  const file = nuevaClase.archivo;
  if (!file) {
    console.warn("No se seleccionó ningún archivo.");
    return;
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = fileName;


  const { error: uploadError } = await supabase.storage
    .from('clases-videos')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Error al subir video:", uploadError);
    alert('Error al subir el video');
    return;
  }



  const { data: publicUrlData, error: publicUrlError } = await supabase
    .storage
    .from('clases-videos')
    .getPublicUrl(filePath);

  if (publicUrlError || !publicUrlData?.publicUrl) {
    console.error("Error obteniendo URL pública:", publicUrlError);
    alert('No se pudo obtener la URL pública');
    return;
  }

  const videoUrl = publicUrlData.publicUrl;

  await handleCreateClase({
    ...nuevaClase,
    video_url: videoUrl,
  });

  setShowClaseModal(false);
  setNuevaClase({ titulo: '', descripcion: '', video_url: '', archivo: null });
};

  if (loading) return <p className="text-center mt-4">Cargando clases...</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Clases Disponibles</h2>

      {(role === 'entrenador' || role === 'admin') && (
        <>
          <button
            className="btn btn-success mb-4"
            onClick={() => setShowClaseModal(true)}
          >
            Subir nueva clase
          </button>

          {showClaseModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  width: '400px',
                  maxHeight: '90%',
                  overflowY: 'auto',
                }}
              >
                <h3>Subir Nueva Clase</h3>
                <input
                  placeholder="Título de la clase"
                  value={nuevaClase.titulo}
                  onChange={(e) => setNuevaClase({ ...nuevaClase, titulo: e.target.value })}
                />
                <textarea
                  placeholder="Descripción"
                  value={nuevaClase.descripcion}
                  onChange={(e) => setNuevaClase({ ...nuevaClase, descripcion: e.target.value })}
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleArchivoChange}
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <button
                  onClick={handleSubirClase}
                  className="btn btn-success"
                  disabled={!nuevaClase.archivo || !nuevaClase.titulo || !nuevaClase.descripcion}
                >
                  Subir
                </button>
                <button
                  onClick={() => setShowClaseModal(false)}
                  className="btn btn-secondary ms-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}

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
                  {clase.video_url && (
                    <video controls width="100%" src={clase.video_url} className="rounded" />
                  )}
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
