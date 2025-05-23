import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../connection/supabaseClient';

const PanelAdmin = () => {
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const navigate = useNavigate();
  const [gyms, setGyms] = useState([]);
  const [newGym, setNewGym] = useState({ nombre: '', direccion: '', ciudad: '',telefono:'',imagen_url: '', });
  const [editGym, setEditGym] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rutinas, setRutinas] = useState([]);
  const [rutinaEditando, setRutinaEditando] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [editReserva, setEditReserva] = useState(null);
  
  

  useEffect(() => {
  const checkAdmin = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/verify_token/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        navigate('/');
        return;
      }

      const data = await response.json();

      if (data.rol === 'admin') {
        setIsAdmin(true);
        fetchUsers(token); 
        fetchGyms(token);
        fetchRutinas(token);
        fetchReservas(token); 
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('Error de verificación:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  checkAdmin();
}, [navigate]);





  const fetchUsers = async (tokenParam = null) => {
    const token = tokenParam || localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error('Los datos obtenidos no son un array');
        }
      } else {
        console.error('Error al obtener usuarios');
      }
    } catch (error) {
      console.error('Error de red:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
  const token = localStorage.getItem('token');
  const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este usuario?');
  if (!confirmDelete) return;

  try {
    const response = await fetch(`http://localhost:8000/api/admin-delete-user/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',  
      },
      body: JSON.stringify({ id: userId }), 
    });

    if (response.ok) {
      alert('Usuario eliminado correctamente');
      fetchUsers();
    } else {
      alert('Error al eliminar usuario');
    }
  } catch (error) {
    console.error('Error al eliminar:', error);
  }
};


  const handleEditClick = (user) => {
    setEditUser(user);
  };

  const handleUpdateUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/admin-update-user/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editUser),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Usuario actualizado correctamente');
        setEditUser(null);
        fetchUsers();
      } else {
        console.error('Respuesta del backend:', data);
        alert(data.error || 'Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const fetchGyms = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/gimnasios/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGyms(data);
      } else {
        console.error('Error al obtener gimnasios');
      }
    } catch (error) {
      console.error('Error de red:', error);
    }
  };

  const handleCreateGym = async () => {
  const token = localStorage.getItem('token');

  console.log("Intentando crear gimnasio con:", newGym);

  if (!newGym.imagen_url) {
    alert("Debes subir una imagen antes de crear el gimnasio.");
    return;
  }

  console.log("Enviando datos del gimnasio:", newGym);

  try {
    const response = await fetch('http://localhost:8000/api/gimnasios/crear/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newGym),
    });

    const responseData = await response.json();

    if (response.ok) {
      alert("Gimnasio creado exitosamente.");
      setNewGym({ nombre: '', direccion: '', ciudad: '', telefono: '', imagen_url: '' });
      fetchGyms();
      setShowCreateModal(false);
    } else {
      console.error('Error al crear gimnasio:', responseData);
      alert('Error al crear gimnasio. Revisa la consola.');
    }
  } catch (error) {
    console.error('Error de red:', error);
    alert('Error de red. Revisa la consola.');
  }
};

const handleGymImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const token = localStorage.getItem('token');
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from('gimnasios')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Error al subir imagen:", uploadError);
    alert('Error al subir la imagen');
    return;
  }

  const { data: publicUrlData, error: publicUrlError } = await supabase
    .storage
    .from('gimnasios')
    .getPublicUrl(filePath);

  if (publicUrlError || !publicUrlData?.publicUrl) {
    console.error("Error obteniendo URL pública:", publicUrlError);
    alert('No se pudo obtener la URL pública');
    return;
  }

  const imageUrl = publicUrlData.publicUrl;

  console.log("Imagen subida, URL pública:", imageUrl);

  setNewGym((prev) => {
    const updated = { ...prev, imagen_url: imageUrl };
    console.log("newGym actualizado:", updated);
    return updated;
  });
};


const handleUpdateGym = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('http://localhost:8000/api/gimnasios/actualizar/', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: editGym.id,
        nombre: editGym.nombre,
        direccion: editGym.direccion,
        ciudad: editGym.ciudad,
        telefono: editGym.telefono,
        imagen_url: editGym.imagen_url,
      }),
    });

    if (response.ok) {
      setEditGym(null);
      fetchGyms();
    } else {
      const errorData = await response.json();
      console.error('Error en la respuesta:', errorData);
      alert('Error al actualizar gimnasio');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};


const handleDeleteGym = async (id) => {
  const token = localStorage.getItem('token');
  const confirmDelete = window.confirm('¿Eliminar este gimnasio?');
  if (!confirmDelete) return;

  try {
    const response = await fetch(`http://localhost:8000/api/gimnasios/eliminar/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }), 
    });

    if (response.ok) {
      fetchGyms();
    } else {
      const errorData = await response.json();
      console.error('Error al eliminar:', errorData);
      alert(`Error al eliminar gimnasio: ${errorData.detail || 'Error desconocido'}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const fetchRutinas = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/api/get_rutina', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.ok && Array.isArray(result.data)) {
      setRutinas(result.data); 
    } else {
      console.error('Respuesta no válida de get_rutina');
    }
  } catch (err) {
    console.error('Error al obtener rutinas:', err);
  }
};


const handleUpdateRutina = async () => {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch('http://localhost:8000/api/update_rutina', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(rutinaEditando),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la rutina');
    }

    const data = await response.json();
    console.log("Rutina actualizada:", data);


    setRutinas(prev =>
      prev.map(rutina => (rutina.id === data.id ? data : rutina)) 
    );

    fetchRutinas(token); 

    setRutinaEditando(null); 

  } catch (error) {
    console.error('Error en actualización:', error);
  }
};


const handleDeleteRutina = async (id) => {
  const token = localStorage.getItem('token');
  

  try {
    const response = await fetch('http://localhost:8000/api/delete_rutina', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la rutina');
    }

    setRutinas(prev => prev.filter(r => r.id !== id));
    console.log('Rutina eliminada');

  } catch (error) {
    console.error('Error en eliminación:', error);
  }
};

  const fetchReservas = async (tokenParam = null) => {
    const token = tokenParam || localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/reservas/listar/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setReservas(Array.isArray(data) ? data : []);
      } else {
        console.error('Error al obtener reservas');
      }
    } catch (err) {
      console.error('Error de red:', err);
    }
  };

  const handleDeleteReserva = async (reservaId) => {
    const token = localStorage.getItem('token');
    const confirmar = window.confirm('¿Eliminar esta reserva?');
    if (!confirmar) return;

    try {
      const res = await fetch('http://localhost:8000/api/reservas/eliminar/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: reservaId }),
      });

      if (res.ok) {
        alert('Reserva eliminada');
        fetchReservas();
      } else {
        alert('Error al eliminar');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const handleEditClickReserva = (reserva) => {
    setEditReserva(reserva);
  };

  const handleUpdateReserva = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/reservas/modificar/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editReserva),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Reserva actualizada');
        setEditReserva(null);
        fetchReservas();
      } else {
        alert(data.error || 'Error al actualizar');
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {editUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              width: '400px',
              maxHeight: '90%',
              overflowY: 'auto',
            }}
          >
            <h3>Editar Usuario</h3>
            <input
              placeholder="Email"
              value={editUser.email || ''}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <input
              placeholder="Nombre"
              value={editUser.first_name || ''}
              onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <input
              placeholder="Apellido"
              value={editUser.last_name || ''}
              onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <input
              placeholder="Ciudad"
              value={editUser.city || ''}
              onChange={(e) => setEditUser({ ...editUser, city: e.target.value })}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <input
              placeholder="Fecha de Nacimiento"
              value={editUser.birthdate || ''}
              onChange={(e) => setEditUser({ ...editUser, birthdate: e.target.value })}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <select
              value={editUser.rol || ''}
              onChange={(e) => setEditUser({ ...editUser, rol: e.target.value })}
              style={{ width: '100%', marginBottom: '10px' }}
            >
              <option value="admin">admin</option>
              <option value="entrenador">entrenador</option>
              <option value="boxeador">boxeador</option>
            </select>
            <select
              value={editUser.membresy ? 'premium' : 'free'}
              onChange={(e) =>
                setEditUser({ ...editUser, membresy: e.target.value === 'premium' })
              }
              style={{ width: '100%', marginBottom: '10px' }}
            >
              <option value="free">Gratis</option>
              <option value="premium">Premium</option>
            </select>
            <button
              onClick={handleUpdateUser}
              style={btnStyle}
            >
              Guardar
            </button>
            <button
              onClick={() => setEditUser(null)}
              style={{ ...btnStyle, backgroundColor: '#ccc', marginLeft: '10px' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isAdmin ? (
        <div>
          <h2 style={{ textAlign: 'center' }}>Panel de Administración</h2>
          <h2 style={{ textAlign: 'center' }}>Usuarios</h2>
          <div
                      style={{
              maxHeight: '500px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              marginTop: '20px',
              padding: '10px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              <thead style={{ backgroundColor: '#f4f4f4' }}>
                <tr>
                  <th style={thStyle}>Avatar</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Apellido</th>
                  <th style={thStyle}>Ciudad</th>
                  <th style={thStyle}>Nacimiento</th>
                  <th style={thStyle}>Creado</th>
                  <th style={thStyle}>Membresía</th>
                  <th style={thStyle}>Rol</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(users) && users.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={tdStyle}>
                      No hay usuarios
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>
                        <img
                          src={user.avatar_url || 'https://via.placeholder.com/40'}
                          alt="avatar"
                          style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                        />
                      </td>
                      <td style={tdStyle}>{user.email}</td>
                      <td style={tdStyle}>{user.first_name}</td>
                      <td style={tdStyle}>{user.last_name}</td>
                      <td style={tdStyle}>{user.city}</td>
                      <td style={tdStyle}>{user.birthdate}</td>
                      <td style={tdStyle}>
                        {new Date(user.created_at).toISOString().split('T')[0]}
                      </td>
                      <td style={tdStyle}>{user.membresy ? 'Premium' : 'Gratis'}</td>
                      <td style={tdStyle}>{user.rol}</td>
                      <td style={tdStyle}>
                        <button style={btnStyle} onClick={() => handleEditClick(user)}>
                          Editar
                        </button>
                        <button
                          style={{ ...btnStyle, backgroundColor: '#e74c3c' }}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <h2 style={{ textAlign: 'center', marginTop: '40px' }}>Gimnasios</h2>
          <div
            style={{
              maxHeight: '500px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                margin: '20px 0',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button onClick={() => setShowCreateModal(true)} style={btnStyle}>
                Crear Gimnasio
              </button>
              {showCreateModal && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                  }}
                >
                  <div
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '10px',
                      width: '400px',
                      maxHeight: '90%',
                      overflowY: 'auto',
                    }}
                  >
                    <h3>Crear Nuevo Gimnasio</h3>
                      <input
                        placeholder="Nombre"
                        value={newGym.nombre}
                        onChange={(e) => setNewGym({ ...newGym, nombre: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <input
                        placeholder="Dirección"
                        value={newGym.direccion}
                        onChange={(e) => setNewGym({ ...newGym, direccion: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <input
                        placeholder="Ciudad"
                        value={newGym.ciudad}
                        onChange={(e) => setNewGym({ ...newGym, ciudad: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <input
                        placeholder="Teléfono"
                        value={newGym.telefono}
                        onChange={(e) => setNewGym({ ...newGym, telefono: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGymImageUpload}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <button
                        onClick={handleCreateGym}
                        style={{
                          ...btnStyle,
                          backgroundColor: newGym.imagen_url ? btnStyle.backgroundColor : '#ccc',
                          cursor: newGym.imagen_url ? 'pointer' : 'not-allowed',
                        }}
                        disabled={!newGym.imagen_url}
                      >
                        Guardar
                      </button>

                      <button
                        onClick={() => setShowCreateModal(false)}
                        style={{ ...btnStyle, backgroundColor: '#ccc', marginLeft: '10px' }}
                      >
                        Cancelar
                      </button>
                  </div>
                </div>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Imagen</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Dirección</th>
                  <th style={thStyle}>Ciudad</th>
                  <th style={thStyle}>Telefono</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gyms.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={tdStyle}>No hay gimnasios</td>
                  </tr>
                ) : (
                  gyms.map((gym, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>
                        <img
                          src={gym.imagen_url}
                          alt="gym"
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      </td>
                      <td style={tdStyle}>{gym.nombre}</td>
                      <td style={tdStyle}>{gym.direccion}</td>
                      <td style={tdStyle}>{gym.ciudad}</td>
                      <td style={tdStyle}>{gym.telefono}</td>
                      <td style={tdStyle}>
                        <button onClick={() => setEditGym(gym)} style={btnStyle}>Editar</button>
                        {editGym && (
                          <div
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              zIndex: 1000,
                            }}
                          >
                            <div
                              style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '10px',
                                width: '400px',
                                maxHeight: '90%',
                                overflowY: 'auto',
                              }}
                            >
                              <h3>Editar Gimnasio</h3>
                              <input
                                placeholder="Nombre"
                                value={editGym.nombre || ''}
                                onChange={(e) => setEditGym({ ...editGym, nombre: e.target.value })}
                                style={{ width: '100%', marginBottom: '10px' }}
                              />
                              <input
                                placeholder="Dirección"
                                value={editGym.direccion || ''}
                                onChange={(e) => setEditGym({ ...editGym, direccion: e.target.value })}
                                style={{ width: '100%', marginBottom: '10px' }}
                              />
                              <input
                                placeholder="Ciudad"
                                value={editGym.ciudad || ''}
                                onChange={(e) => setEditGym({ ...editGym, ciudad: e.target.value })}
                                style={{ width: '100%', marginBottom: '10px' }}
                              />
                              <input
                                placeholder="Teléfono"
                                value={editGym.telefono || ''}
                                onChange={(e) => setEditGym({ ...editGym, telefono: e.target.value })}
                                style={{ width: '100%', marginBottom: '10px' }}
                              />
                              <button onClick={handleUpdateGym} style={btnStyle}>Guardar</button>
                              <button
                                onClick={() => setEditGym(null)}
                                style={{ ...btnStyle, backgroundColor: '#ccc', marginLeft: '10px' }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteGym(gym.id)}
                          style={{ ...btnStyle, backgroundColor: '#e74c3c', marginLeft: '10px' }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                
              </tbody>
            </table>
          </div>
          <h2 style={{ textAlign: 'center' }}>Rutinas</h2>
            <div
              style={{
                maxHeight: '500px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                marginTop: '20px',
                padding: '10px',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                <thead style={{ backgroundColor: '#f4f4f4' }}>
                  <tr>
                    <th style={thStyle}>Nombre</th>
                    <th style={thStyle}>Descripción</th>
                    <th style={thStyle}>Nivel</th>
                    <th style={thStyle}>Entrenador</th>
                    <th style={thStyle}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(rutinas) && rutinas.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={tdStyle}>
                        No hay rutinas disponibles.
                      </td>
                    </tr>
                  ) : (
                    rutinas.map((rutina, index) => (
                      <tr key={index}>
                        <td style={tdStyle}>{rutina.nombre}</td>
                        <td style={tdStyle}>{rutina.descripcion}</td>
                        <td style={tdStyle}>{rutina.nivel}</td>
                        <td style={tdStyle}>{rutina.entrenador_id}</td>
                        <td style={tdStyle}>
                          <button style={btnStyle} onClick={() => setRutinaEditando(rutina)}>
                            Editar
                          </button>
                            
                          <button
                            style={{ ...btnStyle, backgroundColor: '#e74c3c' }}
                            onClick={() => handleDeleteRutina(rutina.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>       
          {rutinaEditando && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  width: '400px',
                  maxHeight: '90%',
                  overflowY: 'auto',
                }}
              >
                <h3>Editar Rutina</h3>
                <input
                  placeholder="Nombre"
                  value={rutinaEditando.nombre}
                  onChange={e =>
                    setRutinaEditando({ ...rutinaEditando, nombre: e.target.value })
                  }
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <input
                  placeholder="Descripción"
                  value={rutinaEditando.descripcion}
                  onChange={e =>
                    setRutinaEditando({ ...rutinaEditando, descripcion: e.target.value })
                  }
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <input
                  placeholder="Nivel"
                  value={rutinaEditando.nivel}
                  onChange={e =>
                    setRutinaEditando({ ...rutinaEditando, nivel: e.target.value })
                  }
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <input
                  placeholder="Entrenador ID"
                  value={rutinaEditando.entrenador_id}
                  onChange={e =>
                    setRutinaEditando({
                      ...rutinaEditando,
                      entrenador_id: e.target.value,
                    })
                  }
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <button onClick={handleUpdateRutina} style={btnStyle}>
                  Guardar
                </button>
                <button
                  onClick={() => setRutinaEditando(null)}
                  style={{ ...btnStyle, backgroundColor: '#ccc', marginLeft: '10px' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )} 
            <h2 style={{ textAlign: 'center' }}>Reservas</h2>
              <div
                style={{
                  maxHeight: '500px',
                  overflowY: 'auto',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                  marginTop: '20px',
                  padding: '10px',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  <thead style={{ backgroundColor: '#f4f4f4' }}>
                    <tr>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Boxer</th>
                      <th style={thStyle}>Ring</th>
                      <th style={thStyle}>Fecha</th>
                      <th style={thStyle}>Inicio</th>
                      <th style={thStyle}>Fin</th>
                      <th style={thStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={tdStyle}>No hay reservas</td>
                      </tr>
                    ) : (
                      reservas.map((r) => (
                        <tr key={r.id}>
                          <td style={tdStyle}>{r.id}</td>
                          <td style={tdStyle}>{r.boxer_id}</td>
                          <td style={tdStyle}>{r.ring_id}</td>
                          <td style={tdStyle}>{r.fecha}</td>
                          <td style={tdStyle}>{r.hora_inicio}</td>
                          <td style={tdStyle}>{r.hora_fin}</td>
                          <td style={tdStyle}>
                            <button onClick={() => handleEditClickReserva(r)} style={btnStyle}>Editar</button>
                            <button
                              onClick={() => handleDeleteReserva(r.id)}
                              style={{ ...btnStyle, backgroundColor: '#e74c3c', marginLeft: '10px' }}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal de edición de reserva */}
              {editReserva && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                  }}
                >
                  <div
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '10px',
                      width: '400px',
                      maxHeight: '90%',
                      overflowY: 'auto',
                    }}
                  >
                    <h3>Editar Reserva #{editReserva.id}</h3>
                    <input
                      placeholder="Fecha"
                      value={editReserva.fecha}
                      onChange={e => setEditReserva({ ...editReserva, fecha: e.target.value })}
                      style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <input
                      placeholder="Hora Inicio"
                      value={editReserva.hora_inicio}
                      onChange={e => setEditReserva({ ...editReserva, hora_inicio: e.target.value })}
                      style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <input
                      placeholder="Hora Fin"
                      value={editReserva.hora_fin}
                      onChange={e => setEditReserva({ ...editReserva, hora_fin: e.target.value })}
                      style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <button onClick={handleUpdateReserva} style={btnStyle}>Guardar</button>
                    <button onClick={() => setEditReserva(null)} style={{ ...btnStyle, backgroundColor: '#ccc', marginLeft: '10px' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
        </div>
        
        
      ) : (
        <div>No tienes permisos para acceder a este panel.</div>
      )}
    </div>
  );
};
  

const thStyle = {
  padding: '12px',
  borderBottom: '1px solid #ddd',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tdStyle = {
  padding: '10px',
  borderBottom: '1px solid #eee',
  textAlign: 'left',
};

const btnStyle = {
  marginRight: '5px',
  padding: '6px 10px',
  backgroundColor: '#3498db',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};


export default PanelAdmin;
