"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import {
  getLastActivity,
  setLastActivity,
  clearLastActivity,
  clearHomeSticky,
  INACTIVITY_MIN_MS,
  INACTIVITY_MAX_MS,
} from "../utils/homeStickyStorage";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "wheel",
  "scroll",
];
const THROTTLE_MS = 30 * 1000; // solo guardar cada 30s por actividad continua

export default function InactivityGuard() {
  const { status, data } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const throttledWriteRef = useRef(0);

  // Evaluar inactividad al cargar la vista / cambiar ruta
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (status === "loading") {
      return;
    }

    if (status !== "authenticated" || !data?.user) {
      clearLastActivity();
      return;
    }

    const now = Date.now();
    const userId = data.user.email ?? data.user.id ?? null;
    const { timestamp, userId: storedUser, path } = getLastActivity();

    if (storedUser && userId && storedUser !== userId) {
      setLastActivity(userId, now, pathname);
      return;
    }

    if (!timestamp) {
      setLastActivity(userId, now, pathname);
      return;
    }

    const inactivity = now - timestamp;

    if (inactivity > INACTIVITY_MAX_MS) {
      clearLastActivity();
      clearHomeSticky();
      void signOut({ redirect: false });
      router.replace("/login?session=expired");
      return;
    }

    if (inactivity >= INACTIVITY_MIN_MS) {
      setLastActivity(userId, now, "/home");
      if (pathname !== "/home") {
        router.replace("/home?resume=1");
      }
      return;
    }

    setLastActivity(userId, now, pathname === "/" ? path ?? "/home" : pathname);
  }, [status, data, pathname, router]);

  // Registrar actividad del usuario para mantener la sesión "viva"
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (status !== "authenticated" || !data?.user) {
      return undefined;
    }

    const userId = data.user.email ?? data.user.id ?? null;

    const handleActivity = () => {
      const now = Date.now();
      if (now - throttledWriteRef.current < THROTTLE_MS) {
        return;
      }
      throttledWriteRef.current = now;
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      setLastActivity(userId, now, currentPath);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", handleVisibility);

    handleActivity();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [status, data]);

  return null;
}
