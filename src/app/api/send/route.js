import { NextResponse } from "next/server";

// Simplified send endpoint for testing
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Send email/notification endpoint",
      status: "operational"
    });
  } catch (error) {
    console.error("Error en /send:", error);
    return NextResponse.json({
      success: false,
      error: "Error en endpoint send",
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Extraer los datos del cuerpo de la solicitud
    const { nombre, apellidos, email, celular, ciudad, servicio, mensaje } =
      await request.json();
    
    console.log('Datos recibidos:', { nombre, apellidos, email, celular, ciudad, servicio, mensaje });
    
    // Simular envío de email
    const emailData = {
      firstName: nombre,
      lastName: apellidos,
      email,
      phone: celular,
      city: ciudad,
      service: servicio,
      message: mensaje,
    };

    // Simular procesamiento de email
    console.log('Enviando email simulado a:', email);

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente (simulado)',
      data: emailData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en POST /send:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
