import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { action, respuesta, archivado } = await request.json();

    if (action === "marcar_leido") {
      const mensaje = await prisma.Contacto.update({
        where: { id: parseInt(id) },
        data: { leido: true }
      });
      
      return NextResponse.json({ success: true, mensaje });
    }

    if (action === "responder") {
      const mensaje = await prisma.Contacto.findUnique({
        where: { id: parseInt(id) }
      });

      if (!mensaje) {
        return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
      }

      // Enviar email de respuesta con Resend
      await resend.emails.send({
        from: "Bisonte Logística <noreply@notificaciones.bisonteapp.com>",
        to: mensaje.correo,
        subject: `Re: Tu mensaje en Bisonte Logística`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
            <div style="background-color: #41e0b3; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🚛 Bisonte Logística</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Respuesta a tu mensaje</p>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">¡Hola ${mensaje.nombre}! 👋</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Gracias por contactarnos. Hemos recibido tu mensaje y queremos responderte:
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e3dfde;">
                <h3 style="color: #555; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">TU MENSAJE:</h3>
                <p style="color: #333; margin: 10px 0 0 0; font-style: italic;">"${mensaje.mensaje}"</p>
              </div>
              
              <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #41e0b3; margin: 20px 0;">
                <h3 style="color: #2d5a2d; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">NUESTRA RESPUESTA:</h3>
                <p style="color: #2d5a2d; margin: 10px 0 0 0; font-weight: 500; line-height: 1.6;">${respuesta}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                  ¿Necesitas más información? ¡Estamos aquí para ayudarte!
                </p>
                <a href="mailto:3000bisonte@gmail.com" style="background-color: #41e0b3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                  Contactar de nuevo
                </a>
              </div>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #888; font-size: 14px; margin: 0;">
                  Atentamente,<br>
                  <strong style="color: #41e0b3;">Equipo Bisonte Logística</strong><br>
                  📧 <a href="mailto:3000bisonte@gmail.com" style="color: #41e0b3; text-decoration: none;">3000bisonte@gmail.com</a>
                </p>
              </div>
            </div>
          </div>
        `
      });

      // Marcar como respondido
      await prisma.Contacto.update({
        where: { id: parseInt(id) },
        data: { 
          leido: true,
          respondido: true,
          respuesta: respuesta,
          fechaRespuesta: new Date()
        }
      });

      return NextResponse.json({ success: true, mensaje: "Respuesta enviada correctamente" });
    }

    if (action === "archivar" || action === "desarchivar") {
      const mensaje = await prisma.Contacto.update({
        where: { id: parseInt(id) },
        data: { archivado: archivado }
      });
      
      return NextResponse.json({ success: true, mensaje });
    }

  } catch (error) {
    console.error("Error en acción:", error);
    return NextResponse.json({ error: "Error al procesar la acción" }, { status: 500 });
  }
}