/**
 * Script para construir la aplicación específicamente para Capacitor
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Construyendo aplicación para Capacitor...\n');

// Paso 1: Limpiar directorio out si existe
if (fs.existsSync('./out')) {
  console.log('🧹 Limpiando directorio out...');
  fs.rmSync('./out', { recursive: true, force: true });
}

// Paso 2: Hacer build con CAPACITOR_BUILD=true para forzar export
console.log('📦 Construyendo aplicación...');
process.env.CAPACITOR_BUILD = 'true';

exec('npx next build', (error, stdout, _stderr) => {
  if (error) {
    console.error('❌ Error en build:', error);
    return;
  }
  
  console.log('✅ Build completado\n');
  console.log(stdout);
  
  // Paso 3: Verificar que out/ fue creado
  if (fs.existsSync('./out')) {
    console.log('✅ Directorio out/ creado exitosamente');
    
    // Verificar archivos críticos
    const criticalFiles = ['index.html', '_next'];
    criticalFiles.forEach(file => {
      const exists = fs.existsSync(path.join('./out', file));
      console.log(`   ${exists ? '✅' : '❌'} ${file}: ${exists ? 'Existe' : 'Falta'}`);
    });
  } else {
    console.log('❌ Directorio out/ no fue creado');
  }
  
  // Paso 4: Sincronizar con Capacitor
  console.log('\n⚡ Sincronizando con Capacitor...');
  exec('npx cap sync', (syncError, syncStdout, _syncStderr) => {
    if (syncError) {
      console.error('❌ Error sincronizando Capacitor:', syncError);
      return;
    }
    
    console.log('✅ Capacitor sincronizado');
    console.log(syncStdout);
    
    console.log('\n🎯 Aplicación lista para WebView móvil');
    console.log('📱 Para probar:');
    console.log('   1. npx cap run android (con JAVA_HOME configurado)');
    console.log('   2. O abrir Android Studio y ejecutar la app');
    console.log('   3. Ir a /test-plugin para verificar plugins');
    console.log('   4. Verificar que BisonteAuth aparece como disponible');
  });
});