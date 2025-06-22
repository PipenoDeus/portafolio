import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../connection/supabaseClient';
import "./PanelAdmin.css"

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
  const [clases, setClases] = useState([]);
  const [editClase, setEditClase] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [editBlog, setEditBlog] = useState(null);
  const [rings, setRings] = useState([]);
  const [editRing, setEditRing] = useState(null);
  const [newRing, setNewRing] = useState({nombre: '',descripcion: '',estado: '',gimnasio_id: ''});
  const [showCreateRingModal, setShowCreateRingModal] = useState(false);
  

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
        fetchClases(token);
        fetchBlogs(token);
        fetchRings(token);
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



  if (!newGym.imagen_url) {
    alert("Debes subir una imagen antes de crear el gimnasio.");
    return;
  }


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

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('http://localhost:8000/api/upload_image_gym/', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error desde el servidor:', data.error);
      alert('Error al subir la imagen');
      return;
    }

    const imageUrl = data.public_url;


    setNewGym((prev) => {
      const updated = { ...prev, imagen_url: imageUrl };
      return updated;
    });
  } catch (error) {
    console.error('Error en la subida:', error);
    alert('Error inesperado al subir la imagen');
  }
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

const fetchRings = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/api/rings/listar/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      setRings(data);
    } else {
      console.error('Error al listar rings');
    }
  } catch (error) {
    console.error('Error al obtener rings:', error);
  }
};

const handleCreateRing = async () => {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch('http://localhost:8000/api/rings/crear/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newRing),
    });

    const responseData = await response.json();

    if (response.ok) {
      alert("Ring creado exitosamente.");
      

      const createdRing = responseData.data[0]; 


      setNewRing({
        nombre: createdRing.nombre,
        descripcion: createdRing.descripcion,
        estado: createdRing.estado,
        gimnasio_id: createdRing.gimnasio_id,
        imagen_url: createdRing.imagen_url, 
      });

      fetchRings(token);  
    } else {
      console.error('Error al crear ring:', responseData);
      alert('Error al crear ring. Revisa la consola.');
    }
  } catch (error) {
    console.error('Error de red al crear ring:', error);
    alert('Error de red. Revisa la consola.');
  }
};


const handleUpdateRing = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('http://localhost:8000/api/rings/actualizar/', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: editRing.id,
        nombre: editRing.nombre,
        descripcion: editRing.descripcion,
        estado: editRing.estado,
        gimnasio_id: editRing.gimnasio_id,
      }),
    });

    if (response.ok) {
      alert("Ring actualizado correctamente.");
      setEditRing(null);
      fetchRings(token);
    } else {
      const errorData = await response.json();
      console.error('Error al actualizar ring:', errorData);
      alert('Error al actualizar ring');
    }
  } catch (error) {
    console.error('Error al actualizar ring:', error);
  }
};

const handleDeleteRing = async (id) => {
  const token = localStorage.getItem('token');
  const confirmDelete = window.confirm('¿Eliminar este ring?');
  if (!confirmDelete) return;

  try {
    const response = await fetch('http://localhost:8000/api/rings/eliminar/', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      alert("Ring eliminado correctamente.");
      fetchRings(token);
    } else {
      const errorData = await response.json();
      console.error('Error al eliminar ring:', errorData);
      alert(`Error al eliminar ring: ${errorData.detail || 'Error desconocido'}`);
    }
  } catch (error) {
    console.error('Error de red al eliminar ring:', error);
  }
};

const handleRingImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('http://localhost:8000/api/upload_image_rings/', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error desde el servidor:', data.error);
      alert('Error al subir la imagen');
      return;
    }

    const imageUrl = data.public_url;

    setNewRing((prev) => {
      const updated = { ...prev, imagen_url: imageUrl };
      return updated;
    });
  } catch (error) {
    console.error('Error en la subida:', error);
    alert('Error inesperado al subir la imagen');
  }
};

