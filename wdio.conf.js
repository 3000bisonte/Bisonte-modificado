/**
 * WebdriverIO Configuration para Tests E2E Móviles
 * Testing de app Android con Appium
 */

exports.config = {
    // ====================
    // Runner Configuration
    // ====================
    runner: 'local',
    
    // ====================
    // Test Files
    // ====================
    specs: [
        './tests/mobile/**/*.spec.js'
    ],
    exclude: [],
    
    // ============
    // Capabilities
    // ============
    // Define tus dispositivos Android aquí
    capabilities: [{
        // Configuración para dispositivo Android real
        platformName: 'Android',
        'appium:deviceName': 'Android Device',
        'appium:platformVersion': '12.0', // Ajusta según tu dispositivo
        'appium:automationName': 'UiAutomator2',
        
        // Configuración de la app
        'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
        'appium:appPackage': 'com.bisonteapp',
        'appium:appActivity': '.MainActivity',
        
        // Configuraciones adicionales
        'appium:noReset': false, // Reinstalar app cada vez
        'appium:fullReset': false,
        'appium:autoGrantPermissions': true,
        'appium:unicodeKeyboard': true,
        'appium:resetKeyboard': true,
        
        // Configuración de red
        'appium:chromeOptions': {
            androidProcess: 'com.bisonteapp',
            androidUseRunningApp: true,
            args: ['--disable-web-security']
        }
    }],
    
    // ===================
    // Test Configurations
    // ===================
    logLevel: 'info',
    bail: 0,
    baseUrl: 'https://www.bisonteapp.com',
    waitforTimeout: 30000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    
    // Services
    services: [
        ['appium', {
            args: {
                relaxedSecurity: true,
                address: 'localhost',
                port: 4723,
                basePath: '/wd/hub/',
            },
            logPath: './tests/mobile/logs/'
        }]
    ],
    
    // Framework
    framework: 'mocha',
    reporters: ['spec'],
    
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    
    // =====
    // Hooks
    // =====
    /**
     * Gets executed once before all workers get launched.
     */
    onPrepare: function (config, capabilities) {
        console.log('🚀 Iniciando tests móviles...');
    },
    
    /**
     * Gets executed before a worker process is spawned.
     */
    onWorkerStart: function (cid, caps, specs, args, execArgv) {
        console.log(`📱 Worker ${cid} iniciado`);
    },
    
    /**
     * Gets executed before test execution begins.
     */
    before: function (capabilities, specs) {
        console.log('🧪 Preparando tests...');
    },
    
    /**
     * Runs before a WebdriverIO command gets executed.
     */
    beforeCommand: function (commandName, args) {
        // console.log(`Command: ${commandName}`, args);
    },
    
    /**
     * Gets executed just before initialising the webdriver session.
     */
    beforeSession: function (config, capabilities, specs) {
        console.log('📲 Iniciando sesión con dispositivo:', capabilities.platformName);
    },
    
    /**
     * Gets executed after all tests are done.
     */
    after: function (result, capabilities, specs) {
        console.log('✅ Tests completados');
    },
    
    /**
     * Gets executed after all workers got shut down and the process is about to exit.
     */
    onComplete: function(exitCode, config, capabilities, results) {
        console.log('🎉 Todos los tests móviles han finalizado');
    }
}
