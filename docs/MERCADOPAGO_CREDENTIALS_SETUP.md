# Configuración de Credenciales de Mercado Pago

## Variables requeridas

Crea un archivo `.env.local` (no se versiona) basado en `.env.local.example` con las siguientes variables:

| Variable | Descripción | Entorno |
|----------|-------------|---------|
| `MP_ACCESS_TOKEN_TEST` | Access token de pruebas (prefijo `TEST-`) | Servidor |
| `MP_ACCESS_TOKEN_PROD` | Access token de producción (prefijo `APP_USR-`) | Servidor |
| `NEXT_PUBLIC_MP_PUBLIC_KEY_TEST` | Public key de pruebas | Cliente |
| `NEXT_PUBLIC_MP_PUBLIC_KEY_PROD` | Public key de producción | Cliente |
| `MP_ENVIRONMENT` | `test` o `production`, define qué credenciales se usarán | Ambos |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | (Opcional) Si se quiere forzar una llave pública distinta | Cliente |
| `MP_WEBHOOK_URL` | URL pública para recibir notificaciones (opcional) | Servidor |
| `MP_BACK_URL_SUCCESS` | URL de regreso en caso de éxito (opcional) | Servidor |
| `MP_BACK_URL_FAILURE` | URL de regreso en caso de fallo (opcional) | Servidor |
| `MP_BACK_URL_PENDING` | URL de regreso en caso pendiente (opcional) | Servidor |
| `MP_STATEMENT_DESCRIPTOR` | Texto que verá el pagador en el extracto (opcional) | Servidor |
| `MP_CURRENCY` | Moneda utilizada (`COP`, `USD`, etc.) (opcional, por defecto `COP`) | Servidor |

## Ejemplo de `.env.local`

```bash
MP_ACCESS_TOKEN_TEST=TEST-XXXXXXXXXXXX-000000000
NEXT_PUBLIC_MP_PUBLIC_KEY_TEST=TEST-XXXXXXXXXXXX
MP_ACCESS_TOKEN_PROD=APP_USR-XXXXXXXXXXXX-000000000
NEXT_PUBLIC_MP_PUBLIC_KEY_PROD=APP_USR-XXXXXXXXXXXX

MP_ENVIRONMENT=test
NEXT_PUBLIC_MP_PUBLIC_KEY=

# Opcionales
MP_WEBHOOK_URL=https://tu-dominio.com/api/mercadopago/webhook
MP_BACK_URL_SUCCESS=https://tu-dominio.com/pagos/mercadopago/success
MP_BACK_URL_FAILURE=https://tu-dominio.com/pagos/mercadopago/failure
MP_BACK_URL_PENDING=https://tu-dominio.com/pagos/mercadopago/pending
MP_STATEMENT_DESCRIPTOR=BISONTE
MP_CURRENCY=COP
```

> **Importante:** Nunca comprometas los `access_token` en el repositorio ni en clientes. Mantén el archivo `.env.local` fuera del control de versiones.

## Cómo alternar entre Sandbox y Producción

1. Establece `MP_ENVIRONMENT=test` para usar las credenciales de pruebas.
2. Cuando quieras ir a producción, cambia a `MP_ENVIRONMENT=production` y coloca las credenciales reales en las variables `*_PROD`.
3. Reinicia el servidor de Next.js para que las variables surtan efecto.

## ¿Cómo validar que todo quedó bien?

Puedes llamar al endpoint `GET /api/mercadopago` (por ejemplo, desde el navegador) y deberías ver una respuesta similar a:

```json
{
  "success": true,
  "status": "operational",
  "environment": "test",
  "configured": {
    "accessToken": true,
    "publicKey": true,
    "initKey": false,
    "all": true
  }
}
```

Si `all` es `true`, las credenciales principales están listas.
