const DEFAULT_API_BASE = "https://api.sadady.com";

const STORAGE_KEYS = {
  session: "sadady.theme.session",
  pendingJourney: "sadady.theme.pendingJourney",
  currentJourney: "sadady.theme.currentJourney",
};

const SESSION_SYNC_ATTEMPTS = 20;
const SESSION_SYNC_DELAY_MS = 500;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function removeValue(key) {
  localStorage.removeItem(key);
}

function stringValue(value) {
  return String(value || "").trim();
}

function normalizeMobile(value) {
  return stringValue(value).replace(/\s+/g, "");
}

function generateId(prefix) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}_${Date.now().toString(36).toUpperCase()}${random}`;
}

function getApiBase() {
  return window.SADADY_API_BASE || window.sadadyThemeConfig?.api_base_url || DEFAULT_API_BASE;
}

function getSallaSdk() {
  return typeof window !== "undefined" ? window.salla || null : null;
}

function readSallaConfig(key) {
  const sdk = getSallaSdk();
  try {
    return typeof sdk?.config?.get === "function" ? sdk.config.get(key) : null;
  } catch {
    return null;
  }
}

function readSallaStorage(key) {
  const sdk = getSallaSdk();
  try {
    if (typeof sdk?.storage?.get === "function") return sdk.storage.get(key);
    if (typeof sdk?.store?.get === "function") return sdk.store.get(key);
  } catch {
    return null;
  }
  return null;
}

function extractTokenValue(rawToken) {
  if (!rawToken) return "";
  if (typeof rawToken === "string") return stringValue(rawToken);
  if (typeof rawToken !== "object") return "";

  return stringValue(
    rawToken.access_token ||
    rawToken.accessToken ||
    rawToken.token ||
    rawToken.value,
  );
}

function getSallaSdkSessionCandidate() {
  const user = readSallaConfig("user");
  const rawToken = readSallaStorage("token") || readSallaConfig("token");
  const sessionToken = extractTokenValue(rawToken);

  if (!user && !sessionToken) return null;

  return sanitizeSession({
    customer_id: user?.id,
    customer_name: user?.name || `${stringValue(user?.first_name)} ${stringValue(user?.last_name)}`.trim(),
    mobile: user?.mobile || user?.phone,
    email: user?.email,
    session_token: sessionToken,
    source: "salla-sdk",
  });
}

function sanitizeSession(value) {
  if (!value || typeof value !== "object") return null;

  const customerId = stringValue(value.customer_id || value.customerId || value.id);
  const rawCustomerName = stringValue(value.customer_name || value.customerName || value.name);
  const mobile = normalizeMobile(value.mobile || value.phone);
  const email = stringValue(value.email);
  const sessionToken = stringValue(value.session_token || value.sessionToken || value.token);
  const source = stringValue(value.source) || "salla";
  const createdAt = stringValue(value.created_at || value.createdAt) || new Date().toISOString();

  if (!customerId && !rawCustomerName && !mobile && !email && !sessionToken) {
    return null;
  }

  const customerName = rawCustomerName || "عميل سدادي";

  return {
    customer_id: customerId,
    customer_name: customerName,
    name: customerName,
    mobile,
    email,
    session_token: sessionToken,
    created_at: createdAt,
    source,
  };
}

function dispatchSessionEvent(name, session) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail: session || null }));
}

function buildHeaders(extraHeaders = {}, options = {}) {
  const hasJsonBody = options.hasBody && !options.isFormData;
  return {
    Accept: "application/json",
    ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
    ...(extraHeaders || {}),
  };
}

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "API request failed");
  }
  return payload?.data || payload;
}

async function callPublicApi(path, options = {}) {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: buildHeaders(options.headers, {
      hasBody: Boolean(options.body),
      isFormData: options.body instanceof FormData,
    }),
  });

  return parseApiResponse(response);
}

function requireCustomerSession() {
  const session = getSession();
  if (!session?.session_token) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }
  return session;
}

async function callCustomerApi(path, options = {}) {
  const session = requireCustomerSession();
  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(options.headers, {
        hasBody: Boolean(options.body),
        isFormData: options.body instanceof FormData,
      }),
      Authorization: `Bearer ${session.session_token}`,
    },
  });

  return parseApiResponse(response);
}

export function isMockMode() {
  return false;
}

export function getDemoOtpCode() {
  return "";
}

export function getSallaCustomerIdentity() {
  const session = getSession();
  if (!session) return null;
  return {
    id: session.customer_id,
    name: session.customer_name || session.name || "",
    phone: session.mobile || "",
    email: session.email || "",
    source: session.source || "salla",
  };
}

export function getSession() {
  const sdkSession = getSallaSdkSessionCandidate();
  if (sdkSession?.session_token) {
    const stored = sanitizeSession(readJson(STORAGE_KEYS.session, null));
    if (stored?.session_token !== sdkSession.session_token || stored?.customer_id !== sdkSession.customer_id) {
      writeJson(STORAGE_KEYS.session, sdkSession);
    }
    return sdkSession;
  }

  return sanitizeSession(readJson(STORAGE_KEYS.session, null));
}

export function hasSallaSession() {
  const session = getSession();
  return Boolean(session?.source === "salla" || session?.session_token || session?.customer_id);
}

export function getSessionSummary() {
  const session = getSession();
  if (!session) {
    return {
      isSalla: false,
      name: "",
      mobile: "",
      email: "",
      customerId: "",
      label: "لم يتم الربط مع سلة بعد",
      subtitle: "سجّل دخولك من سلة حتى تظهر الطلبات والملخصات المرتبطة بحسابك.",
    };
  }

  const name = session.customer_name || session.name || "عميل سدادي";
  const mobile = session.mobile || "";
  const email = session.email || "";
  const customerId = session.customer_id || "";

  return {
    isSalla: hasSallaSession(),
    name,
    mobile,
    email,
    customerId,
    label: `مرتبطة بحساب سلة · ${name}`,
    subtitle: mobile
      ? `سيتم استخدام الرقم ${mobile} لربط الطلبات والإشعارات والمستندات تلقائيًا.`
      : "سيتم ربط طلباتك وملخصاتك داخل سلة بحسابك الحالي تلقائيًا.",
  };
}

export function getCustomerApiHeaders(extraHeaders = {}) {
  const session = getSession();
  return {
    ...buildHeaders(extraHeaders),
    ...(session?.session_token ? { Authorization: `Bearer ${session.session_token}` } : {}),
  };
}

export function setSession(value) {
  const session = sanitizeSession(value);
  if (!session) {
    clearSession();
    return null;
  }

  writeJson(STORAGE_KEYS.session, session);
  dispatchSessionEvent("sadady:auth-success", session);
  dispatchSessionEvent("sadady:auth-change", session);
  return session;
}

export function clearSession() {
  removeValue(STORAGE_KEYS.session);
  dispatchSessionEvent("sadady:auth-change", null);
}

function syncSessionFromSallaSdk() {
  const sdkSession = getSallaSdkSessionCandidate();
  if (!sdkSession?.session_token) return false;

  const currentSession = sanitizeSession(readJson(STORAGE_KEYS.session, null));
  const changed = currentSession?.session_token !== sdkSession.session_token || currentSession?.customer_id !== sdkSession.customer_id;
  writeJson(STORAGE_KEYS.session, sdkSession);
  if (changed) {
    dispatchSessionEvent("sadady:auth-success", sdkSession);
    dispatchSessionEvent("sadady:auth-change", sdkSession);
  }
  return true;
}

function scheduleSallaSessionSync(attempt = 0) {
  if (syncSessionFromSallaSdk()) return;
  if (attempt >= SESSION_SYNC_ATTEMPTS) return;
  window.setTimeout(() => scheduleSallaSessionSync(attempt + 1), SESSION_SYNC_DELAY_MS);
}

function registerSallaAuthListeners() {
  const sdk = getSallaSdk();
  if (!sdk?.event?.auth) return false;

  try {
    if (typeof sdk.event.auth.onVerified === "function") {
      sdk.event.auth.onVerified(() => {
        window.setTimeout(syncSessionFromSallaSdk, 0);
      });
    }
    if (typeof sdk.event.auth.onRefreshed === "function") {
      sdk.event.auth.onRefreshed(() => {
        window.setTimeout(syncSessionFromSallaSdk, 0);
      });
    }
    return true;
  } catch {
    return false;
  }
}

if (typeof window !== "undefined") {
  registerSallaAuthListeners();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      registerSallaAuthListeners();
      scheduleSallaSessionSync();
    }, { once: true });
  } else {
    scheduleSallaSessionSync();
  }
  window.addEventListener("load", () => {
    registerSallaAuthListeners();
    scheduleSallaSessionSync();
  });
}

export function getPendingJourney() {
  return readJson(STORAGE_KEYS.pendingJourney, null);
}

export function setPendingJourney(value) {
  writeJson(STORAGE_KEYS.pendingJourney, value);
}

export function clearPendingJourney() {
  removeValue(STORAGE_KEYS.pendingJourney);
}

export function getCurrentJourney() {
  return readJson(STORAGE_KEYS.currentJourney, null);
}

export function setCurrentJourney(value) {
  writeJson(STORAGE_KEYS.currentJourney, value);
}

export function clearCurrentJourney() {
  removeValue(STORAGE_KEYS.currentJourney);
}

export async function requestOtp() {
  throw new Error("التحقق يتم عبر سلة. يرجى تسجيل الدخول من حساب سلة أولًا.");
}

export async function verifyOtp() {
  throw new Error("التحقق يتم عبر سلة. لا يمكن استخدام OTP يدوي هنا.");
}

export async function calculateQuote(input) {
  return callPublicApi("/api/v1/public/quotes/calculate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function precreateOrder(input) {
  return callPublicApi("/api/v1/public/orders/precreate", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "X-Idempotency-Key": generateId("idem") },
  });
}

export async function checkoutOrder(publicOrderId, input = {}) {
  return callPublicApi(`/api/v1/public/orders/${publicOrderId}/checkout`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "X-Idempotency-Key": generateId("idem") },
  });
}

export async function getTracking(trackingNo) {
  return callPublicApi(`/api/v1/public/orders/${encodeURIComponent(trackingNo)}`, {
    method: "GET",
  });
}

export async function getCustomerProfile() {
  const session = requireCustomerSession();
  if (!session.mobile) {
    throw new Error("تعذر تحديد رقم الجوال المرتبط بالحساب.");
  }

  return callCustomerApi(`/api/customer/${encodeURIComponent(session.mobile)}/profile`, {
    method: "GET",
  });
}

export async function getCustomerOrders() {
  const session = requireCustomerSession();
  if (!session.mobile) {
    throw new Error("تعذر تحديد رقم الجوال المرتبط بالحساب.");
  }

  return callCustomerApi(`/api/customer/${encodeURIComponent(session.mobile)}/orders`, {
    method: "GET",
  });
}

export async function getCustomerOrderDetails(orderId) {
  return callCustomerApi(`/api/customer/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
  });
}

export async function getCustomerOrderDocuments(orderId) {
  return callCustomerApi(`/api/customer/orders/${encodeURIComponent(orderId)}/documents`, {
    method: "GET",
  });
}

export async function getCustomerNotifications() {
  const session = requireCustomerSession();
  if (!session.mobile) {
    throw new Error("تعذر تحديد رقم الجوال المرتبط بالحساب.");
  }

  return callCustomerApi(`/api/customer/${encodeURIComponent(session.mobile)}/notifications`, {
    method: "GET",
  });
}
