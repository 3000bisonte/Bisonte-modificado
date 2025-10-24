# Configuración WebView Android - Manejo de Errores de Conexión

## Problema
Cuando no hay conexión a internet, el WebView muestra el error nativo:
```
net::ERR_NAME_NOT_RESOLVED
```

## Solución
Configurar el WebView para interceptar errores de carga y mostrar una página offline personalizada.

---

## Paso 1: Página Offline Creada

Ya se creó la página offline en:
```
public/offline.html
```

Esta página se servirá desde:
```
https://www.bisonteapp.com/offline.html
```

---

## Paso 2: Configurar WebView en Android

En tu proyecto de Android (donde tienes el WebView), necesitas configurar:

### MainActivity.java (o MainActivity.kt)

```java
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;

public class MainActivity extends AppCompatActivity {
    
    private WebView webView;
    private String mainUrl = "https://www.bisonteapp.com";
    private String offlineUrl = "https://www.bisonteapp.com/offline.html";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        
        // Configuración básica del WebView
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        
        // WebViewClient personalizado
        webView.setWebViewClient(new WebViewClient() {
            
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, 
                                       WebResourceError error) {
                super.onReceivedError(view, request, error);
                
                // Solo interceptar error en la URL principal
                if (request.getUrl().toString().equals(mainUrl)) {
                    // Verificar tipo de error
                    if (error.getErrorCode() == ERROR_HOST_LOOKUP ||
                        error.getErrorCode() == ERROR_CONNECT ||
                        error.getErrorCode() == ERROR_TIMEOUT ||
                        error.getErrorCode() == ERROR_UNKNOWN) {
                        
                        // Mostrar página offline
                        view.loadUrl(offlineUrl);
                    }
                }
            }
            
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, 
                                          SslError error) {
                // En producción, manejar errores SSL apropiadamente
                handler.cancel(); // No continuar en caso de error SSL
            }
        });
        
        // Cargar URL principal
        webView.loadUrl(mainUrl);
    }
    
    // Método para exponer a JavaScript (opcional)
    @JavascriptInterface
    public void reloadMainPage() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                webView.loadUrl(mainUrl);
            }
        });
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

### Versión Kotlin (MainActivity.kt)

```kotlin
import android.webkit.*

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private val mainUrl = "https://www.bisonteapp.com"
    private val offlineUrl = "https://www.bisonteapp.com/offline.html"
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webview)
        
        // Configuración del WebView
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
        }
        
        // WebViewClient personalizado
        webView.webViewClient = object : WebViewClient() {
            
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                
                // Solo interceptar error en la URL principal
                if (request?.url.toString() == mainUrl) {
                    error?.let {
                        when (it.errorCode) {
                            ERROR_HOST_LOOKUP,
                            ERROR_CONNECT,
                            ERROR_TIMEOUT,
                            ERROR_UNKNOWN -> {
                                // Mostrar página offline
                                view?.loadUrl(offlineUrl)
                            }
                        }
                    }
                }
            }
            
            override fun onReceivedSslError(
                view: WebView?,
                handler: SslErrorHandler?,
                error: SslError?
            ) {
                handler?.cancel() // No continuar en caso de error SSL
            }
        }
        
        // Exponer interfaz a JavaScript (opcional)
        webView.addJavascriptInterface(WebAppInterface(), "Android")
        
        // Cargar URL principal
        webView.loadUrl(mainUrl)
    }
    
    inner class WebAppInterface {
        @JavascriptInterface
        fun reloadMainPage() {
            runOnUiThread {
                webView.loadUrl(mainUrl)
            }
        }
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

---

## Paso 3: AndroidManifest.xml

Asegúrate de tener estos permisos:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permisos necesarios -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">
        
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize">
            <!-- ... -->
        </activity>
    </application>
</manifest>
```

---

## Paso 4: Alternativa con Archivo Local (Más Rápido)

Si prefieres no depender de la conexión para cargar offline.html, puedes guardarlo localmente:

### 1. Copia offline.html a `assets/`

```
app/src/main/assets/offline.html
```

### 2. Carga desde assets en el código:

```java
// En onReceivedError:
view.loadUrl("file:///android_asset/offline.html");
```

```kotlin
// En onReceivedError:
view?.loadUrl("file:///android_asset/offline.html")
```

---

## Paso 5: Verificación

### Probar sin conexión:

1. Activa modo avión
2. Abre la app
3. Deberías ver la página offline personalizada (NO el error nativo)
4. Click en "Reintentar"
5. Desactiva modo avión
6. La app debería recargar automáticamente

---

## Códigos de Error de WebView

```java
ERROR_UNKNOWN = -1
ERROR_HOST_LOOKUP = -2        // No se puede resolver DNS
ERROR_UNSUPPORTED_AUTH_SCHEME = -3
ERROR_AUTHENTICATION = -4
ERROR_PROXY_AUTHENTICATION = -5
ERROR_CONNECT = -6            // Error de conexión
ERROR_IO = -7
ERROR_TIMEOUT = -8            // Timeout
ERROR_REDIRECT_LOOP = -9
ERROR_UNSUPPORTED_SCHEME = -10
ERROR_FAILED_SSL_HANDSHAKE = -11
ERROR_BAD_URL = -12
ERROR_FILE = -13
ERROR_FILE_NOT_FOUND = -14
ERROR_TOO_MANY_REQUESTS = -15
```

---

## Características de offline.html

✅ **Auto-detección**: Verifica conexión cada 3 segundos
✅ **Listeners**: Escucha eventos 'online' del navegador
✅ **Botón Reintentar**: Permite recargar manualmente
✅ **Tips útiles**: Guía al usuario para solucionar
✅ **Diseño responsive**: Se ve bien en todos los tamaños
✅ **Animaciones**: Feedback visual atractivo
✅ **Sin dependencias**: HTML puro, no requiere internet

---

## Testing

### Caso 1: Sin conexión al iniciar
```
1. Modo avión ON
2. Abrir app
3. Ver offline.html
4. Modo avión OFF
5. Click "Reintentar"
6. App carga normalmente
```

### Caso 2: Pierde conexión durante uso
```
1. App funcionando
2. Modo avión ON
3. Navegar a otra página
4. Ver offline.html
5. Reconectar
6. Auto-recarga
```

---

## Notas Importantes

⚠️ **Sin esta configuración**: WebView seguirá mostrando `ERR_NAME_NOT_RESOLVED`

✅ **Con esta configuración**: Muestra página offline bonita y funcional

🔄 **ConnectionWrapper**: Sigue funcionando para cuando la app YA está cargada

🎯 **offline.html**: Maneja el caso cuando la app NO puede cargar inicialmente

---

## Despliegue

La página offline.html ya está desplegada en:
```
https://www.bisonteapp.com/offline.html
```

Puedes probarla directamente en el navegador para ver cómo se ve.

---

## ¿Preguntas?

Si necesitas ayuda implementando esto en tu WebView de Android, puedo:
1. Revisar tu código actual de MainActivity
2. Adaptar el código a tu estructura específica
3. Agregar más funcionalidades personalizadas
