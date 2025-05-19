import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Rutinas = () => {
  const [rutinas, setRutinas] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    nivel: ''
  });

  const token = localStorage.getItem('token');
  const { user, role } = useAuth();

  console.log('🔐 Usuario:', user);
  console.log('🔑 Token:', token);
  console.log('🎭 Rol:', role);

  const fetchRutinas = async () => {
    try {
      console.log('📡 Solicitando rutinas...');

      const response = await fetch('http://localhost:8000/api/get_rutina', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log('Respuesta de la API:', result);

      if (response.ok) {
        if (Array.isArray(result.data)) {
          console.log('Rutinas recibidas correctamente:', result.data);
          setRutinas(result.data);
        } else {
          console.error('La propiedad "data" no es un array:', result.data);
        }
      } else {
        console.error('Error al obtener rutinas (response.ok = false):', result.error);
      }
    } catch (error) {
      console.error('Error al obtener rutinas (try-catch):', error);
      setError('Error al cargar las rutinas');
    }
  };

  useEffect(() => {
    if (!user) {
      console.warn('⚠️ Usuario no autenticado');
      setError('Usuario no autenticado');
    } else {
      fetchRutinas();
    }
  }, [user]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();

    console.log('📤 Enviando nueva rutina:', formData);

    if (!user?.id) {
      console.warn('❌ Usuario no válido para crear rutinas');
      setError('Usuario no válido para crear rutinas');
      return;
    }

    const dataConEntrenador = {
      ...formData,
      entrenador_id: user.id
    };

    console.log('📦 Datos con entrenador:', dataConEntrenador);

    fetch('http://localhost:8000/api/create_rutina', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dataConEntrenador)
    })
      .then(response => {
        console.log('📥 Respuesta de /create_rutina:', response.status);
        if (!response.ok) throw new Error('Error al crear rutina');
        return response.json();
      })
      .then(() => {
        alert('Rutina creada exitosamente');
        setFormData({ nombre: '', descripcion: '', nivel: '' });
        fetchRutinas(); 
      })
      .catch(err => {
        console.error('❌ Error al crear rutina:', err);
        setError(err.message);
      });
  };

  const puedeCrearRutinas = role === 'admin' || role === 'entrenador';

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Gestión de Rutinas</h1>

      {puedeCrearRutinas ? (
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.5rem',
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2>Crear Nueva Rutina</h2>
          <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
          <textarea name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} required rows="3" />
          <input type="text" name="nivel" placeholder="Nivel (Ej: Principiante, Avanzado)" value={formData.nivel} onChange={handleChange} required />
          <button type="submit" style={{
            padding: '0.75rem',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>Crear Rutina</button>
        </form>
      ) : (
        <p style={{ color: 'gray', textAlign: 'center' }}>No tienes permisos para crear rutinas.</p>
      )}

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <h2>Listado de Rutinas</h2>
      {rutinas.length === 0 ? (
        <p>No hay rutinas disponibles.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {rutinas.map((rutina, index) => (
            <div key={index} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ margin: '0 0 0.5rem' }}>{rutina.nombre}</h3>
              <p><strong>Descripción:</strong> {rutina.descripcion}</p>
              <p><strong>Nivel:</strong> {rutina.nivel || 'No especificado'}</p>
              <p><strong>Entrenador ID:</strong> {rutina.entrenador_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rutinas;
