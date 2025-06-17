import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import supabase from '../connection/supabaseClient';

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
    const [gym, setGym] = useState([]);

    useEffect(() => {
        const fetchReservas = async () => {

            const { data: reservas, error: reservasError } = await supabase
                .from('reservas')
                .select(`
                *,
                ring_id (nombre),
                user_profiles (first_name, last_name)
            `);

            const opponentEmails = [...new Set(
                reservas.map(r => r.opponent_email).filter(Boolean)
            )];

            console.log('Opponent Emails:', opponentEmails);
            

            const { data: opponents, error: opponentsError } = await supabase
                .from('user_profiles')
                .select('email, first_name, last_name')
                .in('email', opponentEmails);

            if (opponentsError) {
                console.error('Error fetching opponent names:', opponentsError.message);
                return;
            }

            const opponentMap = {};
            opponents.forEach(user => {
                opponentMap[user.email] = `${user.last_name}`;
            });

            console.log('Opponent Map:', opponentMap);

            const mapped = reservas.map((r) => ({
                title: `Ring ${r.ring_id?.nombre || 'N/A'}`,
                sparring: `${r.user_profiles?.last_name || '???'} vs ${opponentMap[r.opponent_email] || '???'}`,
                start: new Date(`${r.fecha}T${r.hora_inicio}`),
                end: new Date(`${r.fecha}T${r.hora_fin}`),
            }));

            console.log('Mapped Events:', mapped);
            setEventos(mapped);
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
                    onView={(newView) => { // CONTROLADOR DE VISTAS DEL CALENDARIO
                        console.log('View changed to:', newView);
                        setView(newView);
                    }}
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

