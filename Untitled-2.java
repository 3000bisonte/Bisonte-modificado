/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package app.vercel.bisonte_modificado.twa;

import android.content.ComponentName;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.annotation.SuppressLint;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.OnUserEarnedRewardListener;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;

import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.content.IntentFilter;

import androidx.annotation.NonNull;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;
import androidx.core.content.ContextCompat;


public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    private CustomTabsClient mClient;
    private CustomTabsSession mSession;
    private Uri URL = Uri.parse("https://bisonte-modificado.vercel.app");

    // This origin is going to be validated via DAL, please see
    // (https://developer.chrome.com/docs/android/post-message-twa#add_the_app_to_web_validation),
    // it has to either start with http or https.
    private Uri SOURCE_ORIGIN = Uri.parse("https://bisonte-modificado.vercel.app");
    private Uri TARGET_ORIGIN = Uri.parse("https://bisonte-modificado.vercel.app");
    private boolean mValidated = false;

    private final String TAG = "PostMessageDemo";
    private RewardedAd rewardedAd;
    private final String MAIN_ACTIVITY_TAG = "MainActivity";


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "LauncherActivity onCreate called.");
        System.out.println("LauncherActivity onCreate called.");
        Toast.makeText(this, "LauncherActivity onCreate called", Toast.LENGTH_SHORT).show();

        // Setting an orientation crashes the app due to the transparent background on Android 8.0
        // Oreo and below. We only set the orientation on Oreo and above. This only affects the
        // splash screen and Chrome will still respect the orientation.
        // See https://github.com/GoogleChromeLabs/bubblewrap/issues/496 for details.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
        // Crear un FrameLayout para contener el botón
        FrameLayout frameLayout = new FrameLayout(this);
        setContentView(frameLayout);

        // Crear un botón dinámicamente
        Button buttonShowAd = new Button(this);
        buttonShowAd.setText("Mostrar Anuncio Recompensado");
        buttonShowAd.setGravity(Gravity.CENTER);

        // Configurar LayoutParams para centrar el botón
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
        );
        params.gravity = Gravity.CENTER;
        buttonShowAd.setLayoutParams(params);

        // Añadir el botón al FrameLayout
        frameLayout.addView(buttonShowAd);

        // Configurar la acción del botón para mostrar el anuncio recompensado
        buttonShowAd.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showRewardedAd();
            }
        });
        // Cargar anuncio recompensado
        loadRewardedAd();

        bindCustomTabsService();
    }
    // Método para cargar el anuncio recompensado
    private void loadRewardedAd() {
        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(this, "ca-app-pub-3940256099942544/5224354917", adRequest, new RewardedAdLoadCallback() {
            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                Log.d(TAG, "Failed to load ad: " + loadAdError.getMessage());
                rewardedAd = null;
            }

            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                rewardedAd = ad;
                Log.d(TAG, "Ad was loaded.");
                setAdCallbacks();
            }
        });
    }

    // Método para mostrar el anuncio cuando esté disponible
    private void showRewardedAd() {
        if (rewardedAd != null) {
            rewardedAd.show(this, new OnUserEarnedRewardListener() {
                @Override
                public void onUserEarnedReward(@NonNull RewardItem rewardItem) {
                    Log.d(TAG, "User earned the reward: " + rewardItem.getAmount() + " " + rewardItem.getType());
                    sendRewardMessageToPWA(rewardItem.getAmount());
                }
            });
        } else {
            Log.d(TAG, "The rewarded ad wasn't ready yet.");
        }
    }
    private void sendRewardMessageToPWA() {
        if (mSession != null) {
            String rewardMessage = "{ \"type\": \"reward\", \"status\": \"completed\", \"details\": \"Recompensa otorgada\" }";
            mSession.postMessage(rewardMessage, null);
            Log.d(TAG, "Mensaje de recompensa enviado a la PWA: " + rewardMessage);
        } else {
            Log.e(TAG, "Sesión CustomTabs no está disponible para enviar mensaje.");
        }
    }

    // Configurar los callbacks del anuncio
    private void setAdCallbacks() {
        rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdClicked() {
                Log.d(TAG, "Ad was clicked.");
            }

            @Override
            public void onAdDismissedFullScreenContent() {
                Log.d(TAG, "Ad dismissed fullscreen content.");
                rewardedAd = null;
                loadRewardedAd(); // Recargar anuncio al cerrar
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError adError) {
                Log.e(TAG, "Ad failed to show: " + adError.getMessage());
                rewardedAd = null;
            }

            @Override
            public void onAdShowedFullScreenContent() {
                Log.d(TAG, "Ad showed fullscreen content.");
            }
        });
    }
    private final CustomTabsCallback customTabsCallback =
            new CustomTabsCallback() {
                @Override
                public void onPostMessage(@NonNull String message, @Nullable Bundle extras) {
                    super.onPostMessage(message, extras);

                    if (message == null) {
                        Log.d(TAG, "El mensaje es nulo.");
                        return;
                    }

                    Log.d(TAG, "Mensaje recibido: " + message);
                    if (message.contains("ACK")) {
                        return;
                    }

                    Log.d(TAG, "Got message: " + message);
                    if (message.equals("iniciarVideo")) {
                        showRewardedAd();  // Mostrar anuncio recompensado
                    }

                }

                @Override
                public void onRelationshipValidationResult(int relation, @NonNull Uri requestedOrigin,
                                                           boolean result, @Nullable Bundle extras) {
                    // If this fails:
                    // - Have you called warmup?
                    // - Have you set up Digital Asset Links correctly?
                    // - Double check what browser you're using.
                    Log.d(TAG, "Relationship result: " + relation + " " + requestedOrigin + " " + result + " " + extras);

                    mValidated = result;
                    Log.d(TAG, "Validation result: " + mValidated);
                }

                // Listens for navigation, requests the postMessage channel when one completes.
                @Override
                public void onNavigationEvent(int navigationEvent, @Nullable Bundle extras) {
                    Log.d(TAG, "Navigation Event: " + navigationEvent);
                    if (navigationEvent != NAVIGATION_FINISHED) {
                        return;
                    }

                    if (!mValidated) {
                        Log.d(TAG, "Not starting PostMessage as validation didn't succeed.");
                    }

                    // If this fails:
                    // - Have you included PostMessageService in your AndroidManifest.xml?
                    boolean result = mSession.requestPostMessageChannel(SOURCE_ORIGIN
                    );
                    Log.d(TAG, "Requested Post Message Channel: " + result);
                }

                @Override
                public void onMessageChannelReady(@Nullable Bundle extras) {
                    Log.d(TAG, "Message channel ready.");
                    String message = "{ \"type\": \"myAppMessage\", \"content\": \"primerMensajeAppAndroid\" }";


                    int result = mSession.postMessage(message, null);
                    //int result = mSession.postMessage({ type: "myAppMessage", content: "Hola desde app android" }, null);

                    Log.d(TAG, "postMessage returned: " + result);
                }
            };

    private void bindCustomTabsService() {
        String packageName = CustomTabsClient.getPackageName(this, null);
        Log.d(TAG, "Package Name: " + packageName);
        Toast.makeText(this, "Binding to " + packageName, Toast.LENGTH_SHORT).show();
        CustomTabsClient.bindCustomTabsService(this, packageName,
                new CustomTabsServiceConnection() {
                    @Override
                    public void onCustomTabsServiceConnected(@NonNull ComponentName name,
                                                             @NonNull CustomTabsClient client) {
                        mClient = client;

                        // Note: validateRelationship requires warmup to have been called.
                        boolean warmupSuccess = client.warmup(0L);
                        Log.d(TAG, "Warmup success: " + warmupSuccess);

                        mSession = mClient.newSession(customTabsCallback);
                        Log.d(TAG, "New session created: " + (mSession != null));

                        launch();

                    }

                    @Override
                    public void onServiceDisconnected(ComponentName componentName) {
                        mClient = null;
                        Log.w(TAG, "Custom Tabs Service Disconnected");

                    }
                });
    }

    private void launch() {
        new TrustedWebActivityIntentBuilder(URL).build(mSession)
                .launchTrustedWebActivity(LauncherActivity.this);
    }

//    @Override
//    protected Uri getLaunchingUrl() {
//        // Get the original launch Url.
//        Uri uri = super.getLaunchingUrl();
//
//
//
//        return uri;
//    }


}
