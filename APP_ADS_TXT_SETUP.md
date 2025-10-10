# 📄 Configuración de app-ads.txt para AdMob

## ✅ ¿Qué es app-ads.txt?

El archivo **app-ads.txt** es un estándar de la industria publicitaria que:
- Autoriza a Google AdMob a vender espacio publicitario en tu app
- Previene fraude publicitario
- Aumenta la confianza de los anunciantes
- **Puede aumentar tus ingresos hasta 10-20%**

---

## 📁 Archivos Creados

### 1. `public/app-ads.txt`
Archivo estático servido por Next.js

### 2. `app-ads.txt` (raíz)
Backup en la raíz del proyecto

### 3. `src/app/app-ads.txt/route.ts`
API Route de Next.js para servir el archivo dinámicamente

---

## 📝 Contenido del Archivo

```txt
# app-ads.txt para Bisonte Logística
google.com, pub-1352045169606160, DIRECT, f08c47fec0942fa0
```

**Explicación:**
- `google.com` - Dominio del proveedor de anuncios (Google)
- `pub-1352045169606160` - Tu Publisher ID de AdMob
- `DIRECT` - Relación directa con Google
- `f08c47fec0942fa0` - Certificación ID de Google

---

## 🌐 Dónde Se Sirve

### En Producción:
Tu archivo app-ads.txt estará disponible en:
- **https://www.bisonteapp.com/app-ads.txt**

### Localmente:
- **http://localhost:3000/app-ads.txt**

---

## ✅ Verificar en AdMob Console

### Paso 1: Accede a AdMob
1. Ve a: https://apps.admob.com/
2. Selecciona tu app: **Bisonte Logística**

### Paso 2: Configura app-ads.txt
1. Ve a **"App settings"** → **"App info"**
2. Busca la sección **"app-ads.txt"**
3. Ingresa tu URL: `https://www.bisonteapp.com/app-ads.txt`
4. Click en **"Verify"**

### Paso 3: Espera Verificación
- **Tiempo:** 24-48 horas
- **Estado:** Aparecerá como "Verified" ✅
- **Efecto:** Aumenta confianza de anunciantes

---

## 🧪 Probar el Archivo

### Después de Deploy:
```bash
# Test en producción (después de hacer push)
curl https://www.bisonteapp.com/app-ads.txt

# Debe responder:
# google.com, pub-1352045169606160, DIRECT, f08c47fec0942fa0
```

### Localmente:
```bash
# Inicia el servidor
npm run dev

# En otra terminal:
curl http://localhost:3000/app-ads.txt
```

---

## 📊 Impacto en Ingresos

### Sin app-ads.txt:
- Algunos anunciantes no pujan por tu inventario
- Menor competencia = eCPM más bajo
- Menos confianza = menos anuncios premium

### Con app-ads.txt ✅:
- Todos los anunciantes pueden participar
- Mayor competencia = eCPM más alto
- Más confianza = más anuncios premium
- **Aumento estimado: 10-20% en ingresos**

---

## 🚀 Próximos Pasos

### 1. Hacer Deploy (AHORA)
```bash
git add .
git commit -m "feat: Agregar app-ads.txt para autorizar Google AdMob"
git push origin main
```

### 2. Esperar Deploy en Vercel (5 min)
Vercel automáticamente desplegará los cambios

### 3. Verificar en Producción (5 min después)
```bash
curl https://www.bisonteapp.com/app-ads.txt
```

### 4. Configurar en AdMob Console (10 min)
1. Ve a: https://apps.admob.com/
2. App settings → App info → app-ads.txt
3. URL: `https://www.bisonteapp.com/app-ads.txt`
4. Click "Verify"

### 5. Esperar Verificación (24-48 hrs)
- Estado cambiará a "Verified" ✅
- Comenzarás a ver mejores eCPM

---

## ⚠️ Importante

### No Modifiques el Formato
El archivo debe tener EXACTAMENTE este formato:
```
google.com, pub-1352045169606160, DIRECT, f08c47fec0942fa0
```

**No agregues:**
- Espacios extra
- Líneas en blanco al final (más allá de las que ya tiene)
- Caracteres especiales

### Si Cambias de Cuenta AdMob
Si en el futuro cambias a otra cuenta AdMob, actualiza:
1. El archivo `public/app-ads.txt`
2. El archivo `src/app/app-ads.txt/route.ts`
3. Haz push a GitHub
4. Re-verifica en AdMob Console

---

## 🔗 Recursos

| Recurso | URL |
|---------|-----|
| **Especificación app-ads.txt** | https://iabtechlab.com/ads-txt/ |
| **AdMob Console** | https://apps.admob.com/ |
| **Validador app-ads.txt** | https://adstxt.guru/ |
| **Documentación Google** | https://support.google.com/admob/answer/9363762 |

---

## 🆘 Solución de Problemas

### Problema: "No se pudo verificar app-ads.txt"
**Causas comunes:**
1. El archivo aún no se desplegó (espera 5-10 min después de push)
2. URL incorrecta en AdMob Console
3. Formato del archivo incorrecto

**Solución:**
```bash
# Verifica que el archivo esté accesible
curl https://www.bisonteapp.com/app-ads.txt

# Debe responder con el contenido correcto
```

### Problema: "Publisher ID no coincide"
**Solución:**
Verifica que el Publisher ID en el archivo sea: `pub-1352045169606160`

### Problema: "Archivo no encontrado (404)"
**Solución:**
1. Confirma que hiciste push a GitHub
2. Espera que Vercel complete el deploy
3. Verifica el deploy en: https://vercel.com/3000bisonte/bisonte-app

---

## ✅ Checklist

- [x] Archivo `public/app-ads.txt` creado
- [x] API Route `src/app/app-ads.txt/route.ts` creada
- [ ] Push a GitHub (hacer ahora)
- [ ] Esperar deploy en Vercel (5 min)
- [ ] Verificar URL accesible
- [ ] Configurar en AdMob Console
- [ ] Esperar verificación (24-48 hrs)
- [ ] Monitorear aumento en eCPM

---

**Siguiente paso:** Hacer push a GitHub
```bash
git add .
git commit -m "feat: Agregar app-ads.txt para autorizar Google AdMob"
git push origin main
```

---

_Última actualización: 8 de octubre, 2025_
