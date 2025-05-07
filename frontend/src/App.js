import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import supabase from './connection/supabaseClient.js'
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import HeroSection from './components/HeroSection.jsx';
import ActivitiesSection from './components/ActivitiesSections.jsx';
import HeroSection2 from './components/HeroSection2.jsx'
import NavbarComponent from './components/NavbarComponent'; 
import Footer from './components/Footer.jsx';
import Register from './components/Register.jsx';

import Home from './components/home.jsx';

function App() {
  return (
    <Router>
      <NavbarComponent />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/registro" element={<Register />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
