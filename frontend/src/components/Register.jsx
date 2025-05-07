import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import supabase from '../connection/supabaseClient';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    city: '',
    height_cm: '',
    weight_kg: '',
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
      const hashedPassword = await bcrypt.hash(formData.password, 10);

      const { error } = await supabase.from('boxer_profiles').insert([
        {
          email: formData.email,
          password: hashedPassword,
          first_name: formData.first_name,
          last_name: formData.last_name,
          city: formData.city,
          height_cm: formData.height_cm,
          weight_kg: formData.weight_kg,
        },
      ]);

      if (error) {
        alert('Error al crear perfil: ' + error.message);
      } else {
        alert('¡Registro exitoso!');
      }
    } catch (err) {
      console.error('Error al hashear la contraseña', err);
      alert('Ocurrió un error al registrar.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1 }}>
        <div className="container mt-5 mb-5">
          <h2 className="text-center mb-4" style={{ fontWeight: 'bold' }}>Registro de Boxeador</h2>
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
              <label className="form-label">Altura (cm)</label>
              <input type="number" className="form-control" name="height_cm" value={formData.height_cm} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Peso (kg)</label>
              <input type="number" className="form-control" name="weight_kg" value={formData.weight_kg} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-dark w-100">Registrarse</button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
