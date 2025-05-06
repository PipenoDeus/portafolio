import { useState, useEffect } from 'react';
import supabase from './connection/supabaseClient'; // Asegúrate que la ruta sea correcta
import NavbarComponent from './components/NavbarComponent'; // <-- Importa el Navbar
import { Container } from 'react-bootstrap'; // <-- Importa Container
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import HeroSection from './components/HeroSection';
import ActivitiesSection from './components/ActivitiesSections.jsx';


//funcion para la base de datos
function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); 
      const { data: fetchedData, error: fetchError } = await supabase
        .from('Boxer') 
        .select('*');

      if (fetchError) {
        setError(fetchError.message);
        console.error('Error fetching data:', fetchError);
        setData([]); 
      } else {
        setData(fetchedData || []); 
        setError(null); 
      }
      setLoading(false); 
    };

    fetchData();
  }, []);

  return (
    <div>
    <NavbarComponent />
    <HeroSection />
    <div style={{ backgroundColor: 'white', height: '200px', width: '100%' }}></div>
    <ActivitiesSection />
  </div>
  
  );
}

export default App;