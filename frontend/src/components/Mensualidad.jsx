import React from 'react';

const Mensualidad = () => {
  return (
    <>
      <h2>Pago Mensualidad</h2>

      <form id="paymentForm">
        <label htmlFor="fullName">Nombre completo</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          required
          placeholder="Juan Pérez"
        />

        <label htmlFor="email">Correo Electrónico</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="correo@ejemplo.com"
        />

        <label htmlFor="plan">Selecciona un plan</label>
        <select id="plan" name="plan" required>
          <option value="" disabled selected>
            Elige un plan
          </option>
          <option value="basic">Básico - $10 / mes</option>
          <option value="standard">Estándar - $20 / mes</option>
          <option value="premium">Premium - $30 / mes</option>
        </select>

        <label htmlFor="cardNumber">Número de tarjeta</label>
        <input
          type="text"
          id="cardNumber"
          name="cardNumber"
          required
          placeholder="1234 5678 9012 3456"
          maxLength={19}
        />

        <label htmlFor="expiryDate">Fecha de expiración</label>
        <input type="month" id="expiryDate" name="expiryDate" required />

        <label htmlFor="cvv">CVV</label>
        <input
          type="password"
          id="cvv"
          name="cvv"
          required
          maxLength={4}
          placeholder="123"
        />

        <button type="submit">Pagar Mensualidad</button>
      </form>
    </>
  );
};

export default Mensualidad;
