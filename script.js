
document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector(".menu-button");
  const panel = document.querySelector(".menu-panel");
  const toggle = document.querySelector(".submenu-toggle");
  const submenu = document.querySelector(".submenu");
  if (button && panel) {
    button.addEventListener("click", e => {
      e.stopPropagation();
      const open = panel.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", e => {
      if (!panel.contains(e.target) && !button.contains(e.target)) {
        panel.classList.remove("open");
        button.setAttribute("aria-expanded","false");
      }
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") panel.classList.remove("open");
    });
  }
  if (toggle && submenu) toggle.addEventListener("click", () => submenu.classList.toggle("open"));
});
