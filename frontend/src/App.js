// App.jsx
import { Routes, Route } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import PublicRoute from './context/AuthContext.jsx';
import NavbarComponent from './components/NavbarComponent'; 
import Footer from './components/Footer.jsx';
import Register from './components/Register.jsx';
import Login from './components/login.jsx';
import Home from './components/home.jsx';
import Profile from './components/Profile.jsx';
import Arriendo from './components/Arriendo.jsx';
import Calendario from './components/Calendario.jsx';
import Gimnasios from './components/Gimnasios.jsx';
import Clases from './components/Clases.jsx';
import AcercaDe from './components/acerca.jsx';
import Contacto from './components/contacto.jsx';
import Blogs from './components/Blog.jsx';
import PrivateLayout from './components/PrivateLayout';
import NotFound from './components/NotFound';
import Rutinas from './components/Rutinas.jsx';
import PanelAdmin from './components/PanelAdmin.jsx';
import Torneo from './components/Torneo.jsx';
import TorneoCrear from './components/crear-torneo.jsx';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavbarComponent />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/acerca" element={<AcercaDe />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="*" element={<NotFound />} />

          {/* Rutas públicas protegidas */}
          <Route
            path="/registro"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Rutas privadas*/}
          <Route element={<PrivateLayout />}>
            <Route path="/perfil" element={<Profile />} />
            <Route path="/arriendo" element={<Arriendo />} />
            <Route path="/gimnasios" element={<Gimnasios />} />
            <Route path="/clases" element={<Clases />} />
            <Route path="/blog" element={<Blogs />} />
            <Route path="/rutinas" element={<Rutinas />} />
            <Route path="/PanelAdmin" element={<PanelAdmin />} />
            <Route path="/Calendario" element={<Calendario />} />
            <Route path="/torneo" element={<Torneo />} />
            <Route path="/crear-torneo" element={<TorneoCrear />} />
            
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
