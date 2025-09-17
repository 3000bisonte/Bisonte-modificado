package com.bisonte.auth

import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.getcapacitor.*
import net.openid.appauth.*

@CapacitorPlugin(name = "BisonteAuth")
class BisonteAuth : Plugin() {
  private var authService: AuthorizationService? = null
  private var authRequest: AuthorizationRequest? = null
  private var pendingCall: PluginCall? = null

  private val clientId = "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"
  private val redirectUri = Uri.parse("com.bisonteapp:/oauth2redirect")
  private val authEndpoint = Uri.parse("https://accounts.google.com/o/oauth2/v2/auth")
  private val tokenEndpoint = Uri.parse("https://oauth2.googleapis.com/token")

  @PluginMethod
  fun googleSignInCCT(call: PluginCall) {
    if (pendingCall != null) {
      call.reject("Another auth in progress")
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
    authRequest = builder.build()

    authService = AuthorizationService(bridge.activity)
    val customTabsIntent = CustomTabsIntent.Builder().build()
    val authIntent = authService!!.getAuthorizationRequestIntent(authRequest!!, customTabsIntent)
    startActivityForResult(call, authIntent, "handleAuthResult")
  }

  @ActivityCallback
  fun handleAuthResult(result: ActivityResult) {
    val call = pendingCall ?: return
    val data: Intent? = result.data
    val resp = AuthorizationResponse.fromIntent(data!!)
    val ex = AuthorizationException.fromIntent(data)
    if (resp == null) {
      call.reject(ex?.errorDescription ?: "Authorization failed")
      pendingCall = null
      return
    }

    val tokenReq = resp.createTokenExchangeRequest()
    authService?.performTokenRequest(tokenReq) { tokenResp, tokenEx ->
      if (tokenResp != null) {
        val idToken = tokenResp.idToken
        val accessToken = tokenResp.accessToken
        if (!idToken.isNullOrBlank()) {
          val ret = JSObject()
          ret.put("idToken", idToken)
          if (!accessToken.isNullOrBlank()) ret.put("accessToken", accessToken)
          call.resolve(ret)
        } else {
          call.reject("No idToken in token response")
        }
      } else {
        call.reject(tokenEx?.errorDescription ?: "Token exchange failed")
      }
      pendingCall = null
    }
  }
}
