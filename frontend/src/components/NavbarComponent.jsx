import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './NavbarComponent.css';
import { useAuth } from '../context/AuthContext';


function NavbarComponent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/sesion');
  };

  return (
    <Navbar className="navbar-black" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">SparringLab</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {!user ? (
              <>
                <Nav.Link as={Link} to="/login">Iniciar Sesión</Nav.Link>
                <Nav.Link as={Link} to="/registro">Registro</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/perfil">Perfil</Nav.Link>
                <Nav.Link as={Link} to="/gimnasios">Gimnasios</Nav.Link>
                <Nav.Link as={Link} to="/rutinas">Rutinas</Nav.Link>
                <Nav.Link as={Link} to="/arriendo">Reservas</Nav.Link>
                <Nav.Link as={Link} to="/sparring">Sparring</Nav.Link>
                <Nav.Link as={Link} to="/clases">Clases</Nav.Link>
                <Nav.Link as={Link} to="/acerca">Acerca de</Nav.Link>
                <Nav.Link as={Link} to="/contacto">Contacto</Nav.Link>
                <Nav.Link onClick={handleLogout}>Cerrar Sesión</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;