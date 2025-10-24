"use client";
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-misused-promises, no-console */
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";

import { ADMOB_CONFIG } from "../config/admob.config";
import { useMultipleLoadingMonitor } from "../hooks/useLoadingMonitor";
import { useNotification } from "../hooks/useNotification";
import AdMobService, { useAdMob } from "../services/AdMobService";

import AdLoadingIndicator from "./AdLoadingIndicator";
import BottomNav from "./BottomNav";
import MegaSaleModal from "./MegaSaleModal";
import NotificationModal from "./NotificationModal";

// --- Helper Functions ---
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function generarNumeroGuia() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `BIS${timestamp.slice(-6)}${random}`;
}

const ciudades = {
  "11001": "Bogotá D.C.", "25001": "Funza", "25019": "Mosquera",
  "25040": "Madrid", "25148": "Cota", "25175": "Chía",
  "25183": "Cajicá", "25189": "La Calera", "25785": "Tabio",
  "25740": "Soacha", "25743": "Sibaté",
};

const REWARDED_CHAIN_MIN = 2;
const REWARDED_CHAIN_MAX = 3;

// --- Main Component ---
export default function Resumen() {
  const { data: session } = useSession();
  const router = useRouter();

  // --- State Management ---
  const [cotizador, setCotizador] = useState(null);
  const [remitente, setRemitente] = useState(null);
  const [destinatario, setDestinatario] = useState(null);
  const [costoTotal, setCostoTotal] = useState(null);
  const fecha = useMemo(() => formatDate(new Date()), []);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [rewardBanner, setRewardBanner] = useState(null);
  const [rewardChainProgress, setRewardChainProgress] = useState(null);
  const [showAdErrorModal, setShowAdErrorModal] = useState(false);
  const [lastAdError, setLastAdError] = useState(null);

  // UI State
  const [showRemitente, setShowRemitente] = useState(false);
  const [showDestinatario, setShowDestinatario] = useState(false);
  const [showMegaSale, setShowMegaSale] = useState(false);

  // Notification Modal
  const { modalState, showSuccess, showError, showWarning, showInfo, closeModal } = useNotification();

  // AdMob Integration
  const { 
    isInitialized: adMobInitialized, 
    isRewardedReady, 
    isLoading: adMobLoading, 
    isSupported: adMobSupported,
    showRewardedAd, 
    prepareRewardedAd,
  } = useAdMob();

  // Legacy Ad State for backward compatibility
  const [adState, setAdState] = useState("idle");
  const [retryCount, setRetryCount] = useState(0);
  const [hideAdErrorModal, setHideAdErrorModal] = useState(false);
  const userClosedAdModalRef = useRef(false); // 🚫 Usar REF para cambio instantáneo
  const adTimeoutRef = useRef(null);
  const adErrorModalTimerRef = useRef(null);
  const messagePortRef = useRef(null);
  const MAX_RETRIES = 3;
  
  // 🕐 Estado para timeout de carga de anuncios
  const [adLoadTimeout, setAdLoadTimeout] = useState(false);
  const [adLoadAttempts, setAdLoadAttempts] = useState(0);
  const [adLoadProgress, setAdLoadProgress] = useState(0);
  const adLoadTimeoutRef = useRef(null);
  const adProgressIntervalRef = useRef(null);
  const MAX_AD_LOAD_ATTEMPTS = 1; // 🚀 Solo 1 intento para cargar rápido
  const AD_LOAD_TIMEOUT = 5000; // ⚡ 5 segundos - balanceado entre dar tiempo y no bloquear al usuario

  // 🎯 Monitorear múltiples estados de loading
  useMultipleLoadingMonitor({
    'shipment-creation': isCreatingShipment,
    'admob-loading': adMobLoading,
    'ad-loading': adState === 'loading'
  }, 'Procesando tu solicitud...');
  const DEFAULT_REWARD_AMOUNT = Number(
    ADMOB_CONFIG?.REWARD_SETTINGS?.DISCOUNT_AMOUNT ?? 0
  );

  const formatPrice = useCallback((value) => {
    if (!Number.isFinite(Number(value))) {
      return "";
    }

    try {
      return Number(value).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      });
    } catch (error) {
      console.error("[Resumen] Error formateando precio:", error);
      return `$${Number(value).toLocaleString("es-CO")}`;
    }
  }, []);

  const pickRewardChainLength = useCallback(() => {
    const span = REWARDED_CHAIN_MAX - REWARDED_CHAIN_MIN + 1;
    return REWARDED_CHAIN_MIN + Math.floor(Math.random() * span);
  }, []);

  const resolveRewardAmount = useCallback(
    (rawAmount) => {
      const numeric = Number(rawAmount);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        return DEFAULT_REWARD_AMOUNT;
      }
      return numeric < DEFAULT_REWARD_AMOUNT ? DEFAULT_REWARD_AMOUNT : numeric;
    },
    [DEFAULT_REWARD_AMOUNT]
  );

  const syncCotizacionStores = useCallback((data) => {
    if (!data || typeof data !== "object") {
      return;
    }

    try {
      localStorage.setItem("formCotizador", JSON.stringify(data));
    } catch (error) {
      console.error("[Resumen] Error actualizando formCotizador:", error);
    }

    try {
      const existingRaw = localStorage.getItem("cotizacion");
      if (existingRaw) {
        const existing = JSON.parse(existingRaw);
        const merged = {
          ...existing,
          ...data,
          costoTotal: data.costoTotal,
        };
        localStorage.setItem("cotizacion", JSON.stringify(merged));
      } else {
        localStorage.setItem("cotizacion", JSON.stringify(data));
      }
    } catch (error) {
      console.error("[Resumen] Error sincronizando cotizacion:", error);
      try {
        localStorage.setItem("cotizacion", JSON.stringify(data));
      } catch (persistError) {
        console.error("[Resumen] Error persistiendo cotizacion:", persistError);
      }
    }
  }, []);

  const applyRewardDiscount = useCallback(
    (rawAmount) => {
      const amount = Number(
        rawAmount !== undefined && rawAmount !== null
          ? rawAmount
          : DEFAULT_REWARD_AMOUNT
      );

      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      const read = (key) => {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        } catch (error) {
          console.error(`[Resumen] Error leyendo ${key}:`, error);
          return null;
        }
      };

      let stored = read("formCotizador");
      if (!stored) {
        stored = read("cotizacion");
      }

      if (!stored || typeof stored.costoTotal !== "number") {
        console.warn("[Resumen] No se pudo aplicar descuento: cotizador inválido", stored);
        return;
      }

      const previousTotal = Number(stored.costoTotal);
      const normalizedDiscount = Number.isFinite(amount) ? amount : DEFAULT_REWARD_AMOUNT;
      const nuevoCosto = Math.max(0, previousTotal - normalizedDiscount);
      const updated = {
        ...stored,
        costoTotal: nuevoCosto,
        lastRewardAppliedAt: new Date().toISOString(),
      };

      syncCotizacionStores(updated);
      setCotizador(updated);
      setCostoTotal(nuevoCosto);

      if (Number.isFinite(previousTotal)) {
        setRewardBanner({
          previous: previousTotal,
          current: nuevoCosto,
          discount: Math.max(0, previousTotal - nuevoCosto),
        });
      }
    },
    [DEFAULT_REWARD_AMOUNT, syncCotizacionStores]
  );

  // --- Ad Logic ---

  useEffect(() => {
    router.prefetch?.("/mercadopago");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const storedPreference = window.localStorage.getItem("hideAdErrorModal");
      if (storedPreference === "1") {
        setHideAdErrorModal(true);
      }
    } catch (error) {
      console.warn("[Resumen] No se pudo leer preferencia hideAdErrorModal:", error);
    }
  }, []);

  const clearAdErrorState = useCallback(() => {
    if (adErrorModalTimerRef.current) {
      clearTimeout(adErrorModalTimerRef.current);
      adErrorModalTimerRef.current = null;
    }
    setShowAdErrorModal(false);
    setLastAdError(null);
  }, []);

  const scheduleAdErrorModal = useCallback((errorType, { immediate = false } = {}) => {
    const normalizedError = errorType ?? "unknown_error";

    if (immediate || typeof window === "undefined") {
      clearAdErrorState();
      setLastAdError(normalizedError);
      setShowAdErrorModal(true);
      return;
    }

    if (adErrorModalTimerRef.current) {
      clearTimeout(adErrorModalTimerRef.current);
    }

    setLastAdError(normalizedError);
    setShowAdErrorModal(false);
    adErrorModalTimerRef.current = window.setTimeout(() => {
      setShowAdErrorModal(true);
      adErrorModalTimerRef.current = null;
    }, 180_000);
  }, [clearAdErrorState]);

  const handleAdError = useCallback((errorType, options) => {
    console.error(`❌ Error de anuncio: ${errorType}`);
    setAdState("error");
    if (adTimeoutRef.current) {
      clearTimeout(adTimeoutRef.current);
    }
    const config = (typeof options === "object" && options !== null) ? options : {};
    scheduleAdErrorModal(errorType, config);
  }, [scheduleAdErrorModal]);

  // 🕐 Limpiar timeouts de carga de anuncios
  const clearAdLoadTimeout = useCallback(() => {
    if (adLoadTimeoutRef.current) {
      clearTimeout(adLoadTimeoutRef.current);
      adLoadTimeoutRef.current = null;
    }
    if (adProgressIntervalRef.current) {
      clearInterval(adProgressIntervalRef.current);
      adProgressIntervalRef.current = null;
    }
    setAdLoadProgress(0);
    setAdLoadTimeout(false);
  }, []);

  // � Resetear COMPLETAMENTE el estado de anuncios (función de emergencia)
  const resetAdStateCompletely = useCallback(() => {
    console.log("🔄 Reseteando completamente el estado de anuncios...");
    
    // Limpiar todos los timeouts e intervalos
    clearAdLoadTimeout();
    
    if (adTimeoutRef.current) {
      clearTimeout(adTimeoutRef.current);
      adTimeoutRef.current = null;
    }
    
    if (adErrorModalTimerRef.current) {
      clearTimeout(adErrorModalTimerRef.current);
      adErrorModalTimerRef.current = null;
    }
    
    // Resetear TODOS los estados relacionados con anuncios
    setAdState("idle");
    setAdLoadTimeout(false);
    setAdLoadAttempts(0);
    setAdLoadProgress(0);
    setShowAdErrorModal(false);
    setHideAdErrorModal(false);
    userClosedAdModalRef.current = false; // Resetear el ref de cierre manual
    setLastAdError(null);
    setRewardBanner(null);
    setRewardChainProgress(null);
    setRetryCount(0);
    
    console.log("✅ Estado de anuncios reseteado completamente");
  }, [clearAdLoadTimeout]);

  // �🕐 Iniciar timeout para carga de anuncio
  const startAdLoadTimeout = useCallback(() => {
    clearAdLoadTimeout();
    setAdLoadProgress(0);
    setAdLoadTimeout(false);

    // Barra de progreso visual
    const progressIncrement = 100 / (3000 / 500); // 🚀 Progreso basado en 3s visuales
    adProgressIntervalRef.current = setInterval(() => {
      setAdLoadProgress((prev) => {
        const next = prev + progressIncrement;
        return next >= 100 ? 100 : next;
      });
    }, 500);

    // 🎯 TIMEOUT VISUAL: 3 segundos - cierra el modal pero continúa cargando
    const visualTimeoutRef = setTimeout(() => {
      console.log("⏰ 3 segundos - Cerrando modal de carga (anuncio sigue cargando en background)");
      clearInterval(adProgressIntervalRef.current);
      adProgressIntervalRef.current = null;
      
      // Cerrar el modal visualmente
      userClosedAdModalRef.current = true;
      setAdLoadProgress(0);
    }, 3000); // 3 segundos para el modal

    // ⚡ TIMEOUT REAL: 8 segundos - cancela la carga si aún no terminó
    adLoadTimeoutRef.current = setTimeout(() => {
      console.warn("⏰ 8 segundos - Timeout real alcanzado, cancelando carga de anuncio");
      clearInterval(adProgressIntervalRef.current);
      adProgressIntervalRef.current = null;
      clearTimeout(visualTimeoutRef);
      
      // Marcar como timeout real (sin anuncio disponible)
      setAdLoadTimeout(true);
      setAdLoadAttempts(prev => prev + 1);
      
      // Si ya se agotaron intentos, mostrar Mega Sale como fallback
      if (adLoadAttempts >= MAX_AD_LOAD_ATTEMPTS - 1) {
        console.log("🎯 Intentos agotados - Mostrando Mega Sale sin anuncio");
        setTimeout(() => setShowMegaSale(true), 500);
      }
    }, AD_LOAD_TIMEOUT);
  }, [clearAdLoadTimeout, AD_LOAD_TIMEOUT, adLoadAttempts, MAX_AD_LOAD_ATTEMPTS]);

  const preloadAd = useCallback(() => {
    // No precargar si es envío gratuito
    if (costoTotal === 0) {
      console.log("⏭️ Envío gratuito detectado, no se precarga anuncio");
      return;
    }

    if (adState === "preloading" || adState === "loading" || adState === "watching") {
      return;
    }

    if (adMobSupported) {
      if (AdMobService.wasRewardReady()) {
        clearAdErrorState();
        clearAdLoadTimeout();
        setAdState((prev) => (prev === "ready" ? prev : "ready"));
        return;
      }

      if (isRewardedReady) {
        clearAdErrorState();
        clearAdLoadTimeout();
        setAdState((prev) => (prev === "ready" ? prev : "ready"));
        return;
      }

      console.log("� Precargando anuncio recompensado (AdMob) - Inicio:", new Date().toISOString());
      const startTime = performance.now();
      setAdState("preloading");
      startAdLoadTimeout(); // 🕐 Iniciar timeout
      
      void prepareRewardedAd()
        .then((ready) => {
          const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
          console.log(`✅ Anuncio cargado en ${loadTime}s`);
          clearAdLoadTimeout(); // 🕐 Limpiar timeout si carga exitosamente
          setAdState(ready ? "ready" : "idle");
          if (!ready) {
            handleAdError("prepare_failed");
          } else {
            clearAdErrorState();
            setAdLoadAttempts(0); // Resetear intentos en éxito
          }
        })
        .catch((error) => {
          const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
          console.error(`❌ Error al precargar anuncio después de ${loadTime}s:`, error);
          clearAdLoadTimeout(); // 🕐 Limpiar timeout en error
          handleAdError("prepare_exception");
        });
      return;
    }

    if (window.AndroidInterface?.preloadRewardedAd) {
      console.log("📺 Precargando anuncio recompensado (Android)...");
      setAdState("preloading");
      startAdLoadTimeout(); // 🕐 Iniciar timeout
      try {
        window.AndroidInterface.preloadRewardedAd();
        // Android no retorna promesa, así que limpiamos timeout después de 2s si no hay error
        setTimeout(() => {
          if (adState === "preloading") {
            clearAdLoadTimeout();
          }
        }, 2000);
      } catch (error) {
        clearAdLoadTimeout(); // 🕐 Limpiar timeout en error
        console.error("❌ Error al llamar a preloadRewardedAd:", error);
        handleAdError("preload_exception");
      }
    } else {
      console.log("⚠️ Interfaz de anuncios no disponible.");
      setAdState("idle");
    }
  }, [adState, adMobSupported, isRewardedReady, prepareRewardedAd, handleAdError, clearAdErrorState, costoTotal, startAdLoadTimeout, clearAdLoadTimeout]);

  useEffect(() => {
    if (AdMobService.wasRewardReady()) {
      setAdState((prev) => (prev === "ready" ? prev : "ready"));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (costoTotal === 0 || AdMobService.wasRewardReady()) {
      return;
    }

    // 🚀 Precarga INMEDIATA para máxima velocidad
    const schedulePreload = () => {
      preloadAd();
    };

    // Usar requestAnimationFrame para precarga en el próximo frame (más rápido)
    if (typeof window.requestAnimationFrame === "function") {
      const frameHandle = window.requestAnimationFrame(schedulePreload);
      return () => {
        window.cancelAnimationFrame?.(frameHandle);
      };
    }

    // Fallback: ejecutar inmediatamente
    schedulePreload();
  }, [preloadAd, costoTotal]);

  const showAd = useCallback(async () => {
    console.log("🎯 [showAd] INICIANDO - Estado del sistema:");
    console.log(`   - costoTotal: ${costoTotal}`);
    console.log(`   - adState: "${adState}"`);
    console.log(`   - adMobInitialized: ${adMobInitialized}`);
    console.log(`   - adMobSupported: ${adMobSupported}`);
    console.log(`   - isRewardedReady: ${isRewardedReady}`);
    
    if (costoTotal <= 0) {
      showSuccess('¡Felicidades!', 'Tu envío ya es gratuito. No necesitas ver más anuncios. 🎉');
      return;
    }

    clearAdErrorState();

    console.log("🔍 [showAd] Verificando paths disponibles:");
    console.log(`   - adMobInitialized && adMobSupported: ${adMobInitialized && adMobSupported}`);
    console.log(`   - messagePortRef.current: ${!!messagePortRef.current}`);
    console.log(`   - window.AndroidInterface?.showRewardedAd: ${!!window.AndroidInterface?.showRewardedAd}`);

    // Usar nuevo servicio AdMob si está disponible
    if (adMobInitialized && adMobSupported) {
      console.log("✅ [showAd] Usando AdMob (nueva API)");
      const totalAds = pickRewardChainLength();
      setRewardChainProgress({ current: 0, total: totalAds });
      let successfulAds = 0;
      let chainAborted = false;

      const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      for (let index = 0; index < totalAds; index += 1) {
        // ✅ CRÍTICO: Verificar MÚLTIPLES fuentes para confirmar que el anuncio está listo
        // 1. isRewardedReady (del hook useAdMob)
        // 2. adState === "ready" (del state local)
        // 3. AdMobService.wasRewardReady() (verificación directa del servicio)
        let prepared = Boolean(isRewardedReady) || adState === "ready" || AdMobService.wasRewardReady();
        
        console.log(`📺 [showAd] Anuncio ${index + 1}/${totalAds}`);
        console.log(`   - isRewardedReady: ${isRewardedReady}`);
        console.log(`   - adState: ${adState}`);
        console.log(`   - wasRewardReady: ${AdMobService.wasRewardReady()}`);
        console.log(`   → prepared: ${prepared}`);

        if (!prepared) {
          console.log(`⏳ [showAd] Anuncio NO está listo, preparando desde cero...`);
          setAdState((prev) => (prev === "loading" ? prev : "preloading"));
          try {
            prepared = await prepareRewardedAd();
            console.log(`   → Resultado de prepareRewardedAd: ${prepared}`);
          } catch (error) {
            console.error("❌ Error preparando anuncio recompensado:", error);
            handleAdError("prepare_exception");
            chainAborted = true;
            break;
          }
        } else {
          console.log(`✅ [showAd] Anuncio YA ESTÁ LISTO - Mostrando inmediatamente`);
        }

        if (!prepared) {
          console.error("❌ [showAd] No se pudo preparar el anuncio");
          handleAdError("prepare_failed");
          chainAborted = true;
          break;
        }

        setAdState("loading");
        setRewardChainProgress({ current: index + 1, total: totalAds });
        console.log(`📺 Mostrando anuncio recompensado ${index + 1} de ${totalAds}...`);

        try {
          const result = await showRewardedAd();
          successfulAds += 1;
          const rewardAmount = resolveRewardAmount(result?.reward?.amount);
          applyRewardDiscount(rewardAmount);
          clearAdErrorState();
          setAdState("done");
          
          // ✅ Solo resetear si es el ÚLTIMO anuncio de la cadena
          // finalizeChain() se encargará del reset global al final
          if (index === totalAds - 1) {
            console.log("🔄 Último anuncio visto, finalizeChain se encargará de la precarga");
          }
        } catch (error) {
          console.error("❌ Error mostrando anuncio AdMob:", error);
          handleAdError("show_exception");
          chainAborted = true;
          break;
        }

        if (index < totalAds - 1) {
          setAdState("preloading");
          try {
            const nextReady = await prepareRewardedAd();
            if (!nextReady) {
              handleAdError("prepare_failed");
              chainAborted = true;
              break;
            }
          } catch (error) {
            console.error("❌ Error preparando siguiente anuncio recompensado:", error);
            handleAdError("prepare_exception");
            chainAborted = true;
            break;
          }

          await delay(450);
        }
      }

      const finalizeChain = (delayMs) => {
        setTimeout(() => {
          setRewardChainProgress(null);
          setAdState("idle");
          preloadAd();
        }, delayMs);
      };

      setRewardChainProgress(null);

      if (chainAborted && successfulAds === 0) {
        return;
      } else {
        finalizeChain(2000);
      }

      return;
    }

    if (messagePortRef.current) {
      console.log("📨 Solicitando anuncio mediante MessagePort...");
      setAdState("loading");
      try {
        messagePortRef.current.postMessage("iniciarVideo");
        if (adTimeoutRef.current) {
          clearTimeout(adTimeoutRef.current);
        }
        adTimeoutRef.current = setTimeout(() => {
          if (adState === "loading") {
            handleAdError("message_port_timeout");
          }
        }, 8000);
      } catch (error) {
        console.error("❌ Error al enviar mensaje al puerto del anuncio:", error);
        handleAdError("message_port_exception");
      }
      return;
    }

    if (window.AndroidInterface?.showRewardedAd) {
      if (window.AndroidInterface?.preloadRewardedAd && adState !== "ready") {
        preloadAd();
        showInfo('Preparando anuncio', 'Por favor, espera unos segundos e inténtalo de nuevo. 📱');
        return;
      }

      console.log("📺 Mostrando anuncio recompensado (legacy)...");
      setAdState("loading");
      try {
        window.AndroidInterface.showRewardedAd();
        adTimeoutRef.current = setTimeout(() => {
          if (adState === "loading") {
            handleAdError("show_timeout");
          }
        }, 8000);
      } catch (error) {
        console.error("❌ Error al llamar a showRewardedAd:", error);
        handleAdError("show_exception");
      }
      return;
    }

    if (!adMobSupported) {
      showInfo('Anuncios no disponibles', 'Los anuncios solo están disponibles en la app móvil. 📱\n\n💡 Descarga la app para obtener descuentos increíbles.');
      return;
    }
  }, [adState, costoTotal, adMobInitialized, adMobSupported, isRewardedReady, showRewardedAd, prepareRewardedAd, preloadAd, handleAdError, applyRewardDiscount, resolveRewardAmount, pickRewardChainLength, showInfo, showSuccess, clearAdErrorState]);

  // --- Effects ---

  // Cargar datos iniciales de localStorage
  useEffect(() => {
    const safeRead = (key) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.error(`[Resumen] Error leyendo ${key}:`, error);
        return null;
      }
    };

    const cotizadorData = safeRead("formCotizador");
    const cotizacionData = safeRead("cotizacion");
    const remitenteData = safeRead("formRemitente");
    const destinatarioData = safeRead("formDestinatario");

    let mergedCotizador = null;
    if (cotizadorData && cotizacionData) {
      const costoCandidates = [cotizadorData.costoTotal, cotizacionData.costoTotal]
        .filter((value) => typeof value === "number");

      const selectedCosto =
        costoCandidates.length > 0 ? Math.min(...costoCandidates) : undefined;

      mergedCotizador = {
        ...cotizadorData,
        ...cotizacionData,
        ...(typeof selectedCosto === "number" ? { costoTotal: selectedCosto } : {}),
      };
    } else {
      mergedCotizador = cotizadorData || cotizacionData;
    }

    if (mergedCotizador) {
      setCotizador(mergedCotizador);
      if (typeof mergedCotizador.costoTotal === "number") {
        setCostoTotal(mergedCotizador.costoTotal);
      }
      syncCotizacionStores(mergedCotizador);
    }

    setRemitente(remitenteData);
    setDestinatario(destinatarioData);
  }, [syncCotizacionStores]);

  const processRewardPayload = useCallback((payload) => {
    let data = payload;

    if (payload && typeof payload === "object" && ("data" in payload || "detail" in payload)) {
      data = payload.data ?? payload.detail ?? payload;
    }

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (error) {
        return;
      }
    }

    if (!data || typeof data !== "object") {
      return;
    }

    console.log("📬 Mensaje recibido del anuncio:", data);
    if (adTimeoutRef.current) {
      clearTimeout(adTimeoutRef.current);
    }

    const rawRewardAmount =
      typeof data.rewardAmount === "number"
        ? data.rewardAmount
        : typeof data.amount === "number"
        ? data.amount
        : typeof data.reward?.amount === "number"
        ? data.reward.amount
        : null;

    const rewardStatus =
      typeof data.status === "string"
        ? data.status.toLowerCase()
        : undefined;

    const rewardType = data.type;
    const shouldApplyReward =
      rewardType === "reward" ||
      rewardType === ADMOB_CONFIG?.REWARD_SETTINGS?.REWARD_TYPE ||
      rawRewardAmount !== null ||
      (rewardStatus && ["completed", "rewarded", "fulfilled"].includes(rewardStatus));

    if (
      shouldApplyReward &&
      (rewardStatus === undefined || ["completed", "rewarded", "fulfilled"].includes(rewardStatus))
    ) {
      const amountToApply = resolveRewardAmount(rawRewardAmount);
      clearAdErrorState();
      applyRewardDiscount(amountToApply);
      setAdState("done");
      setTimeout(() => {
        setAdState("idle");
        preloadAd();
      }, 3000);
      return;
    }

    if (rewardType === "adStatus") {
      switch (data.status) {
        case "ready":
          clearAdErrorState();
          setAdState((prev) => (prev === "ready" ? prev : "ready"));
          setRetryCount(0);
          break;
        case "opened":
          clearAdErrorState();
          setAdState("watching");
          break;
        case "closed":
          clearAdErrorState();
          setAdState("idle");
          preloadAd();
          break;
        case "error":
          handleAdError(data.errorType || "unknown_error");
          break;
        default:
          if (typeof data.status === "string" && data.status !== "error") {
            clearAdErrorState();
          }
          setAdState(data.status);
          break;
      }
    }
  }, [applyRewardDiscount, preloadAd, handleAdError, resolveRewardAmount, clearAdErrorState]);

  // Listener para mensajes de la interfaz nativa de Android o bridge webview
  useEffect(() => {
    const handleRewardedAdMessage = (event) => {
      if (event?.ports && event.ports.length > 0) {
        const [port] = event.ports;
        if (port && messagePortRef.current !== port) {
          messagePortRef.current = port;
          setAdState((prev) => (prev === "ready" ? prev : "ready"));
          clearAdErrorState();
          try {
            port.postMessage("bridge:connected");
          } catch (error) {
            console.error("❌ Error al enviar handshake al MessagePort:", error);
          }
          port.onmessage = (messageEvent) => {
            processRewardPayload(messageEvent?.data ?? messageEvent);
          };
        }
        return;
      }

      processRewardPayload(event);
    };

    window.addEventListener("message", handleRewardedAdMessage);
    window.addEventListener("adReward", handleRewardedAdMessage);
    return () => {
      window.removeEventListener("message", handleRewardedAdMessage);
      window.removeEventListener("adReward", handleRewardedAdMessage);
      const port = messagePortRef.current;
      if (port) {
        try {
          port.onmessage = null;
          port.postMessage?.("bridge:disconnect");
          port.close?.();
        } catch (error) {
          console.warn("⚠️ No se pudo cerrar el MessagePort correctamente:", error);
        }
        messagePortRef.current = null;
      }
      // 🕐 Limpiar timeouts al desmontar
      clearAdLoadTimeout();
    };
  }, [processRewardPayload, clearAdErrorState, clearAdLoadTimeout]);

  // Precarga inicial - SIMPLIFICADA para evitar llamadas múltiples
  useEffect(() => {
    // Solo precargar si:
    // 1. Tenemos todos los datos necesarios
    // 2. No es envío gratuito
    // 3. AdMob está listo O hay datos de cotización
    if (cotizador && remitente && destinatario && costoTotal > 0) {
      // Verificar si el anuncio ya está precargado desde Home
      if (AdMobService.wasRewardReady()) {
        console.log("✅ Anuncio precargado desde Home - No recargar");
        setAdState((prev) => (prev === "ready" ? prev : "ready"));
        return;
      }
      
      // Si AdMob está listo, precargar inmediatamente
      if (adMobSupported && adMobInitialized) {
        console.log("🚀 [Resumen] AdMob listo - Precargando anuncio...");
        preloadAd();
      } else {
        // Si no, esperar un poco y intentar (solo si no está precargado)
        console.log("⏳ [Resumen] Esperando AdMob...");
        const timer = setTimeout(() => {
          if (!AdMobService.wasRewardReady()) {
            preloadAd();
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [cotizador, remitente, destinatario, costoTotal, adMobSupported, adMobInitialized, preloadAd]);

  // Lógica de reintento SOLO para errores críticos
  useEffect(() => {
    if (adState === "error" && retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`🔄 Reintentando precarga en ${delay / 1000}s (intento ${retryCount + 1}/${MAX_RETRIES})...`);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        preloadAd();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [adState, retryCount, preloadAd]);

  useEffect(() => {
    // ✅ SOLO mostrar Mega Sale cuando el anuncio esté REALMENTE listo
    if (costoTotal > 0 && adState === "ready") {
      const timer = setTimeout(() => {
        console.log("✅ Anuncio 100% listo - Mostrando Mega Sale");
        console.log(`   → adState: "${adState}"`);
        console.log(`   → isRewardedReady: ${isRewardedReady}`);
        console.log(`   → wasRewardReady: ${AdMobService.wasRewardReady()}`);
        setShowMegaSale(true);
        // Resetear el flag de cierre de modal
        userClosedAdModalRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [adState, costoTotal, isRewardedReady]);

  // Limpieza de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (adTimeoutRef.current) {
        clearTimeout(adTimeoutRef.current);
      }
      if (adErrorModalTimerRef.current) {
        clearTimeout(adErrorModalTimerRef.current);
        adErrorModalTimerRef.current = null;
      }
    };
  }, []);

  // --- Handlers ---

  const handlePagar = async () => {
    console.log("💳 [handlePagar] Usuario hizo click en 'Pagar'");
    setShowMegaSale(false);
    
    // Validar que tenemos todos los datos necesarios ANTES de redirigir
    if (!remitente || !destinatario || !cotizador) {
      console.error("❌ [handlePagar] Faltan datos para el pago");
      showWarning('Datos Incompletos', 'Faltan datos del envío. Por favor, regresa y completa toda la información requerida.');
      return;
    }
    
    // Guardar TODOS los datos en localStorage antes de redirigir
    if (cotizador) {
      console.log("💾 [handlePagar] Guardando datos de cotización...");
      syncCotizacionStores({
        ...cotizador,
        costoTotal,
      });
    }
    
    // Guardar remitente y destinatario también
    try {
      console.log("💾 [handlePagar] Guardando remitente y destinatario...");
      localStorage.setItem("remitente", JSON.stringify(remitente));
      localStorage.setItem("destinatario", JSON.stringify(destinatario));
    } catch (error) {
      console.error("❌ [handlePagar] Error guardando datos:", error);
    }
    
    if (costoTotal === 0) {
      console.log("🆓 [handlePagar] Envío gratuito - Creando envío...");
      await handleFreeShipment();
    } else {
      console.log("💳 [handlePagar] Redirigiendo a MercadoPago...");
      router.push("/mercadopago");
    }
  };

  const handleFreeShipment = useCallback(async () => {
    if (!session?.user?.email) {
      showError('Error de Sesión', 'No se detectó una sesión activa. Por favor, inicia sesión para continuar.');
      return;
    }
    if (costoTotal > 0) {
      return;
    }

    // Validar que tenemos todos los datos necesarios
    if (!remitente || !destinatario || !cotizador) {
      showWarning('Datos Incompletos', 'Faltan datos del envío. Por favor, regresa y completa toda la información requerida.');
      return;
    }

    setIsCreatingShipment(true);
    const numeroGuia = generarNumeroGuia();

    // Obtener nombres de ciudades
    const ciudadOrigenNombre = ciudades["11001"] || "Bogotá D.C.";
    const ciudadDestinoNombre = ciudades[cotizador.ciudadDestino] || cotizador.ciudadDestino || "Destino";

    // Preparar los datos según el schema esperado por /api/orders
    const envioData = {
      NumeroGuia: numeroGuia,
      Estado: "RECOLECCION_PENDIENTE",
      Origen: ciudadOrigenNombre,
      Destino: ciudadDestinoNombre,
      Destinatario: {
        Nombre: destinatario.nombre || "Sin nombre",
        Direccion: destinatario.direccionEntrega || "Sin dirección",
        Telefono: destinatario.telefono || destinatario.celular || "0000000000",
      },
      Remitente: {
        Nombre: remitente.nombre || "Sin nombre",
        Direccion: remitente.direccionRecogida || "Sin dirección",
        Telefono: remitente.telefono || remitente.celular || "0000000000",
      },
      Peso: parseFloat(cotizador.peso) || 1,
      Dimensiones: `${cotizador.largo || 0}x${cotizador.ancho || 0}x${cotizador.alto || 0}`,
      ValorDeclarado: parseFloat(cotizador.valorDeclarado) || 0,
      // FechaCreacion y FechaActualizacion se manejan automáticamente en el backend
      // Campos adicionales para tracking
      usuarioEmail: session.user.email,
      metodoPago: "GRATUITO",
      pagado: true,
      pagoId: `FREE-${Date.now()}`,
      montoTotal: 0,
    };

    console.log("📦 Creando envío gratuito:", envioData);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envioData),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log("✅ Envío gratuito creado exitosamente:", responseData);
        console.log("📦 Detalles del envío:", {
          id: responseData.id,
          NumeroGuia: responseData.NumeroGuia,
          usuarioId: responseData.usuarioId,
          Estado: responseData.Estado,
        });
        
        // Guardar información del envío en localStorage
        localStorage.setItem("envioDatos", JSON.stringify({
          ...responseData,
          numeroGuia,
          tipo: "gratuito",
          metodoPago: "GRATUITO",
        }));
        localStorage.setItem("envioExitoso", "true");
        localStorage.setItem("ultimoEnvioId", responseData.id?.toString() || "");
        
        // Limpiar datos del formulario
        localStorage.removeItem("formCotizador");
        localStorage.removeItem("cotizacion");
        localStorage.removeItem("formRemitente");
        localStorage.removeItem("formDestinatario");
        
        showSuccess('¡Envío Registrado! 🎉', 'Tu envío gratuito ha sido registrado exitosamente. Serás redirigido a Mis Envíos.');
        
        // Esperar un poco más para asegurar que la DB se actualice
        setTimeout(() => {
          console.log("🔄 Redirigiendo a Mis Envíos...");
          router.push("/misenvios");
        }, 2500);
      } else {
        console.error("❌ Error del servidor:", responseData);
        const errorMsg = responseData.message || responseData.error || "Error desconocido";
        
        if (responseData.errors) {
          const errors = Object.entries(responseData.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
            .join("\n");
          showError('Error de Validación', 'No se pudo registrar el envío. Revisa los siguientes errores:', errors);
        } else {
          showError('Error al Registrar', `No se pudo registrar el envío: ${errorMsg}`);
        }
      }
    } catch (error) {
      console.error("❌ Error al registrar el envío gratuito:", error);
      showError('Error de Conexión', 'Hubo un problema de conexión al registrar tu envío. Por favor, verifica tu internet e intenta nuevamente.');
    } finally {
      setIsCreatingShipment(false);
    }
  }, [router, costoTotal, session, remitente, destinatario, cotizador, showSuccess, showError, showWarning]);

  const handleWatchAdFromModal = useCallback(() => {
    console.log("🎬 [handleWatchAdFromModal] Usuario hizo click en 'Ver anuncio'");
    console.log(`   - Estado actual: adState="${adState}"`);
    console.log(`   - isRewardedReady: ${isRewardedReady}`);
    console.log(`   - wasRewardReady: ${AdMobService.wasRewardReady()}`);
    
    setShowMegaSale(false);
    
    // ⚡ FORZAR LLAMADA DIRECTA - Si MegaSale apareció, el anuncio DEBE estar listo
    // No hacer más verificaciones, simplemente intentar mostrar
    setTimeout(() => {
      console.log("🚀 [handleWatchAdFromModal] FORZANDO llamada a showAd()...");
      console.log("   → Sin verificaciones previas, confiando en que está listo");
      showAd();
    }, 300);
  }, [showAd, adState, isRewardedReady]);

  useEffect(() => {
    if (!rewardBanner) {
      return undefined;
    }

    const timeoutId = setTimeout(() => setRewardBanner(null), 8000);
    return () => clearTimeout(timeoutId);
  }, [rewardBanner]);

  // Detectar cambios en localStorage cuando el usuario regresa después de editar
  useEffect(() => {
    const handleStorageChange = () => {
      console.log("🔄 Detectado cambio en localStorage, actualizando datos...");
      
      const safeRead = (key) => {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        } catch (error) {
          console.error(`[Resumen] Error leyendo ${key}:`, error);
          return null;
        }
      };

      // Actualizar cotizador y precio
      const cotizadorData = safeRead("formCotizador");
      const cotizacionData = safeRead("cotizacion");
      
      if (cotizadorData || cotizacionData) {
        let mergedCotizador = null;
        if (cotizadorData && cotizacionData) {
          const costoCandidates = [cotizadorData.costoTotal, cotizacionData.costoTotal]
            .filter((value) => typeof value === "number");

          const selectedCosto =
            costoCandidates.length > 0 ? Math.min(...costoCandidates) : undefined;

          mergedCotizador = {
            ...cotizadorData,
            ...cotizacionData,
            ...(typeof selectedCosto === "number" ? { costoTotal: selectedCosto } : {}),
          };
        } else {
          mergedCotizador = cotizadorData || cotizacionData;
        }

        if (mergedCotizador) {
          setCotizador(mergedCotizador);
          if (typeof mergedCotizador.costoTotal === "number") {
            setCostoTotal(mergedCotizador.costoTotal);
            console.log("✅ Precio actualizado a:", mergedCotizador.costoTotal);
          }
          syncCotizacionStores(mergedCotizador);
        }
      }

      // Actualizar remitente
      const remitenteData = safeRead("formRemitente");
      if (remitenteData) {
        setRemitente(remitenteData);
        console.log("✅ Datos de remitente actualizados");
      }

      // Actualizar destinatario
      const destinatarioData = safeRead("formDestinatario");
      if (destinatarioData) {
        setDestinatario(destinatarioData);
        console.log("✅ Datos de destinatario actualizados");
      }
    };

    // Escuchar evento storage (para cambios desde otras pestañas)
    window.addEventListener("storage", handleStorageChange);

    // Escuchar cuando la página se vuelve visible (usuario regresa a la pestaña)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("👁️ Página visible nuevamente, verificando cambios...");
        handleStorageChange();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Escuchar evento focus (cuando el usuario hace click en la ventana)
    window.addEventListener("focus", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [syncCotizacionStores]);

  // --- Render Logic ---

  if (!cotizador || !remitente || !destinatario) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Información incompleta</h3>
          <p className="text-slate-600">Por favor completa todos los formularios para ver el resumen de tu envío.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3dfde] via-[#f8fafc] to-[#41e0b3]/10 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <h1 className="text-3xl font-extrabold text-[#18191A] mb-2 drop-shadow">Resumen del envío</h1>
          <p className="text-[#41e0b3] font-medium">Revisa los detalles antes de proceder al pago</p>
          
          {/* Botón de actualización manual */}
          <button
            onClick={() => {
              console.log("🔄 Actualizando datos manualmente...");
              window.dispatchEvent(new Event('storage'));
              showInfo('Datos actualizados', 'Se han recargado todos los datos desde el formulario.');
            }}
            className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#41e0b3] text-[#18191A] rounded-xl hover:bg-[#41e0b3] hover:text-white transition-all duration-200 shadow-sm hover:shadow-lg"
            title="Actualizar datos del formulario"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline font-semibold">Actualizar</span>
          </button>
        </div>

        {rewardBanner && (
          <div className="mb-10 rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-white to-amber-100 p-6 text-center shadow-xl">
            <p className="text-3xl font-extrabold uppercase tracking-wide text-amber-600 drop-shadow-sm">
              ¡Felicidades!
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-700">
              Tu precio anterior:
              <span className="ml-2 text-2xl font-black text-amber-700">
                {formatPrice(rewardBanner.previous)}
              </span>
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-600">
              Precio con descuento:
              <span className="ml-2 text-2xl font-black text-emerald-700">
                {formatPrice(rewardBanner.current)}
              </span>
            </p>
            {Number.isFinite(Number(rewardBanner?.discount)) && Number(rewardBanner.discount) > 0 && (
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-emerald-500">
                Ahorro total:
                <span className="ml-2 text-emerald-600">
                  {formatPrice(rewardBanner.discount)}
                </span>
              </p>
            )}
          </div>
        )}

        {rewardChainProgress && (
          <div className="mb-10 rounded-3xl border border-blue-200 bg-blue-50/80 p-4 text-center shadow">
            <p className="text-lg font-semibold text-blue-600">
              Anuncio {Math.max(1, rewardChainProgress.current ?? 0)} de {rewardChainProgress.total}
            </p>
            <p className="text-sm text-blue-500">
              Mantente mirando para obtener el máximo descuento posible.
            </p>
          </div>
        )}

        {/* Ruta del envío */}
        <div className="bg-[#18191A]/90 rounded-3xl shadow-xl border-2 border-[#41e0b3]/30 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="w-4 h-4 bg-[#41e0b3] rounded-full mb-2 animate-pulse"></div>
                <p className="text-sm font-bold text-white">Bogotá</p>
                <p className="text-xs text-[#41e0b3]">Origen</p>
              </div>
              <div className="flex-1 h-px bg-[#41e0b3]/30 mx-4"></div>
              <div className="text-center">
                <div className="w-4 h-4 bg-[#41e0b3] rounded-full mb-2 animate-pulse"></div>
                <p className="text-sm font-bold text-white">
                  {ciudades[cotizador.ciudadDestino] || cotizador.ciudadDestino}
                </p>
                <p className="text-xs text-[#41e0b3]">Destino</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#41e0b3] drop-shadow">
                {costoTotal === 0 ? "¡GRATIS!" : `$${Number(costoTotal || 0).toLocaleString("es-CO")}`}
              </p>
              <p className="text-sm text-white">Costo total</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Datos de contacto */}
          <div className="lg:col-span-2 space-y-6">
            {/* Remitente */}
            <div className="bg-[#23272b]/90 rounded-2xl shadow-lg border border-[#41e0b3]/20 p-6 mb-2 transition-all duration-300">
              <button
                onClick={() => setShowRemitente((v) => !v)}
                className="flex items-center w-full justify-between text-left text-[#41e0b3] font-bold text-lg focus:outline-none transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="#41e0b3" strokeWidth="2" fill="none" />
                    <path d="M12 8v4l2 2" stroke="#41e0b3" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Remitente
                </span>
                <svg
                  className={`w-5 h-5 transform transition-transform duration-300 ${showRemitente ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="#41e0b3"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ${showRemitente ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
              >
                <div className="space-y-3 text-sm text-white">
                  <div>
                    <p className="font-semibold">{remitente.nombre}</p>
                    <p className="text-[#41e0b3]">{remitente.tipoDocumento} {remitente.numeroDocumento}</p>
                  </div>
                  <div>
                    <p>{remitente.celular}</p>
                    <p>{remitente.correo}</p>
                  </div>
                  <div>
                    <p>{remitente.direccionRecogida}</p>
                    {remitente.detalleDireccion && (
                      <p className="text-xs text-[#41e0b3] mt-1">{remitente.detalleDireccion}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Destinatario */}
            <div className="bg-[#23272b]/90 rounded-2xl shadow-lg border border-[#41e0b3]/20 p-6 mb-2 transition-all duration-300">
              <button
                onClick={() => setShowDestinatario((v) => !v)}
                className="flex items-center w-full justify-between text-left text-[#41e0b3] font-bold text-lg focus:outline-none transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="#41e0b3" strokeWidth="2" fill="none" />
                    <path d="M12 8v4l2 2" stroke="#41e0b3" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Destinatario
                </span>
                <svg
                  className={`w-5 h-5 transform transition-transform duration-300 ${showDestinatario ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="#41e0b3"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ${showDestinatario ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
              >
                <div className="space-y-3 text-sm text-white">
                  <div>
                    <p className="font-semibold">{destinatario.nombre}</p>
                    <p className="text-[#41e0b3]">{destinatario.tipoDocumento} {destinatario.numeroDocumento}</p>
                  </div>
                  <div>
                    <p>{destinatario.celular}</p>
                    <p>{destinatario.correo}</p>
                  </div>
                  <div>
                    <p>{destinatario.direccionEntrega}</p>
                    {destinatario.detalleDireccion && (
                      <p className="text-xs text-[#41e0b3] mt-1">{destinatario.detalleDireccion}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles del paquete */}
            <div className="bg-[#18191A]/90 rounded-2xl shadow-lg border border-[#41e0b3]/20 p-6">
              <h3 className="font-bold text-[#41e0b3] mb-6">Detalles del paquete</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-[#41e0b3]/10">
                    <span className="text-[#41e0b3]">Peso</span>
                    <span className="font-semibold text-white">{cotizador.peso} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#41e0b3]/10">
                    <span className="text-[#41e0b3]">Valor declarado</span>
                    <span className="font-semibold text-white">
                      ${Number(cotizador.valorDeclarado).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#41e0b3]">Contenido</span>
                    <span className="font-semibold text-white text-right max-w-32 truncate">
                      {cotizador.recomendaciones}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-[#41e0b3]/10">
                    <span className="text-[#41e0b3]">Largo</span>
                    <span className="font-semibold text-white">{cotizador.largo} cm</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#41e0b3]/10">
                    <span className="text-[#41e0b3]">Ancho</span>
                    <span className="font-semibold text-white">{cotizador.ancho} cm</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#41e0b3]">Alto</span>
                    <span className="font-semibold text-white">{cotizador.alto} cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Resumen y acciones */}
          <div className="space-y-6">
            <div className="bg-[#18191A]/95 rounded-3xl shadow-2xl border-2 border-[#41e0b3]/30 p-6 sticky top-8 animate-fade-in-up">
              <h3 className="font-bold text-[#41e0b3] mb-6">Resumen</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#41e0b3]">Tipo de envío</span>
                  <span className="text-white">{cotizador.tipoEnvio || "Paquetes"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#41e0b3]">Fecha</span>
                  <span className="text-white">{fecha}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#41e0b3]">Modalidad</span>
                  <span className="text-white">Recogida en ubicación</span>
                </div>
                {session?.user?.email && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#41e0b3]">Usuario</span>
                    <span className="text-white text-xs truncate max-w-32">{session.user.email}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-[#41e0b3]/20 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[#41e0b3]">Total</span>
                  <span className="text-2xl font-extrabold text-white drop-shadow">
                    {costoTotal === 0 ? "¡GRATIS!" : `$${Number(costoTotal || 0).toLocaleString("es-CO")}`}
                  </span>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="space-y-3">
                <button
                  onClick={handlePagar}
                  disabled={isCreatingShipment || !session?.user?.email}
                  className={`w-full font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 ${
                    costoTotal === 0 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" 
                      : "bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] hover:from-[#2bbd8c] hover:to-[#41e0b3] text-white"
                  } ${(isCreatingShipment || !session?.user?.email) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isCreatingShipment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </>
                  ) : !session?.user?.email ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Inicia sesión para continuar</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{costoTotal === 0 ? "Confirmar Envío Gratis" : "Proceder al pago"}</span>
                    </>
                  )}
                </button>
                
                {costoTotal > 0 && (
                  <button
                    onClick={showAd}
                    disabled={adMobLoading || adState === "loading" || adState === "watching" || adState === "done" || (!adMobInitialized && !isRewardedReady)}
                    className={`w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow transition-all duration-300 flex items-center justify-center gap-2 ${
                      (adMobLoading || adState === "loading" || adState === "watching" || adState === "done" || (!adMobInitialized && !isRewardedReady)) ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {(adState === "watching") ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Viendo anuncio...</span>
                      </>
                    ) : (adMobLoading || adState === "loading" || adState === "preloading" || adState === "done") ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Cargando anuncio...</span>
                      </>
                    ) : !adMobInitialized ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span>Anuncios no disponibles</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15 10l4.55-2.27A1 1 0 0121 8.66v6.68a1 1 0 01-1.45.89L15 14M5 8h8a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2z" />
                        </svg>
                        <span>Ver anuncio para descuento</span>
                      </>
                    )}
                  </button>
                )}
                {hideAdErrorModal && (
                  <div className="mt-3 text-center text-xs text-gray-500">
                    <span className="block">Has ocultado los avisos de error de anuncios.</span>
                    <button
                      type="button"
                      className="mt-1 font-semibold text-[#41e0b3] hover:text-[#2bbd8c] underline"
                      onClick={() => {
                        setHideAdErrorModal(false);
                        try {
                          localStorage.removeItem("hideAdErrorModal");
                        } catch (error) {
                          console.warn("[Resumen] No se pudo restablecer la preferencia hideAdErrorModal:", error);
                        }
                      }}
                    >
                      Volver a mostrarlos
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navegación entre pantallas */}
        <div className="flex justify-center w-full mt-8 pb-24">
          <button
            type="button"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-8 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={() => router.push("/destinatario")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>
        </div>

        {/* MODALES Y FEEDBACK VISUAL */}
        <MegaSaleModal
          open={showMegaSale}
          onClose={() => setShowMegaSale(false)}
          onPay={handlePagar}
          onWatchAd={handleWatchAdFromModal}
        />

        {/* Indicador de carga de anuncios con timeout */}
        <AdLoadingIndicator
          isLoading={!userClosedAdModalRef.current && costoTotal > 0 && (adState === "loading" || adState === "preloading" || (adState === "error" && !showAdErrorModal && !hideAdErrorModal))}
          hasTimeout={adLoadTimeout}
          progress={adLoadProgress}
          currentAttempt={adLoadAttempts}
          maxAttempts={MAX_AD_LOAD_ATTEMPTS}
          onContinueWithoutAd={() => {
            console.log("🚫 Usuario cerró modal de anuncio - marcando ref como cerrado");
            userClosedAdModalRef.current = true; // 🚫 Marcar ref como cerrado (instantáneo)
            // Forzar re-render para actualizar el modal
            setAdLoadProgress(prev => prev);
          }}
          onRetry={() => {
            console.log("🔄 Usuario solicitó reintentar anuncio");
            resetAdStateCompletely();
            setTimeout(() => {
              preloadAd();
            }, 500);
          }}
        />
        
        {adState === "done" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-xl p-8 shadow text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="block mb-2 text-lg font-bold text-green-600">¡Descuento aplicado!</span>
              <p className="text-sm text-gray-600">Tu nuevo costo se ha actualizado.</p>
            </div>
          </div>
        )}
        
        {showAdErrorModal && !hideAdErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="relative bg-white rounded-xl p-8 shadow text-center">
              <button
                type="button"
                aria-label="Cerrar"
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  clearAdErrorState();
                  setAdState("idle");
                  setRetryCount(0);
                  // Precargar anuncio después de cerrar modal de error
                  setTimeout(() => preloadAd(), 500);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="block mb-4 text-lg font-bold text-red-500">Error al cargar el anuncio</span>
              <p className="text-sm text-gray-600">No se pudo mostrar el anuncio. Inténtalo de nuevo.</p>
              {lastAdError && (
                <p className="text-xs text-gray-400 mt-2">Código de error: {lastAdError}</p>
              )}
              <div className="flex flex-col gap-3 mt-5 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  className="bg-[#41e0b3] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#2bbd8c] transition-colors"
                  onClick={() => {
                    clearAdErrorState();
                    setAdState("idle");
                    setRetryCount(0);
                    preloadAd();
                  }}
                >
                  Reintentar
                </button>
                <button
                  type="button"
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    clearAdErrorState();
                    setAdState("idle");
                    setRetryCount(0);
                    // Precargar anuncio después de cerrar modal de error
                    setTimeout(() => preloadAd(), 500);
                  }}
                >
                  Cerrar
                </button>
              </div>
              <button
                type="button"
                className="mt-4 text-sm text-gray-500 underline hover:text-gray-700"
                onClick={() => {
                  setHideAdErrorModal(true);
                  setAdState("idle");
                  setRetryCount(0);
                  clearAdErrorState();
                  try {
                    localStorage.setItem("hideAdErrorModal", "1");
                  } catch (error) {
                    console.warn("[Resumen] No se pudo guardar la preferencia hideAdErrorModal:", error);
                  }
                  // Precargar anuncio después de ocultar errores
                  setTimeout(() => preloadAd(), 500);
                }}
              >
                No volver a mostrar este aviso
              </button>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          details={modalState.details}
        />
      </div>
      <BottomNav />
    </div>
  );
}