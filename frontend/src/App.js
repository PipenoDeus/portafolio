import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import NavbarComponent from './components/NavbarComponent'; 
import Footer from './components/Footer.jsx';
import Register from './components/Register.jsx';
import Login from './components/login.jsx';
import Home from './components/home.jsx';
import Profile from './components/Profile.jsx';
import Arriendo from './components/Arriendo.jsx'
import Gimnasios from './components/Gimnasios.jsx';
import Clases from './components/Clases.jsx';
import AcercaDe from './components/acerca.jsx';
import Contacto from './components/contacto.jsx';
import Blogs from './components/Blog.jsx';
import PrivateLayout from './components/PrivateLayout';
import NotFound from './components/NotFound';
import Rutinas from './components/Rutinas.jsx';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Router>
        <NavbarComponent />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/acerca" element={<AcercaDe />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="*" element={<NotFound />} />

            {/* Rutas privadas */}
            <Route element={<PrivateLayout />}>
              <Route path="/perfil" element={<Profile />} />
              <Route path="/arriendo" element={<Arriendo />} />
              <Route path="/gimnasios" element={<Gimnasios />} />
              <Route path="/clases" element={<Clases />} />
              <Route path="/blog" element={<Blogs />} />
              <Route path="/rutinas" element={<Rutinas />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
