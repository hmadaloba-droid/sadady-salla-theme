const API_BASE = window.SADADY_API_BASE || window.sadadyThemeConfig?.api_base_url || "https://api.sadady.com";
const USE_MOCK_API = window.SADADY_USE_MOCK_API === true;
const DEMO_OTP_CODE = "1111";

const STORAGE_KEYS = {
  session: "sadady.theme.session",
  otpRequests: "sadady.theme.otpRequests",
  orders: "sadady.theme.orders",
  pendingJourney: "sadady.theme.pendingJourney",
  currentJourney: "sadady.theme.currentJourney",
};

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

function normalizeMobile(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function toMoneyNumber(value) {
  const normalized = String(value || "").replace(/[^\d.]/g, "");
  return Number(normalized || 0);
}

function generateId(prefix) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}_${Date.now().toString(36).toUpperCase()}${random}`;
}

function generateTrackingNo() {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const tail = Math.floor(Math.random() * 900000 + 100000);
  return `SAD-${yy}${mm}${dd}-${tail}`;
}

async function callLiveApi(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: getCustomerApiHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "API request failed");
  }
  return payload?.data || payload;
}

async function callCustomerApi(path, options = {}) {
  const session = getSession();
  if (!session?.session_token) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: getCustomerApiHeaders(options.headers || {}),
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Customer API request failed");
  }
  return payload?.data || payload;
}

function getOrders() {
  return readJson(STORAGE_KEYS.orders, []);
}

function saveOrders(orders) {
  writeJson(STORAGE_KEYS.orders, orders);
}

function calculateBreakdown(amount, serviceType) {
  const baseFee = serviceType === "urgent" ? Math.max(45, amount * 0.07) : Math.max(25, amount * 0.05);
  const vatAmount = baseFee * 0.15;
  return {
    invoice_amount: amount,
    service_fee: Number(baseFee.toFixed(2)),
    vat_amount: Number(vatAmount.toFixed(2)),
    total_amount: Number((amount + baseFee + vatAmount).toFixed(2)),
  };
}

function createTimeline(statusCode, message) {
  return {
    status_code: statusCode,
    message,
    at: new Date().toISOString(),
  };
}

async function mockRequestOtp(input) {
  const mobile = normalizeMobile(input.mobile);
  const otpRequestId = generateId("otpreq");
  const requests = readJson(STORAGE_KEYS.otpRequests, {});
  requests[otpRequestId] = {
    mobile,
    code: DEMO_OTP_CODE,
    created_at: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.otpRequests, requests);
  return {
    otp_request_id: otpRequestId,
    expires_in_seconds: 300,
    channel: "sms",
    mock_otp_code: DEMO_OTP_CODE,
  };
}

async function mockVerifyOtp(input) {
  const requests = readJson(STORAGE_KEYS.otpRequests, {});
  const record = requests[input.otp_request_id];
  const mobile = normalizeMobile(input.mobile);
  if (!record || record.mobile !== mobile) {
    throw new Error("طلب التحقق غير صالح");
  }
  if (String(input.otp_code || "").trim() !== record.code) {
    throw new Error("رمز التحقق غير صحيح");
  }

  const session = {
    customer_id: generateId("cust"),
    customer_name: "عميل سدادي",
    mobile,
    session_token: generateId("sess"),
    created_at: new Date().toISOString(),
  };

  writeJson(STORAGE_KEYS.session, session);
  delete requests[input.otp_request_id];
  writeJson(STORAGE_KEYS.otpRequests, requests);

  return {
    session,
  };
}

async function mockCalculateQuote(input) {
  const amount = toMoneyNumber(input.invoice_amount);
  if (!amount || amount <= 0) {
    throw new Error("مبلغ الفاتورة غير صالح");
  }

  return {
    quote_id: generateId("quo"),
    invoice_type: input.invoice_type,
    service_type: input.service_type,
    breakdown: calculateBreakdown(amount, input.service_type),
  };
}

async function mockPrecreateOrder(input) {
  const quote = input.quote_snapshot || {};
  const publicOrderId = generateId("pord");
  const orderId = generateId("ord");
  const trackingNo = generateTrackingNo();
  const createdAt = new Date().toISOString();

  const order = {
    order_id: orderId,
    public_order_id: publicOrderId,
    tracking_no: trackingNo,
    invoice_type: input.invoice_type,
    service_type: input.service_type,
    customer_input: input.customer_input,
    invoice_payload: input.invoice_payload,
    quote_snapshot: quote,
    status_code: "created",
    status_label: "تم إنشاء الطلب",
    created_at: createdAt,
    updated_at: createdAt,
    timeline: [
      createTimeline("created", "تم استلام الطلب وإنشاء رقم تتبع أولي"),
    ],
    documents: (input.invoice_payload?.documents || []).map((document, index) => ({
      document_id: generateId(`doc${index + 1}`),
      name: document.name,
      file_name: document.name,
      status: "uploaded",
    })),
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);

  return {
    public_order_id: publicOrderId,
    tracking_no: trackingNo,
    quote_snapshot: quote,
    next_action: "checkout",
  };
}

async function mockCheckoutOrder(publicOrderId) {
  const orders = getOrders();
  const order = orders.find((item) => item.public_order_id === publicOrderId);
  if (!order) {
    throw new Error("تعذر العثور على الطلب");
  }

  order.status_code = "submitted";
  order.status_label = "تم تأكيد الطلب";
  order.updated_at = new Date().toISOString();
  order.timeline.push(createTimeline("submitted", "تم تأكيد الطلب وإحالته إلى التشغيل"));
  saveOrders(orders);

  return {
    public_order_id: order.public_order_id,
    tracking_no: order.tracking_no,
    checkout_url: `/thank-you?tracking_no=${encodeURIComponent(order.tracking_no)}&public_order_id=${encodeURIComponent(order.public_order_id)}`,
  };
}

async function mockGetTracking(trackingNo) {
  const orders = getOrders();
  const query = String(trackingNo || "").trim();
  const order = orders.find((item) => item.tracking_no === query || item.public_order_id === query || item.order_id === query);
  if (!order) {
    throw new Error("لم يتم العثور على الطلب");
  }
  return order;
}

export function isMockMode() {
  return USE_MOCK_API;
}

export function getDemoOtpCode() {
  return DEMO_OTP_CODE;
}

function getSallaCustomer() {
  return window.SADADY_SALLA_CUSTOMER || {};
}

export function getSallaCustomerIdentity() {
  return getSallaCustomer();
}

export function getSession() {
  const sallaCustomer = getSallaCustomer();
  if (sallaCustomer?.id) {
    return {
      customer_id: sallaCustomer.id,
      customer_name: sallaCustomer.name || "عميل سدادي",
      name: sallaCustomer.name || "عميل سدادي",
      mobile: sallaCustomer.phone || "",
      email: sallaCustomer.email || "",
      session_token: sallaCustomer.id,
      created_at: new Date().toISOString(),
      source: "salla",
    };
  }
  return readJson(STORAGE_KEYS.session, null);
}

export function hasSallaSession() {
  return Boolean(getSallaCustomer()?.id || getSession()?.source === "salla");
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
    isSalla: session.source === "salla" || Boolean(customerId),
    name,
    mobile,
    email,
    customerId,
    label: customerId ? `مرتبطة بحساب سلة · ${name}` : `مرتبطة بحساب سلة · ${name}`,
    subtitle: mobile
      ? `سيتم استخدام الرقم ${mobile} لربط الطلبات والإشعارات والمستندات تلقائيًا.`
      : "سيتم ربط طلباتك وملخصاتك داخل سلة بحسابك الحالي تلقائيًا.",
  };
}

export function getCustomerApiHeaders(extraHeaders = {}) {
  const session = getSession();
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(extraHeaders || {}),
  };

  if (session?.session_token) {
    headers.Authorization = `Bearer ${session.session_token}`;
    headers["X-Sadady-Customer-Id"] = session.customer_id || "";
    headers["X-Sadady-Customer-Phone"] = session.mobile || "";
  }

  return headers;
}

export function setSession(value) {
  writeJson(STORAGE_KEYS.session, value);
}

export function clearSession() {
  removeValue(STORAGE_KEYS.session);
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

export async function requestOtp(input) {
  if (USE_MOCK_API) return mockRequestOtp(input);
  throw new Error("التحقق يتم عبر سلة. يرجى تسجيل الدخول من حساب سلة أولًا.");
}

export async function verifyOtp(input) {
  const response = USE_MOCK_API ? await mockVerifyOtp(input) : null;
  if (response?.session) {
    setSession(response.session);
    return response;
  }
  throw new Error("التحقق يتم عبر سلة. لا يمكن استخدام OTP يدوي هنا.");
}

export async function calculateQuote(input) {
  if (USE_MOCK_API) return mockCalculateQuote(input);
  return callLiveApi("/api/v1/public/quotes/calculate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function precreateOrder(input) {
  if (USE_MOCK_API) return mockPrecreateOrder(input);
  return callLiveApi("/api/v1/public/orders/precreate", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "X-Idempotency-Key": generateId("idem") },
  });
}

export async function checkoutOrder(publicOrderId, input = {}) {
  if (USE_MOCK_API) return mockCheckoutOrder(publicOrderId, input);
  return callLiveApi(`/api/v1/public/orders/${publicOrderId}/checkout`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "X-Idempotency-Key": generateId("idem") },
  });
}

export async function getTracking(trackingNo) {
  if (USE_MOCK_API) return mockGetTracking(trackingNo);
  return callLiveApi(`/api/v1/public/orders/${encodeURIComponent(trackingNo)}`, {
    method: "GET",
  });
}

export async function getCustomerProfile() {
  const session = getSession();
  return callCustomerApi(`/api/customer/${encodeURIComponent(session.mobile)}/profile`, {
    method: "GET",
  });
}

export async function getCustomerOrders() {
  const session = getSession();
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
  const session = getSession();
  return callCustomerApi(`/api/customer/${encodeURIComponent(session.mobile)}/notifications`, {
    method: "GET",
  });
}
