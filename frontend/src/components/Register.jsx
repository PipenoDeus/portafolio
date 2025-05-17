import React, { useState } from 'react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    city: '',
    birthdate: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch('http://localhost:8000/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      alert('¡Registro exitoso!');
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al registrar', err);
    alert('Ocurrió un error al registrar.');
  }
};


  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1 }}>
        <div className="container mt-5 mb-5">
          <h2 className="text-center mb-4" style={{ fontWeight: 'bold' }}>Registro</h2>
          <form onSubmit={handleSubmit} className="mx-auto p-4 shadow rounded" style={{ maxWidth: '600px', backgroundColor: '#f9f9f9' }}>
            <div className="mb-3">
              <label className="form-label">Correo Electrónico</label>
              <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-control" name="first_name" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Apellido</label>
              <input type="text" className="form-control" name="last_name" value={formData.last_name} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Ciudad</label>
              <input type="text" className="form-control" name="city" value={formData.city} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Fecha de Nacimiento</label>
              <input type="date" className="form-control" name="birthdate" value={formData.birthdate} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-dark w-100">Registrarse</button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;