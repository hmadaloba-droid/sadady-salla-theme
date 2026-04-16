import { getSessionSummary } from "./api-client.js";

function syncSessionWidget(root = document) {
  const summary = getSessionSummary();
  const strip = root.querySelector("[data-sadady-session-strip]");
  const titleNodes = root.querySelectorAll("[data-sadady-session-title]");
  const subtitleNodes = root.querySelectorAll("[data-sadady-session-subtitle]");
  const nameNodes = root.querySelectorAll("[data-sadady-session-name]");
  const phoneNodes = root.querySelectorAll("[data-sadady-session-phone]");
  const idNodes = root.querySelectorAll("[data-sadady-session-id]");

  if (strip) {
    strip.dataset.sessionState = summary.isSalla ? "connected" : "disconnected";
  }

  titleNodes.forEach((node) => {
    node.textContent = summary.label;
  });

  subtitleNodes.forEach((node) => {
    node.textContent = summary.subtitle;
  });

  nameNodes.forEach((node) => {
    node.textContent = summary.name || "اسم العميل";
  });

  phoneNodes.forEach((node) => {
    node.textContent = summary.mobile || "الجوال";
  });

  idNodes.forEach((node) => {
    node.textContent = summary.customerId || "هوية سلة";
  });
}

function bindScrollCta() {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const selector = button.getAttribute("data-scroll-target");
      const target = selector ? document.querySelector(selector) : null;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function initHome() {
  syncSessionWidget();
  bindScrollCta();
}

window.addEventListener("sadady:auth-success", () => syncSessionWidget());
window.addEventListener("sadady:auth-change", () => syncSessionWidget());
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHome, { once: true });
} else {
  initHome();
}
