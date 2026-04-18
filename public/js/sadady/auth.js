import { getSession } from "./api-client.js";

const goToCustomerBtn = document.getElementById("goToCustomerBtn");

const CUSTOMER_ORDERS_URL = "/customer/orders";
const CUSTOMER_LOGIN_URL = "/customer/login";

function syncCustomerButton() {
  const session = getSession();

  if (goToCustomerBtn) {
    goToCustomerBtn.textContent = session ? "طلباتي" : "تسجيل الدخول";
    goToCustomerBtn.dataset.sessionState = session ? "connected" : "disconnected";
  }
}

goToCustomerBtn?.addEventListener("click", () => {
  const session = getSession();
  window.location.href = session ? CUSTOMER_ORDERS_URL : CUSTOMER_LOGIN_URL;
});

window.addEventListener("sadady:auth-success", syncCustomerButton);
window.addEventListener("sadady:auth-change", syncCustomerButton);
document.addEventListener("DOMContentLoaded", syncCustomerButton);
syncCustomerButton();
