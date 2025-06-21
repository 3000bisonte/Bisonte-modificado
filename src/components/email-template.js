import React from "react";

const EmailTemplate = ({ firstName, lastName, email, phone, city, service, message }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
    <h1 style={{ color: '#4CAF50' }}>¡Gracias por contactarte con Bisonte, {firstName} {lastName}!</h1>
    <p>Estamos encantados de que hayas mostrado interés en nuestro servicio de <strong>{service}</strong>.</p>
    
    <p>Hemos recibido tu mensaje y nuestro equipo de atención al cliente lo está revisando para brindarte una respuesta a la mayor brevedad posible. Nos esforzamos en resolver todas las peticiones de manera rápida y eficiente, para que tengas la mejor experiencia con nosotros.</p>
    
    <h3>Detalles de tu solicitud:</h3>
    <ul>
      <li><strong>Nombre:</strong> {firstName} {lastName}</li>
      <li><strong>Email:</strong> {email}</li>
      <li><strong>Teléfono:</strong> {phone}</li>
      <li><strong>Ciudad:</strong> {city}</li>
      <li><strong>Servicio de interés:</strong> {service}</li>
      <li><strong>Mensaje:</strong> {message}</li>
    </ul>

    <p>En breve, uno de nuestros representantes se pondrá en contacto contigo utilizando los datos que nos proporcionaste.</p>

    <p>Si tienes alguna otra consulta, no dudes en responder a este correo o llamarnos directamente. Estamos aquí para ayudarte.</p>

    <p>Atentamente,<br />
      El equipo de atención al cliente de Bisonte</p>
  </div>
);

export default EmailTemplate;
