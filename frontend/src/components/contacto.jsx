import React from 'react';

const Contacto = () => {
  return (
    <div className="container mt-5">
      <h2 className="mb-4">Acerca de Nosotros</h2>
      <div className="row">
        <div className="col-md-6">
          <p>
            Somos un equipo comprometido con la creación de soluciones tecnológicas eficientes y fáciles de usar.
            Este proyecto fue desarrollado con el objetivo de brindar acceso a contenido educativo de calidad,
            disponible para todos en cualquier momento.
          </p>
          <p>
            Nuestra misión es democratizar el acceso al conocimiento mediante plataformas digitales modernas.
            Valoramos la innovación, el compromiso y la mejora continua.
          </p>
        </div>
        <div className="col-md-6">
          <h5>Información del Proyecto</h5>
          <ul>
            <li><strong>Nombre del Proyecto:</strong> Plataforma de Clases Online</li>
            <li><strong>Versión:</strong> 1.0.0</li>
            <li><strong>Desarrolladores:</strong> Juan, Ana y Pedro</li>
            <li><strong>Tecnologías:</strong> React, Django, Supabase</li>
            <li><strong>Fecha de Lanzamiento:</strong> Mayo 2025</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Contacto;