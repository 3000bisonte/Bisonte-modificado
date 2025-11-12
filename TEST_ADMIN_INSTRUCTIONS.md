# 🔐 Instrucciones para Acceso de Administrador

## ✅ Estado del Usuario

El usuario **test@bisonteapp.com** ha sido creado/actualizado correctamente en la base de datos con:

- ✅ **Email:** test@bisonteapp.com
- ✅ **Password:** TestBisonte2024!
- ✅ **esAdministrador:** true (tiene permisos de admin)
- ✅ **emailVerified:** true
- ✅ **perfilCompleto:** true
- ✅ **En middleware:** ✓ Incluido en lista de admins

---

## 🚀 Pasos para Acceder como Admin

### 1️⃣ **Cerrar Sesión Actual**

Si ya estás logueado, primero cierra sesión:
- Ve a tu perfil o menú
- Click en "Cerrar Sesión" / "Sign Out"

### 2️⃣ **Limpiar Cookies del Navegador**

**Opción A - Chrome/Edge:**
1. Presiona `F12` para abrir DevTools
2. Ve a la pestaña **Application**
3. En el panel izquierdo, expande **Cookies**
4. Click en `https://www.bisonteapp.com`
5. Haz click derecho → **Clear** (eliminar todas las cookies)

**Opción B - Todos los navegadores:**
1. Abre el sitio: `https://www.bisonteapp.com`
2. Presiona `Ctrl + Shift + Delete`
3. Selecciona "Cookies y otros datos de sitios"
4. Click en "Borrar datos"

### 3️⃣ **Cerrar y Abrir el Navegador**

Cierra completamente el navegador y ábrelo de nuevo.

### 4️⃣ **Iniciar Sesión**

1. Ve a: `https://www.bisonteapp.com`
2. Inicia sesión con:
   ```
   Email: test@bisonteapp.com
   Password: TestBisonte2024!
   ```

### 5️⃣ **Acceder al Panel de Admin**

Después de iniciar sesión, accede directamente a:
```
https://www.bisonteapp.com/admin/envios
```

---

## 🔍 Verificación del Role

El sistema asigna el role de la siguiente manera:

```javascript
// En src/lib/auth.js (línea 299)
role: user.esAdministrador ? 'admin' : user.esRecolector ? 'collector' : 'user'
```

Cuando inicias sesión, el token JWT contiene:
- `token.userId`: ID del usuario
- `token.role`: "admin" (porque esAdministrador = true)
- `token.email`: "test@bisonteapp.com"

El middleware verifica:
```javascript
// En middleware.js (líneas 158-162)
const admins = [
  "3000bisonte@gmail.com",
  "bisonteangela@gmail.com", 
  "bisonteoskar@gmail.com",
  "test@bisonteapp.com",  // ✅ Tu usuario está aquí
];
```

---

## ❓ Solución de Problemas

### Problema: "Unauthorized" o "Access Denied"

**Solución:**
1. Verifica que limpiaste las cookies
2. Cierra sesión completamente
3. Cierra el navegador
4. Abre una ventana de incógnito
5. Inicia sesión de nuevo

### Problema: No aparece el botón de Admin

**Verifica en DevTools:**
1. Presiona `F12`
2. Ve a **Console**
3. Escribe: `localStorage.getItem('session')`
4. Deberías ver tu sesión con `role: "admin"`

### Problema: Sigue sin funcionar

**Prueba en Incógnito:**
1. Abre una ventana de incógnito (`Ctrl + Shift + N`)
2. Ve a `https://www.bisonteapp.com`
3. Inicia sesión con test@bisonteapp.com
4. Intenta acceder a `/admin/envios`

---

## 📊 Información para Google Play Console

Usa esta información en el formulario de "Access restrictions":

### Nombre de la instrucción
```
Full App Access Credentials
```

### Email
```
test@bisonteapp.com
```

### Password
```
TestBisonte2024!
```

### Instrucciones adicionales
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

5. To access admin panel: Navigate to www.bisonteapp.com/admin/envios
   (This account has administrator privileges to review all shipments)

The app includes:
- User registration/login (email or Google Sign-In)
- Shipping quote calculator
- Payment integration (MercadoPago)
- Order history
- Admin panel for shipment management
- AdMob advertisements

No 2-step verification or biometric login is required with these test credentials.
```

---

## 🎯 Verificación Final

Para confirmar que todo funciona:

1. ✅ Iniciar sesión → Debe llevarte a `/home`
2. ✅ Ir a `/admin/envios` → Debe mostrarte el panel de admin
3. ✅ Ver lista de envíos → Debe mostrarte todos los pedidos
4. ✅ Poder cambiar estados → Debe permitirte actualizar pedidos

---

## 📝 Notas Adicionales

- El usuario ya existe en la base de datos (ID: 225)
- La contraseña fue actualizada el 12/11/2025
- El usuario tiene todos los permisos necesarios
- El middleware ya incluye el email en la lista de admins
- Si aún no funciona, el problema es la caché del navegador o sesión antigua

---

**¿Necesitas ayuda?**

Si después de seguir estos pasos sigues sin poder acceder como admin, verifica:
1. Que realmente limpiaste las cookies
2. Que cerraste el navegador completamente
3. Que no tienes extensiones bloqueando cookies
4. Que estás usando el email exacto: `test@bisonteapp.com` (no test@bisonte.com ni variaciones)
