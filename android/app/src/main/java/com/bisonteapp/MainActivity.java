package com.bisonteapp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.bisonte.auth.BisonteAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Registrar el plugin BisonteAuth
        registerPlugin(BisonteAuth.class);
    }
}
