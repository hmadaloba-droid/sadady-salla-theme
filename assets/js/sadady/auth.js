import { getSession, getSessionSummary } from "./api-client.js";

const goToCustomerBtn = document.getElementById("goToCustomerBtn");
const loginHint = document.getElementById("loginHint");

const CUSTOMER_ORDERS_URL = "/customer/orders";
const CUSTOMER_LOGIN_URL = "/customer/login";

function syncCustomerButton() {
  const session = getSession();
  const summary = getSessionSummary();

  if (goToCustomerBtn) {
    goToCustomerBtn.textContent = session ? "طلباتي" : "الدخول إلى سلة";
    goToCustomerBtn.dataset.sessionState = session ? "connected" : "disconnected";
  }

  if (loginHint) {
    loginHint.textContent = session
      ? summary.subtitle
      : "الدخول يتم عبر حساب سلة، وبعدها تظهر طلباتك ومستنداتك تلقائيًا.";
  }
}

goToCustomerBtn?.addEventListener("click", () => {
  const session = getSession();
  window.location.href = session ? CUSTOMER_ORDERS_URL : CUSTOMER_LOGIN_URL;
});

window.addEventListener("sadady:auth-success", syncCustomerButton);
document.addEventListener("DOMContentLoaded", syncCustomerButton);
syncCustomerButton();
