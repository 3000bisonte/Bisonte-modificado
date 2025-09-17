/**
 * Test simple para verificar que BisonteAuth se carga correctamente
 */

console.log('🧪 Test de carga de BisonteAuth...\n');

// Simular entorno del navegador
global.window = {
  location: { protocol: 'capacitor:' }
};

// Test de import dinámico
async function testDynamicImport() {
  try {
    console.log('📦 Probando import dinámico...');
    
    // Simular import dinámico
    const modulePath = './node_modules/@bisonte/capacitor-bisonte-auth/dist/esm/index.js';
    const fs = require('fs');
    
    if (fs.existsSync(modulePath)) {
      console.log('✅ Módulo existe en', modulePath);
      
      const moduleContent = fs.readFileSync(modulePath, 'utf8');
      console.log('✅ Contenido del módulo:');
      console.log(moduleContent);
      
      // Verificar que contiene lo esperado
      const hasRegisterPlugin = moduleContent.includes('registerPlugin');
      const hasBisonteAuth = moduleContent.includes('BisonteAuth');
      
      console.log(`✅ Contiene registerPlugin: ${hasRegisterPlugin}`);
      console.log(`✅ Contiene BisonteAuth: ${hasBisonteAuth}`);
      
    } else {
      console.log('❌ Módulo no encontrado en', modulePath);
    }
    
  } catch (error) {
    console.log('❌ Error en test:', error.message);
  }
}

// Test de package.json
function testPackageJson() {
  try {
    console.log('\n📋 Verificando package.json...');
    const packageJson = require('./package.json');
    
    if (packageJson.dependencies && packageJson.dependencies['@bisonte/capacitor-bisonte-auth']) {
      console.log('✅ BisonteAuth está en dependencies');
      console.log('   Versión:', packageJson.dependencies['@bisonte/capacitor-bisonte-auth']);
    } else {
      console.log('❌ BisonteAuth NO está en dependencies');
    }
    
  } catch (error) {
    console.log('❌ Error verificando package.json:', error.message);
  }
}

// Ejecutar tests
testDynamicImport();
testPackageJson();

console.log('\n🎯 Para probar en navegador:');
console.log('   1. Abrir http://localhost:3000/test-plugin');
console.log('   2. Abrir DevTools y ver console logs');
console.log('   3. Verificar que BisonteAuth aparece como disponible');
console.log('   4. Si funciona en web, probarlo en dispositivo Android');