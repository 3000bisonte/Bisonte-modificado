package com.bisonte.auth

import android.content.Intent
import android.util.Log
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.result.ActivityResult
import androidx.browser.customtabs.CustomTabsIntent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import net.openid.appauth.AuthorizationException
import net.openid.appauth.AuthorizationRequest
import net.openid.appauth.AuthorizationResponse
import net.openid.appauth.AuthorizationService
import net.openid.appauth.AuthorizationServiceConfiguration
import net.openid.appauth.ResponseTypeValues

@CapacitorPlugin(name = "BisonteAuth")
class BisonteAuth : Plugin() {
  private var authService: AuthorizationService? = null
  private var authRequest: AuthorizationRequest? = null
  private var pendingCall: PluginCall? = null

  // Lee Android Client ID y redirect scheme desde meta-data para no hardcodear
  private fun readMeta(name: String): String? {
    return try {
      val appInfo = context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
      appInfo.metaData?.getString(name)
    } catch (e: Exception) {
      null
    }
  }

  private val androidClientId: String? by lazy { readMeta("com.bisonteapp.google.ANDROID_CLIENT_ID") }
  private val redirectScheme: String by lazy {
    (readMeta("com.bisonteapp.google.REDIRECT_SCHEME")
      ?: readMeta("google_redirect_scheme")
      ?: "com.bisonteapp")
  }
  private val clientId = androidClientId ?: ""
  private val redirectUri = Uri.parse("$redirectScheme:/oauth2redirect")
  private val authEndpoint = Uri.parse("https://accounts.google.com/o/oauth2/v2/auth")
  private val tokenEndpoint = Uri.parse("https://oauth2.googleapis.com/token")

  @PluginMethod
  fun googleSignInCCT(call: PluginCall) {
    Log.i("BisonteAuth", "googleSignInCCT: Iniciando flujo nativo Google OAuth")
    if (pendingCall != null) {
      call.reject("Another auth in progress")
      Log.w("BisonteAuth", "googleSignInCCT: Otro flujo de autenticación en progreso")
      return
    }
    pendingCall = call

    val serviceConfig = AuthorizationServiceConfiguration(authEndpoint, tokenEndpoint)
    val builder = AuthorizationRequest.Builder(
      serviceConfig,
      clientId,
      ResponseTypeValues.CODE,
      redirectUri
    )
    builder.setScopes("openid", "email", "profile")
    // CAMBIO: Agregar nonce para mayor seguridad
    builder.setNonce(java.util.UUID.randomUUID().toString())
    authRequest = builder.build()

    authService = AuthorizationService(getActivity())
    val customTabsIntent = CustomTabsIntent.Builder().build()
    val authIntent = authService!!.getAuthorizationRequestIntent(authRequest!!, customTabsIntent)
    Log.i("BisonteAuth", "googleSignInCCT: Lanzando CustomTab con redirectUri=" + redirectUri)
    startActivityForResult(call, authIntent, "handleAuthResult")
  }

  @ActivityCallback
  fun handleAuthResult(call: PluginCall, result: ActivityResult) {
    Log.i("BisonteAuth", "handleAuthResult: Recibido resultado de actividad")
    val data: Intent? = result.data
    
    // CAMBIO: Validación más robusta
    if (data == null) {
      call.reject("No data received from authorization")
      Log.e("BisonteAuth", "handleAuthResult: No data recibida del intent")
      pendingCall = null
      return
    }
    
    val resp = AuthorizationResponse.fromIntent(data)
    val ex = AuthorizationException.fromIntent(data)
    
    if (resp == null) {
      call.reject(ex?.errorDescription ?: "Authorization failed")
      Log.e("BisonteAuth", "handleAuthResult: AuthorizationResponse es null. Error=" + (ex?.errorDescription ?: "Desconocido"))
      pendingCall = null
      return
    }

    val tokenReq = resp.createTokenExchangeRequest()
    authService?.performTokenRequest(tokenReq) { tokenResp, tokenEx ->
      Log.i("BisonteAuth", "handleAuthResult: Recibiendo respuesta de intercambio de token")
      if (tokenResp != null) {
        val idToken = tokenResp.idToken
        val accessToken = tokenResp.accessToken
        Log.i("BisonteAuth", "handleAuthResult: idToken=" + (idToken ?: "null") + ", accessToken=" + (accessToken ?: "null"))
        if (!idToken.isNullOrBlank()) {
          val ret = JSObject()
          ret.put("idToken", idToken)
          if (!accessToken.isNullOrBlank()) ret.put("accessToken", accessToken)
          call.resolve(ret)
          Log.i("BisonteAuth", "handleAuthResult: Autenticación exitosa, idToken entregado")
        } else {
          call.reject("No idToken in token response")
          Log.e("BisonteAuth", "handleAuthResult: No idToken en la respuesta de token")
        }
      } else {
        call.reject(tokenEx?.errorDescription ?: "Token exchange failed")
        Log.e("BisonteAuth", "handleAuthResult: Token exchange failed. Error=" + (tokenEx?.errorDescription ?: "Desconocido"))
      }
      pendingCall = null
    }
  }
}