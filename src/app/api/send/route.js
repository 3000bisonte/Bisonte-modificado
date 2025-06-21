import EmailTemplate from "@/components/email-template";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  // Extraer los datos del cuerpo de la solicitud
  const { nombre, apellidos, email, celular, ciudad, servicio, mensaje } =
    await request.json();
  console.log(nombre, apellidos, email, celular, ciudad, servicio, mensaje);
  // Crear un objeto para agrupar todos los datos
  const emailData = {
    firstName: nombre,
    lastName: apellidos,
    email,
    phone: celular,
    city: ciudad,
    service: servicio,
    message: mensaje,
  };

  try {
    const { data, error } = await resend.emails.send({
      from: "Bisonte <onboarding@resend.dev>",
      to: ["bisontepqrs@gmail.com"],
      subject: "¡Gracias por tu interés en Bisonte! 🌟",
      react: EmailTemplate(emailData), // Pasar el objeto completo al template
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
