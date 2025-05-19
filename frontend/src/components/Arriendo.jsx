import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../connection/supabaseClient';

const Reservas = () => {
  const { user, token } = useAuth();
  console.log("Token:", token);
  const [rings, setRings] = useState([]);
  const [selectedRing, setSelectedRing] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [boxerId, setBoxerId] = useState(null);
  const [emailOponente, setEmailOponente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchRings = async () => {
    const { data, error } = await supabase.from('rings').select('*');
    if (error) {
      console.error('Error al obtener rings:', error.message);
      setErrorMessage('Error al obtener rings');
    } else {
      setRings(data);
    }
  };

  const fetchBoxerProfile = async () => {
  if (!user || !user.id) return;

  const { data, error } = await supabase
    .from('user_profiles') 
    .select('id')
    .eq('id', user.id) 
    .single();

  if (error) {
    console.error('Error al obtener el perfil del boxeador:', error.message);
    setErrorMessage('Error al obtener el perfil del boxeador');
  } else if (data) {
    setBoxerId(data.id);
  }
};

  useEffect(() => {
    if (user) {
      fetchBoxerProfile();
      fetchRings();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!boxerId || !selectedRing || !fecha || !horaInicio || !horaFin || !emailOponente || !descripcion) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const { data: reservas, error: conflictError } = await supabase
      .from('reservas')
      .select('*')
      .eq('fecha', fecha)
      .eq('ring_id', selectedRing)
      .or(`hora_inicio.lte.${horaFin},hora_fin.gte.${horaInicio}`);

    if (conflictError) {
      console.error('Error al verificar conflictos:', conflictError.message);
      setLoading(false);
      setErrorMessage('Error al verificar conflictos de horario');
      return;
    }

    if (reservas.length > 0) {
      setLoading(false);
      setErrorMessage('El ring ya está reservado en ese horario');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    console.log("Headers enviados:", headers);

    const response = await fetch('http://localhost:8000/api/reserva_ring', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        boxer_id: boxerId,
        ring_id: selectedRing,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: 'pendiente',
        oponente_email: emailOponente,
        descripcion: descripcion,
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (response.ok) {
      alert('Reserva registrada con éxito');
      setSelectedRing('');
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setEmailOponente('');
      setDescripcion('');
    } else {
      console.error('Error al guardar reserva:', data.error);
      setErrorMessage(data.error || 'Error al guardar reserva');
    }
};

  if (!user) {
    return <p>Cargando usuario...</p>;
  }

  return (
    <div className="container mt-4">
      <h2>Reservar</h2>
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Selecciona un Ring:</label>
          <select
            value={selectedRing}
            onChange={(e) => setSelectedRing(e.target.value)}
            className="form-select"
            required
          >
            <option value="">-- Selecciona --</option>
            {rings.map((ring) => (
              <option key={ring.id} value={ring.id}>
                {ring.nombre} - {ring.ubicacion}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label>Fecha:</label>
          <input
            type="date"
            className="form-control"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label>Hora de Inicio:</label>
          <input
            type="time"
            className="form-control"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label>Hora de Fin:</label>
          <input
            type="time"
            className="form-control"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label>Email del Oponente:</label>
          <input
            type="email"
            className="form-control"
            value={emailOponente}
            onChange={(e) => setEmailOponente(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label>Descripción:</label>
          <textarea
            className="form-control"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            'Reservar'
          )}
        </button>
      </form>
    </div>
  );
};

export default Reservas;
