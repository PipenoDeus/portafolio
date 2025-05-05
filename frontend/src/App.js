import { useState, useEffect } from 'react';
import supabase from './connection/supabaseClient';  // Asegúrate de que tu archivo supabaseClient.js está correctamente configurado

function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  // Obtener datos desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('Boxer')  // Aquí cambias por el nombre de tu tabla real
        .select('*');
      
      if (error) {
        setError(error.message);  // Mostrar error si ocurre
        console.error('Error fetching data:', error);
      } else {
        setData(data);  // Guardar datos en el estado si todo va bien
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Boxers</h1>
      
      {/* Si hay error, mostrarlo */}
      {error && <p>Error: {error}</p>}

      {/* Si hay datos, mostrarlos en una lista */}
      <ul>
        {data.length > 0 ? (
          data.map((item) => (
            <li key={item.id}> {/* Asegúrate de que el campo 'id' existe en tu tabla */}
              {item.first_name} {item.last_name} {/* Ajusta estos campos según tu tabla */}
            </li>
          ))
        ) : (
          <p>No data found</p>  // Si no hay datos, muestra esto
        )}
      </ul>
    </div>
  );
}

export default App;