
document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector(".menu-button");
  const panel = document.querySelector(".menu-panel");
  const serviceButton = document.querySelector(".submenu-toggle");
  const submenu = document.querySelector(".submenu");

  if (button && panel) {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const open = panel.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", event => {
      if (!panel.contains(event.target) && !button.contains(event.target)) {
        panel.classList.remove("open");
        button.setAttribute("aria-expanded","false");
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        panel.classList.remove("open");
        button.setAttribute("aria-expanded","false");
      }
    });
  }

  if (serviceButton && submenu) {
    serviceButton.addEventListener("click", () => submenu.classList.toggle("open"));
  }

  const quoteForm = document.getElementById("quoteForm");
  if (quoteForm) {
    quoteForm.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(quoteForm);
      const lines = [];
      for (const [key, value] of data.entries()) {
        lines.push(`${key}: ${value}`);
      }
      const subject = encodeURIComponent("Free Quote Request - Randy's Premier Cleaning");
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = `mailto:randyspremiercleaning@gmail.com?subject=${subject}&body=${body}`;
    });
  }
});
