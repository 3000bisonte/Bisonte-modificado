/**
 * Test específico para WebView - Diagnosticar por qué los plugins aparecen como false
 */

// Verificar que estamos en entorno WebView
const isWebView = () => {
  return typeof window !== 'undefined' && window.location.protocol === 'capacitor:';
};

// Verificar plugins disponibles
const testPluginsInWebView = async () => {
  console.log('=== Test Plugins en WebView ===');
  
  try {
    // Importar Capacitor
    const { Capacitor, CapacitorWeb } = await import('@capacitor/core');
    
    console.log('📱 Plataforma:', Capacitor.getPlatform());
    console.log('🌐 Nativo:', Capacitor.isNativePlatform());
    console.log('🔗 Protocol:', window.location.protocol);
    console.log('🌍 User Agent:', navigator.userAgent);
    
    // Verificar plugins registrados
    console.log('\n🔌 Plugins registrados:');
    const registeredPlugins = Object.keys(CapacitorWeb.plugins || {});
    console.log('Web plugins:', registeredPlugins);
    
    // Intentar importar BisonteAuth directamente
    try {
      const { BisonteAuth } = await import('@bisonte/capacitor-bisonte-auth');
      console.log('✅ BisonteAuth importado correctamente');
      console.log('🎯 Plugin objeto:', BisonteAuth);
      
      // Verificar métodos disponibles
      if (BisonteAuth && typeof BisonteAuth === 'object') {
        console.log('📋 Métodos disponibles:', Object.getOwnPropertyNames(BisonteAuth));
        
        // Intentar llamar al método
        if (BisonteAuth.googleSignInCCT) {
          console.log('✅ Método googleSignInCCT disponible');
          
          // Test del método (sin ejecutar realmente)
          console.log('🧪 Testeando disponibilidad del método...');
          try {
            // Solo verificar que el método existe, no lo ejecutamos
            const methodType = typeof BisonteAuth.googleSignInCCT;
            console.log(`✅ googleSignInCCT tipo: ${methodType}`);
          } catch (error) {
            console.log('❌ Error al verificar método:', error.message);
          }
        } else {
          console.log('❌ Método googleSignInCCT NO disponible');
        }
      }
    } catch (error) {
      console.log('❌ Error importando BisonteAuth:', error.message);
    }
    
    // Verificar si Capacitor puede acceder al plugin
    try {
      const capacitorPlugins = Capacitor.Plugins;
      console.log('\n🔍 Capacitor.Plugins:', Object.keys(capacitorPlugins));
      
      if (capacitorPlugins.BisonteAuth) {
        console.log('✅ BisonteAuth encontrado en Capacitor.Plugins');
      } else {
        console.log('❌ BisonteAuth NO encontrado en Capacitor.Plugins');
      }
    } catch (error) {
      console.log('❌ Error verificando Capacitor.Plugins:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
  
  console.log('\n=== Fin Test WebView ===');
};

// Ejecutar cuando el DOM esté listo
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testPluginsInWebView);
  } else {
    testPluginsInWebView();
  }
} else {
  // Entorno Node.js
  console.log('Ejecutándose en entorno Node.js - no WebView');
}