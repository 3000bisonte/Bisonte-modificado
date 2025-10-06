const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOME_STICKY_DURATION_DAYS = 30;
export const HOME_STICKY_DURATION_MS = HOME_STICKY_DURATION_DAYS * DAY_IN_MS;
export const INACTIVITY_MIN_MS = DAY_IN_MS;
export const INACTIVITY_MAX_MS = HOME_STICKY_DURATION_DAYS * DAY_IN_MS;

const STORAGE_KEYS = {
  until: "homeStickyUntil",
  user: "homeStickyUser",
  updatedAt: "homeStickyLastVisit",
};

const ACTIVITY_KEYS = {
  timestamp: "sessionLastActivityAt",
  user: "sessionLastActivityUser",
  path: "sessionLastActivityPath",
};

export function getHomeSticky() {
  if (typeof window === "undefined") {
    return { until: 0, userId: null, updatedAt: 0 };
  }

  const untilRaw = localStorage.getItem(STORAGE_KEYS.until);
  const userId = localStorage.getItem(STORAGE_KEYS.user);
  const updatedRaw = localStorage.getItem(STORAGE_KEYS.updatedAt);

  const until = Number(untilRaw || "0");
  const updatedAt = Number(updatedRaw || "0");

  return {
    until: Number.isFinite(until) ? until : 0,
    userId: userId || null,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
  };
}

export function extendHomeSticky(userId = null, now = Date.now()) {
  if (typeof window === "undefined") {
    return null;
  }

  const expiresAt = now + HOME_STICKY_DURATION_MS;

  if (userId) {
    localStorage.setItem(STORAGE_KEYS.user, userId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.user);
  }

  localStorage.setItem(STORAGE_KEYS.until, String(expiresAt));
  localStorage.setItem(STORAGE_KEYS.updatedAt, String(now));

  return expiresAt;
}

export function clearHomeSticky() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.until);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.updatedAt);
}

export function isHomeStickyValid(userId = null, now = Date.now()) {
  const { until, userId: storedUserId } = getHomeSticky();

  if (!until || until <= now) {
    return false;
  }

  if (storedUserId && userId && storedUserId !== userId) {
    return false;
  }

  return true;
}

export { STORAGE_KEYS as HOME_STICKY_STORAGE_KEYS, HOME_STICKY_DURATION_DAYS };

export function getLastActivity() {
  if (typeof window === "undefined") {
    return { timestamp: 0, userId: null, path: null };
  }

  const timestampRaw = localStorage.getItem(ACTIVITY_KEYS.timestamp);
  const userId = localStorage.getItem(ACTIVITY_KEYS.user);
  const path = localStorage.getItem(ACTIVITY_KEYS.path);

  const timestamp = Number(timestampRaw || "0");

  return {
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    userId: userId || null,
    path: path || null,
  };
}

export function setLastActivity(userId = null, timestamp = Date.now(), path = null) {
  if (typeof window === "undefined") {
    return timestamp;
  }

  if (userId) {
    localStorage.setItem(ACTIVITY_KEYS.user, userId);
  } else {
    localStorage.removeItem(ACTIVITY_KEYS.user);
  }

  localStorage.setItem(ACTIVITY_KEYS.timestamp, String(timestamp));

  if (path) {
    localStorage.setItem(ACTIVITY_KEYS.path, path);
  }

  return timestamp;
}

export function clearLastActivity() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACTIVITY_KEYS.timestamp);
  localStorage.removeItem(ACTIVITY_KEYS.user);
  localStorage.removeItem(ACTIVITY_KEYS.path);
}

export { ACTIVITY_KEYS as SESSION_ACTIVITY_KEYS, DAY_IN_MS };
