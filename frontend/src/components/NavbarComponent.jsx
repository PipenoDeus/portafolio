import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import './NavbarComponent.css';

function NavbarComponent() {
  return (
    <Navbar className="navbar-black" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#">SparringLab</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="#">Perfil</Nav.Link>
            <Nav.Link href="#">Sesion</Nav.Link>
            <Nav.Link href="#">Registro</Nav.Link>
            <Nav.Link href="#">Gimnasios</Nav.Link>
            <Nav.Link href="#">Rutinas</Nav.Link>
            <Nav.Link href="#">Arriendo</Nav.Link>
            <Nav.Link href="#">Sparring</Nav.Link>
            <Nav.Link href="#">Clases</Nav.Link>
            <Nav.Link href="#">Acerca de</Nav.Link>
            <Nav.Link href="#">Contacto</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;
