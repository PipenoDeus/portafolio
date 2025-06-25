import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const Calendario = () => {
  const [eventos, setEventos] = useState([]);
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/reservas-publicas/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al obtener reservas');
        }

        const reservas = await response.json();

        const mapped = reservas.map((r) => ({
          title: `Ring ${r.ring_nombre || 'N/A'}`,
          sparring: `${r.boxeador_nombre || '???'} vs ${r.oponente_nombre || '???'}`,
          start: new Date(`${r.fecha}T${r.hora_inicio}`),
          end: new Date(`${r.fecha}T${r.hora_fin}`),
        }));

        setEventos(mapped);
      } catch (error) {
        console.error('Error al cargar las reservas:', error.message);
      }
    };

    fetchReservas();
  }, []);

  return (
    <div style={{ paddingTop: '80px', padding: '20px', zIndex: 1 }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Calendario de reservas</h2>
      <div style={{ height: '85vh' }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          views={['month', 'week', 'day']}
          culture="es"
          view={view}
          onView={(newView) => setView(newView)}
          style={{ height: '100%' }}
          components={{
            event: ({ event }) => (
              <div>
                <strong>{event.title}</strong>
                <div>{event.sparring}</div>
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default Calendario;
