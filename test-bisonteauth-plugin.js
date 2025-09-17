// Test específico para verificar BisonteAuth plugin
const { Capacitor } = require('@capacitor/core');

console.log('=== Test BisonteAuth Plugin ===');
console.log('Platform:', Capacitor.getPlatform());
console.log('Native Platform:', Capacitor.isNativePlatform());

// Verificar si el plugin está disponible
try {
    // Intentar importar el plugin
    const { BisonteAuth } = require('@bisonte/capacitor-bisonte-auth');
    console.log('✅ BisonteAuth plugin importado correctamente');
    
    // Verificar métodos disponibles
    console.log('Métodos disponibles:', Object.getOwnPropertyNames(BisonteAuth));
    
    // Verificar disponibilidad específica
    if (BisonteAuth && BisonteAuth.googleSignInCCT) {
        console.log('✅ Método googleSignInCCT disponible');
    } else {
        console.log('❌ Método googleSignInCCT NO disponible');
    }
    
} catch (error) {
    console.log('❌ Error al importar BisonteAuth:', error.message);
}

// Verificar registro en Capacitor
try {
    const plugins = Capacitor.Plugins;
    console.log('Plugins registrados:', Object.keys(plugins));
    
    if (plugins.BisonteAuth) {
        console.log('✅ BisonteAuth está registrado en Capacitor');
    } else {
        console.log('❌ BisonteAuth NO está registrado en Capacitor');
    }
} catch (error) {
    console.log('❌ Error verificando plugins:', error.message);
}

console.log('=== Fin del Test ===');