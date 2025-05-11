import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Asegúrate de que estás importando el contexto correctamente

const Blogs = () => {
  const { user } = useAuth();  // Obtén el usuario logueado desde el contexto
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/blogs/');
        const data = await response.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        setError('Error al obtener los blogs');
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  const handleCreateBlog = async () => {
  if (!titulo || !contenido) {
    alert('Por favor ingrese un título y contenido.');
    return;
  }

  if (!user) {
    alert('No estás logueado. Por favor inicia sesión.');
    return;
  }

  const newBlog = {
    titulo: titulo,
    contenido: contenido,
    user_id: user.id,  // Aquí es donde usamos el ID del usuario logueado
  };

  try {
    const response = await fetch('http://localhost:8000/api/create-blog/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newBlog),
    });

    const data = await response.json();

    if (response.ok) {
      setBlogs((prevBlogs) => [...prevBlogs, data.data]);
      setTitulo('');
      setContenido('');
      alert('Blog creado con éxito');
    } else {
      alert(data.error || 'Hubo un error al crear el blog');
    }
  } catch (err) {
    console.error('Error creando blog:', err);
    alert('Hubo un error al crear el blog');
  }
};

  if (loading) return <p>Cargando blogs...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mt-4">
      <h2>Blog de la Comunidad</h2>
      
      {/* Formulario para crear blog */}
      <div className="mb-4">
        <h3>Crear Nuevo Blog</h3>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <textarea
          className="form-control mb-2"
          placeholder="Contenido"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleCreateBlog}>
          Crear Blog
        </button>
      </div>

      {/* Mostrar los blogs existentes */}
      {blogs.length === 0 ? (
        <p>No hay publicaciones aún.</p>
      ) : (
        blogs.map((blog) => (
          <div key={blog.id} className="card mb-3">
            <div className="card-body">
              <h4>{blog.titulo}</h4>
              <p>{blog.contenido}</p>
              <small className="text-muted">
                Publicado por {blog.user_profiles?.first_name} {blog.user_profiles?.last_name} el{' '}
                {new Date(blog.fecha_creacion).toLocaleString()}
              </small>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Blogs;
