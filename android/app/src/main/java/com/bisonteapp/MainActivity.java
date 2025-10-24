package com.bisonteapp;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

// Se revierte la inicialización manual de MobileAds porque el plugin AdMob ya gestiona
// la dependencia internamente y la declaración 'implementation' del plugin no expone
// las clases MobileAds al módulo app. El meta-data APPLICATION_ID del manifest se usa
// para la auto-inicialización.
public class MainActivity extends BridgeActivity {
    
    private static final String MAIN_URL = "https://www.bisonteapp.com";
    private static final String OFFLINE_URL = "file:///android_asset/public/offline.html";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Obtener el WebView de Capacitor y configurar el WebViewClient
        WebView webView = getBridge().getWebView();
        
        // Configurar el WebViewClient para manejar errores de conexión
        webView.setWebViewClient(new WebViewClient() {
            
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                
                // Solo interceptar errores en la URL principal
                String requestUrl = request.getUrl().toString();
                
                // Verificar si es la URL principal o si está navegando en la app
                if (requestUrl.startsWith(MAIN_URL)) {
                    int errorCode = error.getErrorCode();
                    
                    // Verificar errores de conexión
                    if (errorCode == ERROR_HOST_LOOKUP ||      // No se puede resolver DNS
                        errorCode == ERROR_CONNECT ||          // Error de conexión
                        errorCode == ERROR_TIMEOUT ||          // Timeout
                        errorCode == ERROR_UNKNOWN) {          // Error desconocido
                        
                        // Mostrar página offline en lugar del error nativo
                        view.loadUrl(OFFLINE_URL);
                    }
                }
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Permitir que Capacitor maneje la navegación normalmente
                return false;
            }
        });
        
        // Exponer interfaz JavaScript para recargar la página principal
        webView.addJavascriptInterface(new WebAppInterface(), "Android");
    }
    
    /**
     * Interfaz JavaScript para interactuar con el WebView
     */
    public class WebAppInterface {
        
        @JavascriptInterface
        public void reloadMainPage() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    WebView webView = getBridge().getWebView();
                    webView.loadUrl(MAIN_URL);
                }
            });
        }
    }
}
