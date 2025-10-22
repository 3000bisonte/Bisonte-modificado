# 💳 Tarjetas de Prueba MercadoPago - Colombia

## 🇨🇴 **TARJETAS COLOMBIA (Producción)**

### ✅ **VISA - Aprobadas**
```
Número: 4013 5406 8274 6260
CVV: 123
Vencimiento: 11/25
Nombre: APRO
```

### ✅ **MASTERCARD - Aprobadas**
```
Número: 5031 7557 3453 0604
CVV: 123  
Vencimiento: 11/25
Nombre: APRO
```

### ❌ **VISA - Rechazadas (para probar errores)**
```
Número: 4013 5406 8274 6269
CVV: 123
Vencimiento: 11/25
Nombre: OTHE
```

### ❌ **MASTERCARD - Rechazadas**
```
Número: 5031 7557 3453 0611
CVV: 123
Vencimiento: 11/25
Nombre: OTHE
```

### ⏳ **Tarjetas con Revisión Manual**
```
Número: 4509 9535 6623 3704
CVV: 123
Vencimiento: 11/25
Nombre: CONT
```

## 🏛️ **PSE - Bancos de Prueba**

### ✅ **Banco Aprobado**
- **Banco**: Banco de Bogotá
- **Usuario**: TESTUSER
- **Contraseña**: 123456789

### ❌ **Banco Rechazado**
- **Banco**: Bancolombia  
- **Usuario**: TESTUSER
- **Contraseña**: 123456789

## 📱 **Datos de Prueba Adicionales**

### **Email de Prueba**:
```
test_user_123456@testuser.com
```

### **Documento de Identidad**:
```
Tipo: CC (Cédula de Ciudadanía)
Número: 12345678
```

### **Teléfono**:
```
+57 300 123 4567
```

## 🔧 **Cómo Probar**

### **1. Pago Exitoso con Tarjeta**:
1. Usar tarjeta VISA: `4013 5406 8274 6260`
2. CVV: `123`, Vencimiento: `11/25`
3. Nombre: `APRO`
4. ✅ Resultado: Pago aprobado

### **2. Pago Rechazado con Tarjeta**:
1. Usar tarjeta VISA: `4013 5406 8274 6269`  
2. CVV: `123`, Vencimiento: `11/25`
3. Nombre: `OTHE`
4. ❌ Resultado: Pago rechazado

### **3. Pago PSE Exitoso**:
1. Seleccionar PSE como método
2. Elegir "Banco de Bogotá"
3. Usuario: `TESTUSER`
4. Contraseña: `123456789`
5. ✅ Resultado: Pago aprobado

### **4. Pago PSE Rechazado**:
1. Seleccionar PSE como método
2. Elegir "Bancolombia"
3. Usuario: `TESTUSER` 
4. Contraseña: `123456789`
5. ❌ Resultado: Pago rechazado

## 🎯 **Estados de Pago Esperados**

- **approved**: Pago exitoso inmediato
- **pending**: Pago pendiente (PSE, transferencias)
- **in_process**: Pago en revisión
- **rejected**: Pago rechazado
- **cancelled**: Pago cancelado por el usuario

## ⚠️ **Notas Importantes**

1. **Ambiente**: Estas tarjetas funcionan en **producción** MercadoPago Colombia
2. **Montos**: Usar montos bajos para pruebas (ej: $1000 COP)
3. **Frecuencia**: No hacer muchas transacciones seguidas con la misma tarjeta
4. **Documentos**: Los documentos son ficticios, solo para pruebas

---
**Actualizado**: $(Get-Date -Format "yyyy-MM-dd")
**Fuente**: MercadoPago Colombia Testing Documentation