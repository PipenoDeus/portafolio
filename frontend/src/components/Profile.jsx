import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../connection/supabaseClient';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/sesion');
    } else {
      setAvatarUrl(user.avatar_url);
    }
  }, [user, navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError);
      alert('Error al subir la imagen');
      return;
    }

    // ✅ Corrección: asegurar que se obtenga la URL pública correctamente
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

    // ✅ Guardar nueva URL en la tabla de perfiles
    const { error: updateError } = await supabase
      .from('boxer_profiles')
      .update({ avatar_url: newAvatarUrl })
      .eq('email', user.email);

    if (updateError) {
      console.error("Error actualizando avatar en la base de datos:", updateError);
      alert('Error al guardar la URL en la base de datos');
      return;
    }

    // ✅ Forzar refetch del perfil actualizado desde la base de datos
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('boxer_profiles')
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
          <p><strong>Nombre:</strong> {user.first_name} {user.last_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Ciudad:</strong> {user.city}</p>
          <p><strong>Altura:</strong> {user.height_cm} cm</p>
          <p><strong>Peso:</strong> {user.weight_kg} kg</p>
          <p><strong>MMR:</strong> {user.mmr}</p>
          <p><strong>Tipo de Membresía:</strong> {user.membership_type}</p>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
      ) : (
        <p>Cargando perfil...</p>
      )}
    </div>
  );
};

export default Profile;
