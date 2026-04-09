document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.getAttribute("data-scroll-target") || "");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

window.sadadyUi = {
  openModal(id) {
    const node = document.getElementById(id);
    if (node) node.hidden = false;
  },
  closeModal(id) {
    const node = document.getElementById(id);
    if (node) node.hidden = true;
  },
};
