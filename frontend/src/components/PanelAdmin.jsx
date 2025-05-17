import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PanelAdmin = () => {
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/verify_token/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          navigate('/login');
          return;
        }

        const data = await response.json();

        if (data.rol === 'admin') {
          setIsAdmin(true);
          fetchUsers(token); // Obtener usuarios si es admin
          console.log('Rol verificado:', data.rol);
        } else {
          navigate('/home');
        }

      } catch (error) {
        console.error('Error de verificación:', error);
        navigate('/login');
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

        // Verificar que 'data' sea un array antes de usarlo
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
        'Content-Type': 'application/json',  // Esto podría ser importante
      },
      body: JSON.stringify({ id: userId }),  // El ID va en el cuerpo de la solicitud
    });

    if (response.ok) {
      alert('Usuario eliminado correctamente');
      fetchUsers(); // refrescar lista
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
          <div
            style={{
              maxHeight: '500px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              marginTop: '20px',
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