const handleUpdateRutina = async () => {
  const token = localStorage.getItem('token');

  const rutinaValida = {
    id: rutinaEditando.id,
    nombre: rutinaEditando.nombre,
    descripcion: rutinaEditando.descripcion,
    nivel: rutinaEditando.nivel,
    entrenador_id: rutinaEditando.entrenador_id,
  };

  try {
    const response = await fetch('http://localhost:8000/api/update_rutina', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(rutinaValida),
    });

    const resultText = await response.text();

    if (!response.ok) {
      throw new Error('Error al actualizar la rutina');
    }

    const result = JSON.parse(resultText);
    const updatedRutina = result.data[0];

    setRutinas(prev =>
      prev.map(rutina => (rutina.id === updatedRutina.id ? updatedRutina : rutina))
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

  const fetchClases = async (token) => {
    try {
      const res = await fetch('http://localhost:8000/api/clases/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        setClases(data);
      } else if (data.results && Array.isArray(data.results)) {
        setClases(data.results);
      } else {
        console.error('Formato inesperado:', data);
        setClases([]);
      }
    } catch (error) {
      console.error('Error al cargar clases:', error);
      setClases([]);
    }
  };

const handleDeleteClase = async (id) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:8000/api/clases/eliminar/', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      fetchClases(token); 
    } else {
      const data = await res.json();
      console.error('Error al eliminar clase:', data);
    }
  } catch (err) {
    console.error('Error eliminando clase:', err);
  }
};

const handleUpdateClase = async () => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:8000/api/clases/editar/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(editClase),
    });

    const data = await res.json();

    if (res.ok) {
      fetchClases(token);
      setEditClase(null);
    } else {
      console.error('Error del backend:', data);
    }
  } catch (err) {
    console.error('Error actualizando clase:', err);
  }
};

const fetchBlogs = async (token) => {
  try {
    const res = await fetch('http://localhost:8000/api/blogs/listar/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();


    if (Array.isArray(data)) {
      setBlogs(data);  
    } else {
      console.error('La respuesta no es un arreglo de blogs');
      setBlogs([]);  
    }
  } catch (error) {
    console.error('Error al cargar blogs:', error);
    setBlogs([]);
  }
};

const handleUpdateBlog = async () => {
  const token = localStorage.getItem('token');

  const blogData = {
    id: editBlog.id,
    titulo: editBlog.titulo,
    contenido: editBlog.contenido,
    aprobado: editBlog.aprobado,
  };

  try {
    const res = await fetch('http://localhost:8000/api/blogs/actualizar/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(blogData),
    });

    const data = await res.json();

    if (res.ok) {
      fetchBlogs(token); 
      setEditBlog(null); 
    } else {
      console.error('Error al actualizar blog:', data);
      alert('Error al actualizar blog');
    }
  } catch (err) {
    console.error('Error actualizando blog:', err);
    alert('Error inesperado');
  }
};

