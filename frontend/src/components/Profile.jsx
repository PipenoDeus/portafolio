import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../connection/supabaseClient';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    city: '',
    birthdate: ''
  });

  useEffect(() => {
    if (!user) {
      console.log('Usuario no autenticado, redirigiendo...');
      navigate('/sesion');
    } else {
      console.log('Usuario autenticado:', user);
      setAvatarUrl(user.avatar_url);
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        city: user.city || '',
        birthdate: user.birthdate || ''
      });
    }
  }, [user, navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError);
      alert('Error al subir la imagen');
      return;
    }

    const { data: publicUrlData, error: publicUrlError } = await supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (publicUrlError || !publicUrlData?.publicUrl) {
      console.error("Error obteniendo URL pública:", publicUrlError);
      alert('No se pudo obtener la URL pública del avatar');
      return;
    }

    const newAvatarUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: newAvatarUrl })
      .eq('email', user.email);

    if (updateError) {
      console.error("Error actualizando avatar en la base de datos:", updateError);
      alert('Error al guardar la URL en la base de datos');
      return;
    }

    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email)
      .single();

    if (fetchError || !updatedProfile) {
      console.error("Error al obtener el perfil actualizado:", fetchError);
      alert('Error al obtener los datos actualizados');
      return;
    }

    setAvatarUrl(updatedProfile.avatar_url);
    updateUser({ ...user, ...updatedProfile });

    alert('Imagen de perfil actualizada');
  };

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(formData)
      .eq('email', user.email);

    if (updateError) {
      console.error("Error al actualizar perfil:", updateError);
      alert('Error al actualizar el perfil');
      return;
    }

    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email)
      .single();

    if (fetchError || !updatedProfile) {
      console.error("Error al obtener perfil actualizado:", fetchError);
      alert('Error al obtener datos actualizados');
      return;
    }

    updateUser({ ...user, ...updatedProfile });
    setIsEditing(false);
    alert('Perfil actualizado con éxito');
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("¿Deseas borrar de forma permanente tu cuenta?");
    if (!confirmDelete) return;

    try {
      const response = await fetch('http://localhost:8000/api/delete_user/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error al eliminar cuenta:', data.error || 'Error desconocido');
        alert(data.error || 'Error al eliminar la cuenta');
        return;
      }

      alert('Tu cuenta ha sido eliminada exitosamente');
      navigate('/sesion'); // o redirige a donde quieras después del borrado

    } catch (error) {
      console.error('Error de red:', error);
      alert('Hubo un problema al comunicarse con el servidor');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Perfil de Usuario</h2>
      {user ? (
        <div>
          {avatarUrl && (
            <div className="mb-3">
              <img
                src={avatarUrl}
                alt="Avatar del usuario"
                style={{
                  width: '150px',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  border: '2px solid #ccc'
                }}
              />
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="avatarUpload" className="btn btn-primary">
              Cambiar imagen de perfil
            </label>
            <input
              id="avatarUpload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          

          {!isEditing ? (
            <>
              <p><strong>Nombre:</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Ciudad:</strong> {user.city}</p>
              <p><strong>Fecha de nacimiento:</strong> {user.birthdate}</p>
              <p><strong>Fecha de creación:</strong> {new Date(user.created_at).toISOString().split('T')[0]}</p>
              <p><strong>Membresía:</strong> {user.membership ? 'Premium' : 'Gratis'}</p>
              <p><strong>Rol:</strong> {user.rol}</p>
              <button className="btn btn-secondary mt-3" onClick={handleEditToggle}>
                Editar perfil
              </button>
              <button className="btn btn-danger mt-3 ms-2" onClick={handleDeleteAccount}>
              Eliminar cuenta
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  className="form-control"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input
                  className="form-control"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Ciudad</label>
                <input
                  className="form-control"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Fecha de nacimiento</label>
                <input
                  type="date"
                  className="form-control"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                />
              </div>
              <button className="btn btn-success mt-3" onClick={handleSave}>
                Guardar cambios
              </button>
              <button className="btn btn-secondary mt-3 ms-2" onClick={handleEditToggle}>
                Cancelar
              </button>
            </>
          )}
        </div>
      ) : (
        <p>Cargando perfil...</p>
      )}
    </div>
  );
};

export default Profile;
