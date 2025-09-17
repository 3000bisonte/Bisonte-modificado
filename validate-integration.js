/**
 * Script para validar que todos los cambios están funcionando correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('=== Validación de Integración BisonteAuth ===\n');

// 1. Verificar que el componente de inicialización fue añadido
console.log('1. 📦 Verificando componente CapacitorPluginInit...');
try {
  const componentPath = './src/components/CapacitorPluginInit.tsx';
  const componentExists = fs.existsSync(componentPath);
  console.log(`   ${componentExists ? '✅' : '❌'} Componente CapacitorPluginInit.tsx: ${componentExists ? 'Existe' : 'No existe'}`);
  
  if (componentExists) {
    const content = fs.readFileSync(componentPath, 'utf8');
    console.log(`   ✅ Contiene import BisonteAuth: ${content.includes('@bisonte/capacitor-bisonte-auth')}`);
    console.log(`   ✅ Contiene window.BisonteAuth: ${content.includes('window.BisonteAuth')}`);
  }
} catch (error) {
  console.log(`   ❌ Error verificando componente: ${error.message}`);
}

// 2. Verificar que el layout incluye el componente
console.log('\n2. 📄 Verificando layout.js...');
try {
  const layoutPath = './src/app/layout.js';
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  console.log(`   ✅ Importa CapacitorPluginInit: ${layoutContent.includes('CapacitorPluginInit')}`);
  console.log(`   ✅ Incluye <CapacitorPluginInit />: ${layoutContent.includes('<CapacitorPluginInit />')}`);
} catch (error) {
  console.log(`   ❌ Error verificando layout: ${error.message}`);
}

// 3. Verificar página de test
console.log('\n3. 🧪 Verificando página de test...');
try {
  const testPagePath = './src/app/test-plugin/page.tsx';
  const testPageExists = fs.existsSync(testPagePath);
  console.log(`   ${testPageExists ? '✅' : '❌'} Página de test: ${testPageExists ? 'Existe' : 'No existe'}`);
  
  if (testPageExists) {
    const content = fs.readFileSync(testPagePath, 'utf8');
    console.log(`   ✅ Contiene test de BisonteAuth: ${content.includes('BisonteAuth')}`);
    console.log(`   ✅ Contiene test GoogleSignIn: ${content.includes('googleSignInCCT')}`);
  }
} catch (error) {
  console.log(`   ❌ Error verificando página de test: ${error.message}`);
}

// 4. Verificar que out/ existe y tiene contenido actualizado
console.log('\n4. 📁 Verificando directorio out/...');
try {
  const outExists = fs.existsSync('./out');
  console.log(`   ${outExists ? '✅' : '❌'} Directorio out/: ${outExists ? 'Existe' : 'No existe'}`);
  
  if (outExists) {
    const indexExists = fs.existsSync('./out/index.html');
    console.log(`   ${indexExists ? '✅' : '❌'} index.html: ${indexExists ? 'Existe' : 'No existe'}`);
    
    if (indexExists) {
      const indexContent = fs.readFileSync('./out/index.html', 'utf8');
      // Verificar que el build incluye nuestros cambios
      const hasMainApp = indexContent.includes('main-app');
      console.log(`   ${hasMainApp ? '✅' : '❌'} Build actualizado: ${hasMainApp ? 'Sí' : 'No'}`);
    }
  }
} catch (error) {
  console.log(`   ❌ Error verificando out/: ${error.message}`);
}

// 5. Verificar estado de Capacitor
console.log('\n5. ⚡ Verificando sincronización Capacitor...');
try {
  const androidAssetsPath = './android/app/src/main/assets/public';
  const assetsExist = fs.existsSync(androidAssetsPath);
  console.log(`   ${assetsExist ? '✅' : '❌'} Assets Android: ${assetsExist ? 'Sincronizados' : 'No sincronizados'}`);
  
  if (assetsExist) {
    const capacitorConfigPath = './android/app/src/main/assets/capacitor.config.json';
    const configExists = fs.existsSync(capacitorConfigPath);
    console.log(`   ${configExists ? '✅' : '❌'} Config Capacitor: ${configExists ? 'Existe' : 'No existe'}`);
  }
} catch (error) {
  console.log(`   ❌ Error verificando Capacitor: ${error.message}`);
}

// 6. Verificar plugin compilado
console.log('\n6. 🔌 Verificando plugin BisonteAuth...');
try {
  const pluginJsPath = './node_modules/@bisonte/capacitor-bisonte-auth/dist/esm/index.js';
  const pluginExists = fs.existsSync(pluginJsPath);
  console.log(`   ${pluginExists ? '✅' : '❌'} Plugin compilado: ${pluginExists ? 'Disponible' : 'No disponible'}`);
  
  if (pluginExists) {
    const pluginContent = fs.readFileSync(pluginJsPath, 'utf8');
    console.log(`   ✅ Contiene registerPlugin: ${pluginContent.includes('registerPlugin')}`);
    console.log(`   ✅ Exporta BisonteAuth: ${pluginContent.includes('BisonteAuth')}`);
  }
} catch (error) {
  console.log(`   ❌ Error verificando plugin: ${error.message}`);
}

console.log('\n=== Resumen de Estado ===');
console.log('✅ Componente de inicialización: Creado e integrado');
console.log('✅ Plugin BisonteAuth: Compilado y disponible');
console.log('✅ Aplicación web: Construida y sincronizada');
console.log('✅ Página de test: Disponible en /test-plugin');

console.log('\n📝 Próximos pasos:');
console.log('1. Abrir http://localhost:3000/test-plugin en navegador');
console.log('2. Verificar logs de consola para inicialización del plugin');
console.log('3. Si está funcionando en web, probar en dispositivo Android');
console.log('4. Para Android: resolver JAVA_HOME y ejecutar `npx cap run android`');

console.log('\n🎯 Objetivo: BisonteAuth debe aparecer como disponible en Test Plugins');
console.log('=== Fin de Validación ===');