const handleDeleteBlog = async (id) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:8000/api/blogs/eliminar/', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      fetchBlogs(token);
    } else {
      const data = await res.json();
      console.error('Error al eliminar blog:', data);
    }
  } catch (err) {
    console.error('Error eliminando blog:', err);
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
              placeholder="Numero"
              value={editUser.number || ''}
              onChange={(e) => setEditUser({ ...editUser, number: e.target.value })}
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
                  <th style={thStyle}>Numero</th>
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
                      <td style={tdStyle}>{user.number}</td>
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
          <h2 style={{ textAlign: 'center', marginTop: '40px' }}>Rings</h2>
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
                <button onClick={() => setShowCreateRingModal(true)} style={btnStyle}>
                  Crear Ring
                </button>

                {showCreateRingModal && (
                  <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                  }}>
                    <div style={{
                      background: 'white', padding: '20px', borderRadius: '10px',
                      width: '400px', maxHeight: '90%', overflowY: 'auto',
                    }}>
                      <h3>Crear Nuevo Ring</h3>
                      <input
                        placeholder="Nombre"
                        value={newRing.nombre}
                        onChange={(e) => setNewRing({ ...newRing, nombre: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <input
                        placeholder="Descripción"
                        value={newRing.descripcion}
                        onChange={(e) => setNewRing({ ...newRing, descripcion: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <input
                        placeholder="Estado"
                        value={newRing.estado}
                        onChange={(e) => setNewRing({ ...newRing, estado: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <select
                        value={newRing.gimnasio_id}
                        onChange={(e) => setNewRing({ ...newRing, gimnasio_id: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      >
                        <option value="">Selecciona un gimnasio</option>
                        {gyms.map((gym) => (
                          <option key={gym.id} value={gym.id}>
                            {gym.nombre}
                          </option>
                        ))}
                      </select>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleRingImageUpload}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <button
                        onClick={handleCreateRing}
                        style={{
                          ...btnStyle,
                          backgroundColor: newRing.imagen_url ? btnStyle.backgroundColor : '#ccc',
                          cursor: newRing.imagen_url ? 'pointer' : 'not-allowed',
                        }}
                        disabled={!newRing.imagen_url}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setShowCreateRingModal(false)}
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
                    <th style={thStyle}>Descripción</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Gimnasio</th>
                    <th style={thStyle}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={tdStyle}>No hay rings</td>
                    </tr>
                  ) : (
                    rings.map((ring, index) => (
                      <tr key={index}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={ring.gimnasio_imagen_url}
                              alt="gimnasio"
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                              }}
                            />
                            <span>{ring.gimnasio_nombre}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>{ring.nombre}</td>
                        <td style={tdStyle}>{ring.descripcion}</td>
                        <td style={tdStyle}>{ring.estado}</td>
                        <td style={tdStyle}>{ring.gimnasio_nombre}</td>
                        <td style={tdStyle}>
                          <button onClick={() => setEditRing(ring)} style={btnStyle}>Editar</button>
                          {editRing && (
                            <div style={{
                              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                              justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                            }}>
                              <div style={{
                                background: 'white', padding: '20px', borderRadius: '10px',
                                width: '400px', maxHeight: '90%', overflowY: 'auto',
                              }}>
                                <h3>Editar Ring</h3>
                                <input
                                  placeholder="Nombre"
                                  value={editRing.nombre || ''}
                                  onChange={(e) => setEditRing({ ...editRing, nombre: e.target.value })}
                                  style={{ width: '100%', marginBottom: '10px' }}
                                />
                                <input
                                  placeholder="Descripción"
                                  value={editRing.descripcion || ''}
                                  onChange={(e) => setEditRing({ ...editRing, descripcion: e.target.value })}
                                  style={{ width: '100%', marginBottom: '10px' }}
                                />
                                <input
                                  placeholder="Estado"
                                  value={editRing.estado || ''}
                                  onChange={(e) => setEditRing({ ...editRing, estado: e.target.value })}
                                  style={{ width: '100%', marginBottom: '10px' }}
                                />
                                <input
                                  placeholder="Gimnasio"
                                  value={editRing.gimnasio_nombre || ''}
                                  disabled
                                  style={{ width: '100%', marginBottom: '10px', backgroundColor: '#eee' }}
                                />
                                <button onClick={handleUpdateRing} style={btnStyle}>Guardar</button>
                                <button
                                  onClick={() => setEditRing(null)}
                                  style={{ ...btnStyle, backgroundColor: '#ccc', marginLeft: '10px' }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteRing(ring.id)}
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
                        <td style={tdStyle}>S
                          {rutina.descripcion.length > 100
                            ? rutina.descripcion.slice(0, 100) + '...'
                            : rutina.descripcion}
                        </td>
                        <td style={tdStyle}>{rutina.nivel}</td>
                        <td style={tdStyle}>{rutina.entrenador_nombre || 'Sin nombre'}</td>
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
                      <th style={thStyle}>Boxer</th>
                      <th style={thStyle}>Ring</th>
                      <th style={thStyle}>Oponente</th>
                      <th style={thStyle}>Fecha</th>
                      <th style={thStyle}>Inicio</th>
                      <th style={thStyle}>Fin</th>
                      <th style={thStyle}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={tdStyle}>No hay reservas</td>
                      </tr>
                    ) : (
                      reservas.map((r) => (
                        <tr key={r.id}>
                          <td style={tdStyle}>
                            {r.boxeador_nombre} ({r.boxeador_email})
                          </td>
                          <td style={tdStyle}>{r.ring_nombre}</td>
                          <td style={tdStyle}>
                            {r.oponente_nombre} ({r.oponente_email || 'sin email'})
                          </td>
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
                    <input
                      placeholder="Oponente Email"
                      value={editReserva.oponente_email || ''}
                      onChange={e => setEditReserva({ ...editReserva, oponente_email: e.target.value })}
                      style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <button onClick={handleUpdateReserva} style={btnStyle}>Guardar</button>
                    <button onClick={() => setEditReserva(null)} style={{ ...btnStyle, backgroundColor: '#ccc', marginLeft: '10px' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              <h2 style={{ textAlign: 'center' }}>Clases</h2>
                <div style={{
                  maxHeight: '500px',
                  overflowY: 'auto',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                  marginTop: '20px',
                  padding: '10px',
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontFamily: 'Arial, sans-serif',
                  }}>
                    <thead style={{ backgroundColor: '#f4f4f4' }}>
                      <tr>
                        <th style={thStyle}>Entrenador</th>
                        <th style={thStyle}>Título</th>
                        <th style={thStyle}>Descripción</th>
                        <th style={thStyle}>Creado</th>
                        <th style={thStyle}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clases.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={tdStyle}>No hay clases</td>
                        </tr>
                      ) : (
                        clases.map((c) => (
                          <tr key={c.id}>
                            <td style={tdStyle}>{c.nombre_entrenador}</td>
                            <td style={tdStyle}>{c.titulo}</td>
                            <td style={tdStyle}>{c.descripcion}</td>
                            <td style={tdStyle}>{new Date(c.created_at).toLocaleDateString()}</td>
                            <td style={tdStyle}>
                              <button onClick={() => setEditClase(c)} style={btnStyle}>Editar</button>
                              <button
                                onClick={() => handleDeleteClase(c.id)}
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
                {editClase && (
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
                      <h3>Editar Clase #{editClase.id}</h3>
                      <input
                        placeholder="Título"
                        value={editClase.titulo}
                        onChange={e => setEditClase({ ...editClase, titulo: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <input
                        placeholder="Descripción"
                        value={editClase.descripcion}
                        onChange={e => setEditClase({ ...editClase, descripcion: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <input
                        placeholder="Video URL"
                        value={editClase.video_url}
                        onChange={e => setEditClase({ ...editClase, video_url: e.target.value })}
                        style={{ width: '100%', marginBottom: '10px' }}
                      />
                      <button onClick={handleUpdateClase} style={btnStyle}>Guardar</button>
                      <button onClick={() => setEditClase(null)} style={{ ...btnStyle, backgroundColor: '#ccc', marginLeft: '10px' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                <h2 style={{ textAlign: 'center' }}>Blogs</h2>
                  <div style={{
                    maxHeight: '500px',
                    overflowY: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    marginTop: '20px',
                    padding: '10px',
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontFamily: 'Arial, sans-serif',
                    }}>
                      <thead style={{ backgroundColor: '#f4f4f4' }}>
                        <tr>
                          <th style={thStyle}>Título</th>
                          <th style={thStyle}>Descripcion</th>
                          <th style={thStyle}>Creado</th>
                          <th style={thStyle}>Estado</th>
                          <th style={thStyle}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogs.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={tdStyle}>No hay blogs</td>
                          </tr>
                        ) : (
                          blogs.map((b) => (
                            <tr key={b.id}>
                              <td style={tdStyle}>{b.titulo}</td>
                              <td style={tdStyle}>{b.contenido}</td>
                              <td style={tdStyle}>{new Date(b.fecha_creacion).toLocaleDateString()}</td>
                              <td style={tdStyle}>{b.aprobado ? 'Aprobado' : 'No Aprobado'}</td>
                              <td style={tdStyle}>
                                <button onClick={() => setEditBlog(b)} style={btnStyle}>Editar</button>
                                <button
                                  onClick={() => handleDeleteBlog(b.id)}
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

                  {editBlog && (
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
                        <h3>Editar Blog #{editBlog.id}</h3>
                        <input
                          placeholder="Título"
                          value={editBlog.titulo}
                          onChange={e => setEditBlog({ ...editBlog, titulo: e.target.value })}
                          style={{ width: '100%', marginBottom: '10px' }}
                        />
                        <textarea
                          placeholder="Contenido"
                          value={editBlog.contenido}
                          onChange={e => setEditBlog({ ...editBlog, contenido: e.target.value })}
                          style={{ width: '100%', height: '100px', marginBottom: '10px' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <span>{editBlog.aprobado ? 'Aprobado' : 'No Aprobado'}</span>
                          <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                            <input
                              type="checkbox"
                              checked={editBlog.aprobado}
                              onChange={(e) => setEditBlog({ ...editBlog, aprobado: e.target.checked })}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                              position: 'absolute',
                              cursor: 'pointer',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: editBlog.aprobado ? '#4CAF50' : '#ccc',
                              transition: '.4s',
                              borderRadius: '34px',
                            }} />
                            <span style={{
                              position: 'absolute',
                              content: '""',
                              height: '14px',
                              width: '14px',
                              left: editBlog.aprobado ? '22px' : '4px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: '.4s',
                              borderRadius: '50%',
                            }} />
                          </label>
                        </label>
                        <button onClick={handleUpdateBlog} style={btnStyle}>Guardar</button>
                        <button onClick={() => setEditBlog(null)} style={{ ...btnStyle, backgroundColor: '#ccc', marginLeft: '10px' }}>
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
