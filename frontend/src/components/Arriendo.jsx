import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../connection/supabaseClient';

const Reservas = () => {
  const { user } = useAuth();
  const [rings, setRings] = useState([]);
  const [selectedRing, setSelectedRing] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [boxerId, setBoxerId] = useState(null);

  const fetchRings = async () => {
    const { data, error } = await supabase.from('rings').select('*');
    if (error) {
      console.error('Error al obtener rings:', error.message);
    } else {
      setRings(data);
    }
  };

  const fetchBoxerProfile = async () => {
    if (!user || !user.id) return;

    const { data, error } = await supabase
      .from('boxer_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error al obtener el perfil del boxeador:', error.message);
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

    if (!boxerId || !selectedRing || !fecha || !horaInicio || !horaFin) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const { error } = await supabase.from('reservas').insert([
      {
        boxer_id: boxerId,
        ring_id: selectedRing,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: 'pendiente',
      },
    ]);

    if (error) {
      console.error('Error al guardar reserva:', error.message);
      alert('Error al guardar reserva');
    } else {
      alert('Reserva registrada con éxito');
      setSelectedRing('');
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
    }
  };

  if (!user) {
    return <p>Cargando usuario...</p>;
  }

  return (
    <div className="container mt-4">
      <h2>Reservar</h2>
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

        <button type="submit" className="btn btn-primary">
          Reservar
        </button>
      </form>
    </div>
  );
};

export default Reservas;
