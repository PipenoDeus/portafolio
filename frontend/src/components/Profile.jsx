import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../connection/supabaseClient';
import { Box, Typography, Avatar, Button, Stack, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';


const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  
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

  useEffect(() => {
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found, redirecting...');
      navigate('/sesion');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/get-user-data/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('❌ Error al obtener datos del usuario:', await response.json());
        navigate('/sesion');
        return;
      }

      const data = await response.json();
      console.log('✅ Datos del usuario obtenidos:', data);

      setAvatarUrl(data.avatar_url || '');
      setFormData({
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        number: data.number || '',
        city: data.city || '',
        birthdate: data.birthdate || '',
        created_at: data.created_at || '',
        membresy: data.membresy || false,
        rol: data.rol || ''
      });

      // Opcional: actualizar el contexto global si usas AuthContext
      updateUser(data);

    } catch (err) {
      console.error('❌ Error al llamar a la API de usuario:', err);
      navigate('/sesion');
    }
  };

  fetchUserData();
}, [navigate]);


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
    console.log('Respuesta de la API de pago:', data);

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

  const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8000/api/avatar/upload/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error en respuesta del servidor:", data);
      alert(`Error: ${data.error}`);
      return;
    }

    const newAvatarUrl = data.public_url;
    console.log('Avatar actualizado con URL:', newAvatarUrl);

    setAvatarUrl(newAvatarUrl);
    updateUser({ ...user, avatar_url: newAvatarUrl });
    alert('Imagen de perfil actualizada');
  } catch (err) {
    console.error("Error general:", err);
    alert('Error al subir la imagen');
  }
};


  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSave = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Debes iniciar sesión');
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/api/user/update/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Error al actualizar:", error);
      alert('Hubo un error al actualizar el perfil');
      return;
    }

    const updatedData = await response.json();
    console.log('✅ Perfil actualizado:', updatedData);

    setFormData(updatedData);
    updateUser(updatedData);

    setIsEditing(false);
    alert('Perfil actualizado con éxito');

  } catch (err) {
    console.error('❌ Error al actualizar perfil:', err);
    alert('Error de red al actualizar perfil');
  }
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

    console.log('🗑️ Eliminando cuenta para el email:', user.email);

    const response = await fetch('http://localhost:8000/api/delete_user/', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ email: user.email }),  
    });

    if (response.ok) {
      console.log('✅ Cuenta eliminada correctamente');
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
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 5, px: 2 }}>
      <Typography variant="h4" gutterBottom>
        Perfil de Usuario
      </Typography>

      {user ? (
        <>
          {avatarUrl && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar
                alt="Avatar del usuario"
                src={avatarUrl}
                sx={{ width: 150, height: 150, border: '2px solid #ccc' }}
              />
              <Button variant="contained" component="label">
                Cambiar imagen de perfil
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
          )}

          {!isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>Nombre:</strong> {user.first_name} {user.last_name}</Typography>
              <Typography><strong>Email:</strong> {user.email}</Typography>
              <Typography><strong>Teléfono:</strong> {user.number}</Typography>
              <Typography><strong>Ciudad:</strong> {user.city}</Typography>
              <Typography>
                <strong>Fecha de nacimiento:</strong> {user.birthdate || 'No disponible'}
              </Typography>
              <Typography>
                <strong>Fecha de creación:</strong>{' '}
                {user.created_at && !isNaN(new Date(user.created_at)) 
                  ? new Date(user.created_at).toISOString().split('T')[0] 
                  : 'No disponible'}
              </Typography>
              <Typography><strong>Membresía:</strong> {user.membresy ? 'Premium' : 'Gratis'}</Typography>
              <Typography><strong>Rol:</strong> {user.rol}</Typography>

              <Stack direction="row" spacing={2} mt={3}>
                <Button variant="contained" color="warning" onClick={handleSubscribe}>
                  Suscribirse a Premium
                </Button>
                <Button variant="outlined" onClick={handleEditToggle}>
                  Editar perfil
                </Button>
                <Button variant="outlined" color="error" onClick={handleDeleteAccount}>
                  Eliminar cuenta
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Nombre"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Apellido"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Teléfono"
                name="number"
                value={formData.number}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Ciudad"
                name="city"
                value={formData.city}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Fecha de nacimiento"
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <input type="hidden" name="created_at" value={formData.created_at} />
              <input type="hidden" name="membresy" value={formData.membresy} />
              <input type="hidden" name="rol" value={formData.rol} />

              <Stack direction="row" spacing={2}>
                <Button variant="contained" color="success" onClick={handleSave}>
                  Guardar cambios
                </Button>
                <Button variant="outlined" onClick={handleEditToggle}>
                  Cancelar
                </Button>
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          )}

          <Dialog open={showDeleteWarning} onClose={() => setShowDeleteWarning(false)}>
            <DialogTitle>¡Advertencia!</DialogTitle>
            <DialogContent>
              ¿Estás seguro de que deseas eliminar tu cuenta de forma permanente?
            </DialogContent>
            <DialogActions>
              <Button color="error" onClick={confirmDeleteAccount}>
                Confirmar eliminación
              </Button>
              <Button onClick={() => setShowDeleteWarning(false)}>
                Cancelar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Typography>Cargando perfil...</Typography>
      )}
    </Box>
  );
};

export default Profile;