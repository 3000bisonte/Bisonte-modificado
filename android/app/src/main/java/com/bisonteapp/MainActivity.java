package com.bisonteapp;

import com.getcapacitor.BridgeActivity;

// Se revierte la inicialización manual de MobileAds porque el plugin AdMob ya gestiona
// la dependencia internamente y la declaración 'implementation' del plugin no expone
// las clases MobileAds al módulo app. El meta-data APPLICATION_ID del manifest se usa
// para la auto-inicialización.
public class MainActivity extends BridgeActivity {}
