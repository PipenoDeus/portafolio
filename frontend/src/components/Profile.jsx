import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../connection/supabaseClient';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    number: '',
    city: '',
    birthdate: '',
    created_at: '',
    membresy: false,
    rol: ''
  });

  const handleSubscribe = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para suscribirte');
      return;
    }

    const response = await fetch('http://localhost:8000/api/crear-pago/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        email: user.email  
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error en la solicitud:', error);
      alert('Hubo un problema al crear el pago');
      return;
    }

    const data = await response.json();


    if (data.redirect_url) {
      window.location.href = data.redirect_url;
    } else {
      alert('No se pudo obtener la URL de pago');
    }
  } catch (err) {
    console.error('❌ Error al procesar la suscripción:', err);
    alert('Error en el proceso de suscripción');
  }
};

  const [showDeleteWarning, setShowDeleteWarning] = useState(false); 

useEffect(() => {
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {

      navigate('/sesion');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/get-user-data/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Error al obtener datos del usuario');
        navigate('/sesion');
        return;
      }
      

      const userData = await response.json();


      updateUser(userData); 

      setAvatarUrl(userData.avatar_url || '');
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        number: userData.number || '',
        city: userData.city || '',
        birthdate: userData.birthdate || '',
        email: userData.email || '',
        created_at: userData.created_at || '',
        membresy: userData.membresy || false,
        rol: userData.rol || ''
      });
    } catch (err) {
      console.error('❌ Error al hacer fetch de datos del usuario:', err);
      navigate('/sesion');
    }
  };

  fetchUserData();
}, []);

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


    const { error: updateError, status } = await supabase
      .from('user_profiles')
      .update({ avatar_url: newAvatarUrl })
      .eq('email', user.email);

    if (updateError || status !== 204) {
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


  const { error: updateError, status } = await supabase
    .from('user_profiles')
    .update({
      first_name: formData.first_name,
      last_name: formData.last_name,
      city: formData.city,
      number: formData.number,
      birthdate: formData.birthdate,
      email: formData.email
    })
    .eq('id', user.id); 

  if (updateError || status !== 204) {
    console.error("Error al actualizar perfil:", updateError);
    alert('Error al actualizar el perfil');
    return;
  }


  const { data: updatedProfile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
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

  const handleDeleteAccount = () => {
  setShowDeleteWarning(true); 
};

  const confirmDeleteAccount = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ Token no encontrado');
      return;
    }


    const response = await fetch('http://localhost:8000/api/delete_user/', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ email: user.email }),  
    });

    if (response.ok) {
      logout();  
      window.location.replace('/');
    } else {
      const error = await response.json();
      console.error('⚠️ Error al eliminar cuenta:', error);
      alert('Error al eliminar la cuenta, intenta nuevamente.');
    }

  } catch (err) {
    console.error('❌ Error en la solicitud de eliminación de cuenta:', err);
    alert('Hubo un problema al intentar eliminar la cuenta.');
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
              <p><strong>Teléfono:</strong> {user.number}</p>
              <p><strong>Ciudad:</strong> {user.city}</p>
              <p><strong>Fecha de nacimiento:</strong> {user.birthdate}</p>
              <p><strong>Fecha de creación:</strong> {new Date(user.created_at).toISOString().split('T')[0]}</p>
              <p><strong>Membresía:</strong> {user.membresy ? 'Premium' : 'Gratis'}</p>
              <p><strong>Rol:</strong> {user.rol}</p>
              <button className="btn btn-warning mt-3" onClick={handleSubscribe}>
                Suscribirse a Premium
              </button>
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
                <label>Email</label>
                <input
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
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
                <label>Teléfono</label>
                <input
                  className="form-control"
                  name="number"
                  value={formData.number}
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

              <input type="hidden" name="created_at" value={formData.created_at} />
              <input type="hidden" name="membresy" value={formData.membresy} />
              <input type="hidden" name="rol" value={formData.rol} />

              <button className="btn btn-success mt-3" onClick={handleSave}>
                Guardar cambios
              </button>
              <button className="btn btn-secondary mt-3 ms-2" onClick={handleEditToggle}>
                Cancelar
              </button>
            </>
          )}
          {showDeleteWarning && (
            <div className="alert alert-danger mt-3">
              <strong>¡Advertencia!</strong> ¿Estás seguro de que deseas eliminar tu cuenta de forma permanente?
              <button className="btn btn-danger ms-2" onClick={confirmDeleteAccount}>
                Confirmar eliminación
              </button>
              <button className="btn btn-secondary ms-2" onClick={() => setShowDeleteWarning(false)}>
                Cancelar
              </button>
            </div>
          )}
          
        </div>
      ) : (
        <p>Cargando perfil...</p>
      )}
    </div>
  );
};

export default Profile;