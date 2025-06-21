import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// export async function POST(request) {
//   try {
//     const body = await request.json();
//     console.log("datos recibidos:", body);
//     return NextResponse.json({
//       message: "Petición recibida correctamente",
//       data: body,
//     });
//   } catch (error) {
//     console.error("Error procesando la petición:", error);
//     return NextResponse.json(
//       { message: "Error en el servidor", error: error.message },
//       { status: 500 }
//     );
//   }
// }

// export async function GET() {
//   const remitentes = await prisma.remitente.findMany();
//   console.log(remitentes);
//   return NextResponse.json("obteniendo remitente");
// }
export async function POST(request) {
  try {
    //console.log("request recibido:", request);
    //console.log("datos-desde-front", await request.json());
    const reqBody = await request.json();
    // Obtener la IP del cliente
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.ip;
    const realIp =
      clientIp === "::1" || clientIp === "127.0.0.1"
        ? "186.86.33.18"
        : clientIp; // Simula una IP si es localhost
    console.log("IP del comprador:", realIp);
    //creo que este es la privada llave
    const mPublicKey = process.env.M_P_PUBLIC_KEY;
    const client = new MercadoPagoConfig({
      accessToken: mPublicKey,

      options: { timeout: 10000 },
    });

    const payment = new Payment(client);

    const paymentResponse = await payment.create({
      body: {
        transaction_amount: reqBody.transaction_amount,
        token: reqBody.token,
        description: "Envio paqueteria",
        installments: reqBody.installments,
        payment_method_id: reqBody.payment_method_id,
        issuer_id: reqBody.issuer,
        payer: {
          entity_type: reqBody.payer.entity_type,
          email: reqBody.payer.email,
          identification: {
            type: reqBody?.payer?.identification?.type || "default_value",
            number: reqBody?.payer?.identification?.number || "default_number",
          },
        },
        additional_info: {
          ip_address: realIp,
        },
        transaction_details: {
          financial_institution:
            reqBody?.transaction_details?.financial_institution ||
            "default_value",
        },
        callback_url:
          //"https://mercaenvios.com/dashboard/tables/mercadopago/statusbrick", // URL de callback
          //"http://localhost:3000/mercadopago/statusbrick",
          "https://bisonte-logistica-6od4.vercel.app/mercadopago/statusbrick",
      },
      back_urls: {
        success: "http://localhost:3000/feedback",
        failure: "http://localhost:3000/failure",
        pending: "http://localhost:3000/pending",
      },
      notification_url: "https://ecee-186-86-32-77.ngrok-free.app/webhook", // URL de notificación
    });

    // Retorna la respuesta del API de MercadoPago
    return NextResponse.json({
      id: paymentResponse.id,
      status: paymentResponse.status,
    });
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return NextResponse.json(
      { message: "Error al procesar el pago", error: error.message },
      { status: 500 }
    );
  }
}
