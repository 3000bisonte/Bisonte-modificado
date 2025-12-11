import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { crearEnvioSchema } from '@/schemas/envios';
import { sendOrderConfirmationEmail, sendAdminShipmentNotificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';


// GET handler
export async function GET() {
  try {
    const orders = await prisma.historial_envio.findMany({
      orderBy: { FechaSolicitud: 'desc' },
      select: {
        id: true,
        NumeroGuia: true,
        Origen: true,
        Destino: true,
        Destinatario: true,
        Remitente: true,
        Estado: true,
        FechaSolicitud: true,
        usuarioId: true,
      },
    });
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error) {
    console.error('orders GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener órdenes', details: error.message },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request) {
  try {
    const body = await request.json();

    // Validar datos de entrada con Zod
    const validationResult = crearEnvioSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Datos de envío inválidos', 
          errors: validationResult.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const userEmail = typeof body.usuarioEmail === 'string' ? body.usuarioEmail.trim() : null;
    const paymentIdRaw = body.paymentId ?? body.PaymentId ?? body.pagoId ?? body.PagoId ?? null;

    console.log('📧 Email del usuario:', userEmail);

    let usuario = null;
    if (userEmail) {
      try {
        // Buscar o crear el usuario
        usuario = await prisma.usuarios.findUnique({ where: { email: userEmail } });
        
        if (!usuario) {
          console.log('⚠️ Usuario no encontrado, creando nuevo usuario...');
          // Crear usuario automáticamente si no existe
          const now = new Date();
          usuario = await prisma.usuarios.create({
            data: {
              email: userEmail,
              nombre: body.Remitente?.Nombre || 'Usuario',
              celular: body.Remitente?.Telefono || '0000000000',
              emailVerified: false,
              esAdministrador: false,
              esRecolector: false,
              failedLogins: 0,
              passwordVersion: 0,
              createdAt: now,
              updatedAt: now,
            },
          });
          console.log('✅ Usuario creado:', usuario.id);
        } else {
          console.log('✅ Usuario encontrado:', usuario.id);
        }
      } catch (error) {
        console.error('❌ Error buscando/creando usuario:', error);
        // Proporcionar más detalles del error
        const errorDetails = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
          message: 'Error al buscar o crear usuario en la base de datos',
          details: errorDetails,
          hint: 'Verifica que el email sea válido y que la base de datos esté accesible',
        }, { status: 500 });
      }
    } else {
      console.warn('⚠️ No se proporcionó email de usuario');
      return NextResponse.json({
        message: 'Email de usuario requerido',
        details: 'No se proporcionó usuarioEmail en la solicitud',
      }, { status: 400 });
    }

    const serializeValue = (value) => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'string') {
        return value;
      }
      try {
        return JSON.stringify(value);
      } catch (error) {
        console.warn('No se pudo serializar el valor, se usará cadena vacía:', error);
        return '';
      }
    };

    const destinatarioValue = serializeValue(validatedData.Destinatario);
    const remitenteValue = serializeValue(validatedData.Remitente);

    // Verificar que tenemos usuarioId antes de crear
    if (!usuario || !usuario.id) {
      console.error('❌ No se pudo obtener el ID del usuario');
      return NextResponse.json({
        message: 'Error: No se pudo asociar el envío al usuario',
        details: 'Usuario no encontrado o no creado correctamente. Verifica tu sesión.',
        email: userEmail,
      }, { status: 400 });
    }

    console.log('📦 Creando envío con usuarioId:', usuario.id);

    // Crear nuevo envío dentro de una transacción
    const newOrder = await prisma.$transaction(async (tx) => {
      const data = {
        NumeroGuia: validatedData.NumeroGuia,
        Estado: validatedData.Estado,
        Origen: validatedData.Origen,
        Destino: validatedData.Destino,
        Destinatario: destinatarioValue ?? '',
        Remitente: remitenteValue ?? '',
        usuarioId: usuario.id,
      };

      if (paymentIdRaw) {
        data.PaymentId = String(paymentIdRaw);
      }

      const created = await tx.historial_envio.create({
        data,
      });

      console.log('✅ Envío creado exitosamente:', {
        id: created.id,
        NumeroGuia: created.NumeroGuia,
        usuarioId: created.usuarioId,
      });

      return created;
    });

    const parseJsonField = (field) => {
      if (!field) return 'N/A';
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          if (typeof parsed === 'object' && parsed !== null) {
            return parsed.nombre || parsed.name || parsed.Nombre || String(field);
          }
          return parsed;
        } catch {
          return field;
        }
      }
      if (typeof field === 'object' && field !== null) {
        return field.nombre || field.name || field.Nombre || String(field);
      }
      return String(field);
    };

    const parsePersonaObject = (field) => {
      if (!field) return null;
      if (typeof field === 'object' && field !== null) {
        return field;
      }
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return typeof parsed === 'object' && parsed !== null ? parsed : null;
        } catch {
          return null;
        }
      }
      return null;
    };

    const normalizeNumber = (value) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value.replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const customerName = usuario?.nombre || 'Cliente';
    const recipientName = parseJsonField(newOrder.Destinatario);
    const destinatarioObj = parsePersonaObject(validatedData?.Destinatario) || parsePersonaObject(newOrder.Destinatario);
    const remitenteObj = parsePersonaObject(validatedData?.Remitente) || parsePersonaObject(newOrder.Remitente);

    const recipientPhone = destinatarioObj?.Telefono || destinatarioObj?.telefono || destinatarioObj?.phone || null;
    const senderName = remitenteObj?.Nombre || remitenteObj?.nombre || remitenteObj?.name || customerName;
    const senderPhone = remitenteObj?.Telefono || remitenteObj?.telefono || remitenteObj?.phone || null;

    const totalCostForEmail = normalizeNumber(body?.costoTotal)
      ?? normalizeNumber(body?.CostoTotal)
      ?? normalizeNumber(body?.total)
      ?? normalizeNumber(body?.valorTotal)
      ?? normalizeNumber(validatedData?.ValorDeclarado);

    const declaredValueForEmail = normalizeNumber(validatedData?.ValorDeclarado)
      ?? normalizeNumber(body?.ValorDeclarado);

    const weightForEmail = normalizeNumber(validatedData?.Peso)
      ?? normalizeNumber(body?.Peso)
      ?? normalizeNumber(body?.peso);

    const notesForEmail = body?.Notas
      ?? body?.nota
      ?? body?.observaciones
      ?? body?.comments
      ?? null;

    const senderDetailsForEmail = {
      nombre: senderName || null,
      direccion: remitenteObj?.Direccion
        || remitenteObj?.direccion
        || remitenteObj?.DireccionRecogida
        || remitenteObj?.direccionRecogida
        || newOrder.Origen
        || null,
      telefono: senderPhone,
    };

    const recipientDetailsForEmail = {
      nombre: recipientName || null,
      direccion: destinatarioObj?.Direccion
        || destinatarioObj?.direccion
        || destinatarioObj?.DireccionEntrega
        || destinatarioObj?.direccionEntrega
        || newOrder.Destino
        || null,
      telefono: recipientPhone,
      email: body?.destinatarioEmail || null,
    };

    const rawDimensions = validatedData?.Dimensiones
      ?? body?.Dimensiones
      ?? body?.dimensiones
      ?? null;

    const packageDetailsForEmail = {
      numeroGuia: newOrder.NumeroGuia,
      estado: validatedData?.Estado ?? body?.Estado ?? newOrder.Estado ?? null,
      origen: newOrder.Origen || null,
      destino: newOrder.Destino || null,
      peso: weightForEmail,
      dimensiones: typeof rawDimensions === 'string' && rawDimensions.trim().length > 0 ? rawDimensions.trim() : null,
      valorDeclarado: declaredValueForEmail,
      notas: notesForEmail,
    };

    const normalizedMontoTotal = normalizeNumber(body?.montoTotal)
      ?? normalizeNumber(body?.monto)
      ?? totalCostForEmail;

    const paymentDetailsForEmail = {
      metodo: body?.metodoPago || body?.metodo || null,
      pagado: typeof body?.pagado === 'boolean' ? body.pagado : null,
      montoTotal: normalizedMontoTotal,
      costoCotizado: totalCostForEmail,
      paymentId: paymentIdRaw ? String(paymentIdRaw) : null,
    };

    const bodyExtras = { ...body };
    const knownKeys = [
      'NumeroGuia',
      'Estado',
      'Origen',
      'Destino',
      'Destinatario',
      'Remitente',
      'Peso',
      'Dimensiones',
      'ValorDeclarado',
      'usuarioEmail',
      'metodoPago',
      'metodo',
      'pagado',
      'montoTotal',
      'monto',
      'paymentId',
      'Notas',
      'nota',
      'observaciones',
      'comments',
      'costoTotal',
      'CostoTotal',
      'valorTotal',
      'valorDeclarado',
      'peso',
      'alto',
      'ancho',
      'largo',
    ];
    for (const key of knownKeys) {
      if (key in bodyExtras) {
        delete bodyExtras[key];
      }
    }

    const formPayloadForEmail = {
      cliente: {
        nombre: customerName,
        email: userEmail,
      },
      remitente: senderDetailsForEmail,
      destinatario: recipientDetailsForEmail,
      envio: {
        numeroGuia: newOrder.NumeroGuia,
        estado: packageDetailsForEmail.estado,
        origen: packageDetailsForEmail.origen,
        destino: packageDetailsForEmail.destino,
        peso: validatedData?.Peso ?? weightForEmail ?? null,
        dimensiones: packageDetailsForEmail.dimensiones,
        valorDeclarado: validatedData?.ValorDeclarado ?? declaredValueForEmail ?? null,
        notas: notesForEmail,
      },
      pago: paymentDetailsForEmail,
      extras: Object.keys(bodyExtras).length > 0 ? bodyExtras : undefined,
    };

    // ✅ Enviar email de confirmación al cliente
    try {
      const emailResult = await sendOrderConfirmationEmail({
        to: userEmail,
        customerName,
        trackingNumber: newOrder.NumeroGuia,
        origin: newOrder.Origen || 'N/A',
        destination: newOrder.Destino || 'N/A',
        recipientName,
        totalCost: totalCostForEmail ?? 0,
        orderDate: newOrder.FechaSolicitud,
      });

      if (emailResult.sent) {
        console.log('✅ Email de confirmación enviado:', {
          emailId: emailResult.id,
          transport: emailResult.transport,
          to: userEmail,
        });
      } else {
        console.warn('⚠️ No se pudo enviar email de confirmación:', {
          reason: emailResult.reason,
          error: emailResult.error,
          transportsTried: emailResult.transportsTried,
        });
      }
    } catch (emailError) {
      // Email failure should not block order creation
      console.error('❌ Error al enviar email de confirmación:', {
        message: emailError?.message || String(emailError),
        stack: emailError?.stack,
      });
    }

    try {
      const adminEmailResult = await sendAdminShipmentNotificationEmail({
        customerName,
        customerEmail: userEmail,
        trackingNumber: newOrder.NumeroGuia,
        origin: newOrder.Origen || 'N/A',
        destination: newOrder.Destino || 'N/A',
        recipientName,
        recipientPhone,
        senderName,
        senderPhone,
        totalCost: totalCostForEmail,
        declaredValue: declaredValueForEmail,
        weight: weightForEmail,
        orderDate: newOrder.FechaSolicitud,
        paymentId: paymentIdRaw ? String(paymentIdRaw) : null,
        notes: notesForEmail,
        senderDetails: senderDetailsForEmail,
        recipientDetails: recipientDetailsForEmail,
        packageDetails: packageDetailsForEmail,
        paymentDetails: paymentDetailsForEmail,
        formPayload: formPayloadForEmail,
        metadata: {
          envioId: newOrder.id,
          usuarioId: usuario.id,
        },
      });

      if (adminEmailResult.sent) {
        console.log('✅ Email de notificación a administración enviado:', {
          emailId: adminEmailResult.id,
          transport: adminEmailResult.transport,
          recipients: adminEmailResult.recipients,
        });
      } else {
        console.warn('⚠️ No se pudo notificar a administración:', {
          reason: adminEmailResult.reason,
          error: adminEmailResult.error,
          transportsTried: adminEmailResult.transportsTried,
          recipients: adminEmailResult.recipients,
        });
      }
    } catch (adminEmailError) {
      console.error('❌ Error al enviar notificación a administración:', {
        message: adminEmailError?.message || String(adminEmailError),
        stack: adminEmailError?.stack,
      });
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    
    // 🔍 Logging detallado del error
    console.error('📋 Detalles completos del error:', {
      name: error?.name || 'Sin nombre',
      message: error?.message || 'Sin mensaje',
      code: error?.code || 'Sin código',
      meta: error?.meta || 'Sin meta',
      stack: error?.stack || 'Sin stack',
    });
    
    // Manejar errores específicos de Prisma
    if (error?.code === 'P2002' && Array.isArray(error?.meta?.target) && error.meta.target.includes('NumeroGuia')) {
      return NextResponse.json({
        message: 'El número de guía ya existe',
        code: 'ORDER_DUPLICATE_TRACKING',
        details: `El número de guía ${body.NumeroGuia || 'proporcionado'} ya está registrado en el sistema.`,
      }, { status: 409 });
    }
    
    if (error?.code === 'P2003') {
      return NextResponse.json({
        message: 'Error de relación en la base de datos',
        code: 'ORDER_FOREIGN_KEY_CONSTRAINT',
        details: 'El usuario asociado no existe o hay un problema con las relaciones.',
      }, { status: 400 });
    }
    
    if (error?.code === 'P2025') {
      return NextResponse.json({
        message: 'Registro no encontrado',
        code: 'ORDER_NOT_FOUND',
        details: 'No se pudo encontrar el registro especificado.',
      }, { status: 404 });
    }
    
    // Error genérico
    return NextResponse.json({ 
      message: 'Error al crear el envío',
      code: 'ORDER_CREATE_ERROR',
      details: error instanceof Error ? error.message : 'Error desconocido',
      errorCode: error?.code || 'UNKNOWN',
    }, { status: 500 });
  }
}
