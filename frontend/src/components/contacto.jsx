import React from 'react';
import { ThemeProvider, Typography } from '@mui/material';
import { MdPhone } from 'react-icons/md';
import theme from '../theme';
import './contacto.css';

const Contacto = () => {
  return (
    <ThemeProvider theme={theme}>
      <div className="container mt-5">
  <h2 className="mb-4">Contáctanos</h2>
  <div className="row">
    <div className="col-md-6">
      <p>
        ¿Tienes preguntas, sugerencias o deseas colaborar con nosotros? ¡Nos encantaría saber de ti! Puedes contactarnos a través de nuestras redes sociales o enviarnos un correo.
      </p>
      <div className="d-flex flex-column gap-3">
        <div className="p-3 rounded text-white" style={{ backgroundColor: 'darkcyan' }}>
          <h5>
            📞 Para llamadas:
          </h5>
          <p>Charla con uno de nuestros miembros</p>
          <ul className="list-unstyled mb-0">
            <li>Fono 1: +56 9 7952 7537</li>
            <li>Fono 2: +56 9 9999 9999</li>
            <li>Fono 3: +56 9 8888 8888</li>
          </ul>
        </div>

        <div className="p-3 rounded text-white" style={{ backgroundColor: 'darkorchid' }}>
          <h5>📧 Soporte:</h5>
          <p>A veces nuestras líneas estarán ocupadas, ¡intenta nuestros correos!</p>
          <ul className="list-unstyled mb-0">
            <li>carl.hidalgo@duocuc.cl</li>
            <li>masterspawnx@gmail.com</li>
            <li>karloxx534@gmail.com</li>
            <li>karlozoh@gmail.com</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="col-md-6">
      <h5>Ubicación</h5>
      <p>Viña del Mar, Chile</p>
      <iframe
        title="SparringLab Location"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3330.152679399767!2d-71.5527409848001!3d-33.01534868089674!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9689de77443dfd8f%3A0x5cd18d51e7c98f99!2sVi%C3%B1a%20del%20Mar%2C%20Valpara%C3%ADso!5e0!3m2!1ses-419!2scl!4v1684433702695!5m2!1ses-419!2scl"
        width="100%"
        height="300"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
      ></iframe>
    </div>
  </div>

  <div className="mt-4">
    <h5>Síguenos en redes sociales</h5>
    <a
      href="https://instagram.com/sparringlab"
      target="_blank"
      rel="noopener noreferrer"
      className="me-3"
    >
      <i className="bi bi-instagram" style={{ fontSize: '1.5rem' }}></i>
    </a>
    <a
      href="https://twitter.com/sparringlab"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i className="bi bi-twitter" style={{ fontSize: '1.5rem' }}></i>
    </a>
  </div>
</div>
    </ThemeProvider>
  );
};

export default Contacto;
