# 📋 INSTRUCCIONES DE ACCESO PARA GOOGLE PLAY CONSOLE

## ✅ CUENTA DE PRUEBA CREADA

**Estado:** ✅ Cuenta creada exitosamente en producción (ID: 225)

---

## 📝 INFORMACIÓN PARA EL FORMULARIO

### **Nombre de la instrucción**
```
Full App Access Credentials - Admin Account
```

### **Nombre de usuario, dirección de correo electrónico o número de teléfono**
```
test@bisonteapp.com
```

### **Contraseña**
```
TestBisonte2024!
```

### **Cualquier otra información necesaria para acceder a tu aplicación**
```
This is a logistics quotation platform. To test all features:

1. Login with the provided credentials at www.bisonteapp.com
2. Navigate to "Cotizador" to create shipping quotes
3. To test payment flow: Select any shipping option and proceed to checkout
4. Use MercadoPago test cards (app is in production mode but accepts test cards):
   - Card: 5031 7557 3453 0604
   - Expiry: 11/25
   - CVV: 123
   - Name: APRO (for approved)

5. ADMIN ACCESS: This account has administrator privileges
   - Access admin panel at: www.bisonteapp.com/admin/envios
   - View all orders and shipments
   - Update shipment statuses
   - Manage user orders

The app includes:
- User registration/login (email or Google Sign-In)
- Shipping quote calculator
- Payment integration (MercadoPago)
- Order history
- AdMob advertisements
- Admin panel for order management

No 2-step verification or biometric login is required with these test credentials.
```

---

## 🔐 DETALLES DE LA CUENTA

| Campo | Valor |
|-------|-------|
| **Email** | test@bisonteapp.com |
| **Password** | TestBisonte2024! |
| **Nombre** | Test Admin |
| **Tipo de Documento** | CC |
| **Número de Documento** | 1234567890 |
| **Celular** | 3001234567 |
| **Ciudad** | Bogotá |
| **Dirección** | Calle 123 #45-67 |
| **Email Verificado** | ✅ Sí |
| **Perfil Completo** | ✅ Sí |
| **Es Administrador** | ✅ Sí |

---

## 🎯 CARACTERÍSTICAS QUE PUEDE PROBAR GOOGLE

### 1. **Acceso Público (Sin Login)**
- ✅ Ver página de inicio
- ✅ Ver información de servicios
- ✅ Ver formulario de contacto
- ✅ Ver preguntas frecuentes

### 2. **Acceso de Usuario Registrado**
- ✅ Login con email/password
- ✅ Login con Google Sign-In
- ✅ Crear cotizaciones de envío
- ✅ Realizar pagos con MercadoPago
- ✅ Ver historial de pedidos
- ✅ Ver anuncios de AdMob
- ✅ Actualizar perfil

### 3. **Acceso de Administrador** ⭐
- ✅ Acceder a `/admin/envios`
- ✅ Ver todos los pedidos del sistema
- ✅ Actualizar estados de envío
- ✅ Ver información detallada de pedidos
- ✅ Gestionar órdenes de usuarios

---

## 🧪 TARJETAS DE PRUEBA MERCADOPAGO

Para probar el flujo de pago completo:

### ✅ Tarjeta Aprobada
```
Número: 5031 7557 3453 0604
Vencimiento: 11/25
CVV: 123
Nombre: APRO
```

### ❌ Tarjeta Rechazada (Opcional)
```
Número: 5031 4332 1540 6351
Vencimiento: 11/25
CVV: 123
Nombre: OTHE
```

---

## 🔒 SEGURIDAD

- ✅ Email verificado (no requiere verificación adicional)
- ✅ Perfil completo (no requiere completar datos)
- ✅ Sin verificación en 2 pasos
- ✅ Sin login biométrico
- ✅ Credenciales estáticas (no expiran)
- ✅ Válidas desde cualquier ubicación

---

## 📱 URLS DE ACCESO

| Sección | URL |
|---------|-----|
| **Login** | https://www.bisonteapp.com/login |
| **Cotizador** | https://www.bisonteapp.com/cotizador |
| **Historial** | https://www.bisonteapp.com/historial |
| **Perfil** | https://www.bisonteapp.com/perfil |
| **Admin Panel** | https://www.bisonteapp.com/admin/envios |

---

## ✅ VERIFICACIÓN EN CÓDIGO

La cuenta tiene acceso de administrador en:

1. **Base de datos** (`usuarios` table):
   - `esAdministrador = true`
   - `emailVerified = true`
   - `perfilCompleto = true`

2. **Middleware** (`middleware.js` línea 140):
   ```javascript
   const admins = [
     "3000bisonte@gmail.com",
     "bisonteangela@gmail.com", 
     "bisonteoskar@gmail.com",
     "test@bisonteapp.com",  // ✅ AGREGADO
   ];
   ```

3. **Admin Panel** (`src/app/admin/envios/page.js` línea 55):
   ```javascript
   const ADMIN_EMAILS = [
     "3000bisonte@gmail.com",
     "bisonteangela@gmail.com",
     "bisonteoskar@gmail.com",
     "test@bisonteapp.com",  // ✅ AGREGADO
   ];
   ```

---

## 📞 CONTACTO DE SOPORTE

Si Google Play necesita más información:

- **Email de Soporte:** 3000bisonte@gmail.com
- **Política de Privacidad:** https://www.bisonteapp.com/privacy-policy
- **Términos y Condiciones:** https://www.bisonteapp.com/terms

---

## ⚠️ NOTAS IMPORTANTES

1. ✅ Esta cuenta está creada en la base de datos de **PRODUCCIÓN**
2. ✅ La contraseña es fuerte y cumple todos los requisitos de seguridad
3. ✅ El email está verificado automáticamente
4. ✅ El perfil está completo (no requiere pasos adicionales)
5. ✅ Tiene acceso completo a todas las funcionalidades de administrador
6. ✅ Las credenciales no expiran
7. ✅ No requiere ubicación específica para funcionar

---

## 🎉 LISTO PARA ENVIAR

**Copia y pega** la información de las secciones **"Nombre de la instrucción"**, **"Nombre de usuario..."**, **"Contraseña"** y **"Cualquier otra información..."** directamente en el formulario de Google Play Console.

**Fecha de creación:** 12 de noviembre de 2025
**Estado:** ✅ LISTO PARA GOOGLE PLAY CONSOLE
