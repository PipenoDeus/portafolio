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

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Router>
        <NavbarComponent />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/arriendo" element={<Arriendo />} />
            <Route path="/gimnasios" element={<Gimnasios />} />
            <Route path="/clases" element={<Clases />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
