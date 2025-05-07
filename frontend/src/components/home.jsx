// components/Home.jsx
import HeroSection from './HeroSection';
import ActivitiesSection from './ActivitiesSections';
import HeroSection2 from './HeroSection2';

const Home = () => {
  return (
    <>
      <HeroSection />
      <div style={{ backgroundColor: 'white', height: '200px', width: '100%' }}></div>
      <ActivitiesSection />
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
      <HeroSection2 />
    </>
  );
};

export default Home;
