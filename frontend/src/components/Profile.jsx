import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Avatar,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../connection/supabaseClient';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [cityName, setCityName] = useState('');
  const [roleName, setRoleName] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    city: '',
    birthdate: '',
    created_at: '',
    membresy: false,
    rol: ''
  });

  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/sesion');
      return;
    }

    setAvatarUrl(user.avatar_url);

    async function getCityName() {
      if (user.city) {
        const { data, error } = await supabase
          .from('Ciudad')
          .select('nombre')
          .eq('id', user.city)
          .single();

        if (error) {
          console.error('Error fetching city:', error);
          setCityName('Desconocida');
        } else {
          setCityName(data?.nombre || 'Desconocida');
        }
      } else {
        setCityName('');
      }
    }

    async function getRoleName() {
      if (user.rol) {
        const { data, error } = await supabase
          .from('Rol')
          .select('nombre')
          .eq('id', user.rol)
          .single();

        if (error) {
          console.error('Error fetching city:', error);
          setRoleName('Desconocido');
        } else {
          setRoleName(data?.nombre || 'Desconocido');
        }
      } else {
        setRoleName('');
      }
    }

    getCityName();
    getRoleName();

    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      city: user.city || '',
      birthdate: user.birthdate || '',
      email: user.email || '',
      created_at: user.created_at || '',
      membresy: user.membresy || false,
      rol: user.rol || ''
    });

  }, [user, navigate]);

  const handlePaymentToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para pagar tu mensualidad');
        return;
      }

      const response = await fetch('http://localhost:8000/api/crear-pago/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email
        })
      });

      if (!response.ok) {
        const error = await response.json();
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
      alert('Error en el proceso de suscripción');
    }
  };

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
      alert('Error al subir la imagen');
      return;
    }

    const { data: publicUrlData, error: publicUrlError } = await supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (publicUrlError || !publicUrlData?.publicUrl) {
      alert('No se pudo obtener la URL pública del avatar');
      return;
    }

    const newAvatarUrl = publicUrlData.publicUrl;

    const { error: updateError, status } = await supabase
      .from('user_profiles')
      .update({ avatar_url: newAvatarUrl })
      .eq('email', user.email);

    if (updateError || status !== 204) {
      alert('Error al guardar la URL en la base de datos');
      return;
    }

    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email)
      .single();

    if (fetchError || !updatedProfile) {
      alert('Error al obtener los datos actualizados');
      return;
    }

    setAvatarUrl(updatedProfile.avatar_url);
    updateUser({ ...user, ...updatedProfile });

    alert('Imagen de perfil actualizada');
  };

  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para suscribirte');
        return;
      }

      if (!user || !user.email) {
        alert('No se encontró el email del usuario');
        return;
      }

      const response = await fetch('http://localhost:8000/api/crear-pago/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email
        })
      });

      if (!response.ok) {
        let errorMessage = 'Hubo un problema al crear el pago';
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (e) {
          // No JSON error response
        }
        alert(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        alert('No se pudo obtener la URL de pago');
      }
    } catch (err) {
      console.error(err);
      alert('Error en el proceso de suscripción');
    }
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
        birthdate: formData.birthdate,
        email: formData.email
      })
      .eq('id', user.id);

    if (updateError || status !== 204) {
      setError('Error al actualizar el perfil');
      return;
    }

    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError || !updatedProfile) {
      setError('Error al obtener datos actualizados');
      return;
    }

    updateUser({ ...user, ...updatedProfile });
    setIsEditing(false);
    setError('');
    alert('Perfil actualizado con éxito');
  };

  const handleDeleteAccount = () => {
    setShowDeleteWarning(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/delete_user/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: user.email })
      });

      if (response.ok) {
        logout();
        window.location.replace('/');
      } else {
        alert('Error al eliminar la cuenta, intenta nuevamente.');
      }
    } catch {
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              alt={`${user.first_name} ${user.last_name}`}
              src={avatarUrl}
              sx={{ width: 150, height: 150, border: '2px solid #ccc' }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="contained" component="label">
                Cambiar imagen de perfil
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange}
                />
              </Button>

              {roleName === 'entrenador' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/torneo')}
                >
                  Crear Torneo
                </Button>
              )}
            </Box>
          </Box>

          {!isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>Nombre:</strong> {user.first_name} {user.last_name}</Typography>
              <Typography><strong>Email:</strong> {user.email}</Typography>
              <Typography><strong>Ciudad:</strong> {cityName}</Typography>
              <Typography>
                <strong>Fecha de nacimiento:</strong>{' '}
                {user.birthdate}
              </Typography>
              <Typography>
                <strong>Fecha de creación:</strong>{' '}
                {new Date(user.created_at).toISOString().split('T')[0]}
              </Typography>
              <Typography><strong>Membresía:</strong> {user.membresy ? 'Premium' : 'Gratis'}</Typography>
              <Typography><strong>Rol:</strong> {roleName}</Typography>

              <Stack direction="row" spacing={2} mt={3}>
                <Button variant="contained" color="warning" onClick={handleSubscribe}>
                  Suscribirse a Premium
                </Button>
                <Button variant="outlined" onClick={handleEditToggle}>
                  Editar perfil
                </Button>
                <Button variant="outlined" onClick={handlePaymentToggle}>
                  Pagar
                </Button>
                <Button variant="outlined" color="error" onClick={handleDeleteAccount}>
                  Eliminar cuenta
                </Button>

              </Stack>
            </Box>
          ) : (
            <Box
              component="form"
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
              noValidate
              autoComplete="off"
            >
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
                label="Ciudad"
                name="city"
                value={formData.city}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Fecha de nacimiento"
                name="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

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

          <Dialog
            open={showDeleteWarning}
            onClose={() => setShowDeleteWarning(false)}
          >
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
