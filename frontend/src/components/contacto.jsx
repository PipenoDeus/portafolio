import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Typography } from '@mui/material';
import theme from '../theme';
import './contacto.css';
import { MdPhone } from 'react-icons/md';

const Contacto = () => {
  return (
    <ThemeProvider theme={theme}>
      <div className="custom1">
        <h1 className="mb-4">Comunícate con nosotros</h1>
        <div className="row">
          <div className="col-md-6">
            <p>
              ¿Tienes alguna duda? Estamos encantados de ayudarte.

            </p>
            <p>
              Aquí tienes nuestros medios de contacto.
            </p>
            <div className='activity-row'>
              <div
                className="activity-card"
                style={{
                  backgroundColor: 'darkcyan',
                }}
              >
                <h2>
                  <MdPhone style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  <Typography variant="calls" sx={{ fontSize: '1.5rem' }}>
                    Para llamadas:
                  </Typography>
                </h2>
                <h6>
                  <Typography variant="calls" sx={{ fontSize: '18px' }}>
                    Charla con uno de nuestros miembros!
                  </Typography>
                </h6>
                <h6>
                  <Typography variant="calls" sx={{ fontSize: '17px', fontWeight: 400 }}>
                    Fono 1: +56 9 7952 7537
                  </Typography>
                </h6>
                <h6>
                  <Typography variant="calls" sx={{ fontSize: '17px', fontWeight: 400 }}>
                    Fono 2: +56 9 9999 9999
                  </Typography>
                </h6>
                <h6>
                  <Typography variant="calls" sx={{ fontSize: '17px', fontWeight: 400}}>
                    Fono 3: +56 9 8888 8888
                  </Typography>
                </h6>
              </div>
              <div
                className="activity-card"
                style={{
                  backgroundColor: 'darkorchid',
                }}
              >
                <Typography variant="calls" sx={{ fontSize: '1.5rem' }}>
                  Soporte:
                </Typography>
                <h6>
                  <Typography variant="calls" sx={{ fontSize: '17px', fontWeight: 500}}>
                    A veces nuestras líneas podrán estar ocupadas,
                    intenta nuestros correos electrónicos!
                  </Typography>
                </h6>
                <h6>
                  <Typography variant="calls" sx={{ fontSize: '17px', fontWeight: 400}}>
                    - carl.hidalgo@duocuc.cl <br />
                    - masterspawnx@gmail.com <br />
                    - karloxx534@gmail.com <br />
                    - karlozoh@gmail.com <br />
                  </Typography>
                </h6>
              </div>
            </div>
          </div>
          <div
            className="col-md-6"
            style={{
              backgroundImage:
                "url('https://cdn.evolve-mma.com/wp-content/uploads/2021/09/manny-pacquiao-retires-from-boxing.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '300px',
            }}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Contacto;
