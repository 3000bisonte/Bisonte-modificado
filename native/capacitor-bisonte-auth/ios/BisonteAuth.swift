import Foundation
import Capacitor
import AppAuth

@objc(BisonteAuth)
public class BisonteAuth: CAPPlugin {
  var currentAuthorizationFlow: OIDExternalUserAgentSession?

  let clientId = "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"
  let redirectURI = URL(string: "com.bisonteapp:/oauth2redirect")!
  let issuer = URL(string: "https://accounts.google.com")!

  @objc func googleSignInCCT(_ call: CAPPluginCall) {
    OIDAuthorizationService.discoverConfiguration(forIssuer: issuer) { config, error in
      guard let config = config else {
        call.reject(error?.localizedDescription ?? "Discover failed")
        return
      }
      let request = OIDAuthorizationRequest(
        configuration: config,
        clientId: self.clientId,
        scopes: [OIDScopeOpenID, OIDScopeEmail, OIDScopeProfile],
        redirectURL: self.redirectURI,
        responseType: OIDResponseTypeCode,
        additionalParameters: nil
      )
      self.currentAuthorizationFlow = OIDAuthState.authState(byPresenting: request, presenting: self.bridge?.viewController) { authState, error in
        if let state = authState {
          if let idToken = state.lastTokenResponse?.idToken {
            call.resolve(["idToken": idToken])
          } else {
            call.reject("No idToken in response")
          }
        } else {
          call.reject(error?.localizedDescription ?? "Auth failed")
        }
      }
    }
  }
}
