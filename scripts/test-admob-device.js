#!/usr/bin/env node
/**
 * Test de AdMob en dispositivo Android
 * Para ejecutar después de compilar la APK
 */

const { execSync } = require('child_process');

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

console.log(`${c.bold}${c.cyan}`);
console.log('═══════════════════════════════════════════════════════');
console.log('     TEST DE ADMOB EN DISPOSITIVO ANDROID');
console.log('═══════════════════════════════════════════════════════');
console.log(c.reset);
console.log('');

console.log(`${c.bold}Este test requiere un dispositivo Android conectado${c.reset}\n`);

// Verificar que ADB esté disponible
try {
  execSync('adb --version', { stdio: 'ignore' });
  console.log(`${c.green}✓${c.reset} ADB disponible\n`);
} catch {
  console.log(`${c.red}✗${c.reset} ADB no encontrado. Instala Android SDK Platform-Tools\n`);
  console.log('Descarga desde: https://developer.android.com/studio/releases/platform-tools\n');
  process.exit(1);
}

// Verificar dispositivos conectados
console.log(`${c.cyan}Verificando dispositivos conectados...${c.reset}`);
try {
  const devices = execSync('adb devices').toString();
  console.log(devices);
  
  if (!devices.includes('device') || devices.split('\n').length <= 2) {
    console.log(`${c.yellow}⚠${c.reset} No hay dispositivos conectados\n`);
    console.log('Conecta tu dispositivo Android y habilita USB Debugging\n');
    console.log('Pasos:');
    console.log('1. Ve a Configuración → Acerca del teléfono');
    console.log('2. Toca "Número de compilación" 7 veces');
    console.log('3. Ve a Configuración → Opciones de desarrollador');
    console.log('4. Activa "Depuración USB"');
    console.log('5. Conecta el cable USB y autoriza la computadora\n');
    process.exit(1);
  }
} catch (error) {
  console.log(`${c.red}✗${c.reset} Error verificando dispositivos: ${error.message}\n`);
  process.exit(1);
}

// Obtener Device ID para testing
console.log(`${c.cyan}\nObteniendo Device ID...${c.reset}`);
try {
  const deviceId = execSync('adb shell settings get secure android_id').toString().trim();
  console.log(`${c.green}✓${c.reset} Device ID: ${c.bold}${deviceId}${c.reset}\n`);
  
  console.log(`${c.yellow}⚠ IMPORTANTE:${c.reset} Agrega este Device ID a tu configuración de AdMob\n`);
  console.log('Para testing sin afectar estadísticas, agrega a .env.local:');
  console.log(`${c.cyan}NEXT_PUBLIC_ADMOB_TEST_DEVICES=${deviceId}${c.reset}\n`);
} catch (error) {
  console.log(`${c.yellow}⚠${c.reset} No se pudo obtener Device ID: ${error.message}\n`);
}

// Verificar si la app está instalada
console.log(`${c.cyan}Verificando si la app está instalada...${c.reset}`);
try {
  const packages = execSync('adb shell pm list packages com.bisonteapp').toString();
  if (packages.includes('com.bisonteapp')) {
    console.log(`${c.green}✓${c.reset} App instalada: com.bisonteapp\n`);
  } else {
    console.log(`${c.yellow}⚠${c.reset} App no instalada\n`);
    console.log('Instala la APK primero:');
    console.log(`${c.cyan}adb install android/app/build/outputs/apk/release/app-release.apk${c.reset}\n`);
    process.exit(1);
  }
} catch (error) {
  console.log(`${c.yellow}⚠${c.reset} Error verificando app: ${error.message}\n`);
}

// Instrucciones de testing manual
console.log(`${c.bold}${c.cyan}INSTRUCCIONES DE TESTING:${c.reset}\n`);

console.log('1️⃣  Abre la app en tu dispositivo Android\n');

console.log('2️⃣  Inicia sesión con tu cuenta\n');

console.log('3️⃣  Crea un nuevo envío:');
console.log('   → Ingresa datos de remitente');
console.log('   → Ingresa datos de destinatario');
console.log('   → Configura el envío\n');

console.log('4️⃣  En la pantalla de Resumen:');
console.log(`   → Verifica que aparezca el botón: ${c.green}"Ver anuncio para obtener descuento"${c.reset}`);
console.log('   → Toca el botón para ver el anuncio\n');

console.log('5️⃣  Durante el anuncio:');
console.log('   → El anuncio debe cargar (puede tomar 5-10 segundos)');
console.log('   → Mira el anuncio COMPLETO hasta el final');
console.log('   → Toca el botón de cerrar (X) cuando aparezca');
console.log(`   → ${c.yellow}⚠ NO toques el anuncio si eres tú (evita clicks inválidos)${c.reset}\n`);

console.log('6️⃣  Verificar recompensa:');
console.log('   → El descuento de $2,013 COP debe aplicarse');
console.log('   → El total debe reducirse automáticamente\n');

console.log('7️⃣  Monitorear en AdMob:');
console.log('   → Ve a: https://apps.admob.com/#reports');
console.log('   → Selecciona "Last 7 days"');
console.log('   → Filtra por tu Rewarded Ad Unit');
console.log(`   → ${c.cyan}Las impresiones aparecerán en 24-48 horas${c.reset}\n`);

console.log(`${c.bold}${c.cyan}VALIDACIONES:${c.reset}\n`);

console.log(`${c.green}✓${c.reset} El anuncio se carga correctamente`);
console.log(`${c.green}✓${c.reset} El anuncio es de un anunciante real (no de prueba)`);
console.log(`${c.green}✓${c.reset} El descuento se aplica después de ver el anuncio`);
console.log(`${c.green}✓${c.reset} No hay errores en consola\n`);

console.log(`${c.bold}${c.cyan}VERIFICAR LOGCAT:${c.reset}\n`);
console.log('Para ver logs de AdMob en tiempo real:');
console.log(`${c.cyan}adb logcat | grep -i "admob\\|google\\|reward"${c.reset}\n`);

console.log(`${c.bold}${c.cyan}SEÑALES DE ÉXITO:${c.reset}\n`);
console.log(`${c.green}✓${c.reset} Ves "AdMob: Initialization complete"`);
console.log(`${c.green}✓${c.reset} Ves "AdMob: Reward ad loaded"`);
console.log(`${c.green}✓${c.reset} Ves "AdMob: Reward earned"`);
console.log(`${c.green}✓${c.reset} El anuncio tiene marca de agua "Ad" o "Anuncio"\n`);

console.log(`${c.yellow}⚠ RECORDATORIO:${c.reset}\n`);
console.log('1. NO hagas click en los anuncios frecuentemente');
console.log('2. Usa diferentes usuarios para probar (amigos/familia)');
console.log('3. Espera 24-48 horas para ver datos en AdMob Console');
console.log('4. Los primeros pagos llegan cuando acumules $100 USD\n');

console.log(`${c.bold}${c.green}¡Buena suerte! 🚀${c.reset}\n`);
