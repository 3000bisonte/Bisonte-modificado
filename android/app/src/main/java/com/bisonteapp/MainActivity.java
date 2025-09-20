package com.bisonteapp;

import android.os.Bundle;
import android.util.Log;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import com.getcapacitor.BridgeActivity;
import com.bisonte.auth.BisonteAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Registrar el plugin BisonteAuth
        registerPlugin(BisonteAuth.class);

        // Diagnóstico: loggear el APPLICATION_ID de AdMob desde el Manifest
        try {
            ApplicationInfo appInfo = getPackageManager().getApplicationInfo(getPackageName(), PackageManager.GET_META_DATA);
            if (appInfo.metaData != null) {
                String admobId = appInfo.metaData.getString("com.google.android.gms.ads.APPLICATION_ID");
                Log.d("BisonteAdMob", "APPLICATION_ID (Manifest): " + admobId);
            } else {
                Log.w("BisonteAdMob", "No metaData found in ApplicationInfo");
            }
        } catch (Exception e) {
            Log.e("BisonteAdMob", "Error reading APPLICATION_ID meta-data", e);
        }
    }
}
