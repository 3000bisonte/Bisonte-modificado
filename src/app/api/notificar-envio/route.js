import { Resend } from 'resend';

export async function POST(req) {
  const { remitente, destinatario, cotizador, fecha } = await req.json();

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'Bisonte <notificaciones@bisonteapp.com>', // Puedes usar un dominio verificado o el default de Resend
      to: 'yesicacausado71@gmail.com',
      subject: 'Nuevo envío realizado',
      text: `
        Se ha realizado un nuevo envío:
        Remitente: ${remitente?.nombre}
        Destinatario: ${destinatario?.nombre}
        Ciudad destino: ${cotizador?.ciudadDestino}
        Fecha: ${fecha}
        Total: $${cotizador?.costoTotal}
      `,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
}