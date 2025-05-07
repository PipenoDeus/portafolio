import { useState, useEffect } from 'react';
import supabase from './connection/supabaseClient'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import HeroSection from './components/HeroSection.jsx';
import ActivitiesSection from './components/ActivitiesSections.jsx';
import HeroSection2 from './components/HeroSection2.jsx'
import NavbarComponent from './components/NavbarComponent'; 
import Footer from './components/Footer.jsx';


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
      <NavbarComponent/>
      <HeroSection/>
      <div style={{ backgroundColor: 'white', height: '200px', width: '100%' }}></div>
      <ActivitiesSection/>
      <div
        style={{
          backgroundColor: 'white',
          height: '200px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
        }}
      >
        Para todo aquel quien quiera convertirse en un mejor boxeador ¡te invitamos a participar!
      </div>
      <HeroSection2/>
      <Footer />
    </div>
  );
}

export default App;