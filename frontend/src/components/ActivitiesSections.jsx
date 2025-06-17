import React from 'react';
import './ActivitiesSection.css';

function ActivitiesSection() {
  return (
    <div className="activities-container">
      <h2>Actividades</h2>
      <div className="activity-grid">
        <div
          className="activity-card"
          style={{
            backgroundImage:
              "url('https://marxial.pe/cdn/shop/articles/Que_es_el_Sparring_en_el_Boxeo.jpg?v=1629233870')",
          }}
        >
          <span className="activity-text">Sparring</span>
        </div>
        <div
          className="activity-card"
          style={{
            backgroundImage:
              "url('https://t4.ftcdn.net/jpg/04/29/51/81/360_F_429518118_k4gpunbwSm2xBDLX71kzWhFPGLvi1Cab.jpg')",
          }}
        >
          <span className="activity-text">Torneos</span>
        </div>
        <div
          className="activity-card"
          style={{
            backgroundImage:
              "url('https://suelosport.com/wp-content/uploads/2023/10/entrenamiento-funcional-Suelosport.jpg')",
          }}
        >
          <span className="activity-text">Entrenamiento</span>
        </div>
        <div
          className="activity-card"
          style={{
            backgroundImage:
              "url('https://media.revistagq.com/photos/65b12cfd195fefc5e6d8fe02/3:2/w_2559,h_1706,c_limit/fitness%20portada.jpg')",
          }}
        >
          <span className="activity-text">Gimnasios</span>
        </div>
      </div>
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button type="button" className="btn btn-outline-warning">
          Consultar todas las actividades
        </button>
      </div>
    </div>
  );
}

export default ActivitiesSection;
