/*
  Randy's Cleaning Pros
  Main website JavaScript file
*/

document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.getElementById("menuButton");
  const menuList = document.getElementById("menuList");

  if (menuButton && menuList) {
    const closeMenu = function () {
      menuList.classList.remove("show");
      menuButton.setAttribute("aria-expanded", "false");
    };

    menuButton.addEventListener("click", function (event) {
      event.stopPropagation();
      const menuIsOpen = menuList.classList.toggle("show");
      menuButton.setAttribute("aria-expanded", menuIsOpen ? "true" : "false");
    });

    menuList.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (!menuButton.contains(event.target) && !menuList.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuList.classList.contains("show")) {
        closeMenu();
        menuButton.focus();
      }
    });
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      const sectionId = link.getAttribute("href");
      if (!sectionId || sectionId === "#") return;

      const section = document.querySelector(sectionId);
      if (section) {
        event.preventDefault();
        section.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      }
    });
  });

  document.addEventListener("pointerdown", function (event) {
    const button = event.target.closest(".quote-button, .menu-button");
    if (button) button.classList.add("is-pressed");
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach(function (type) {
    document.addEventListener(type, function (event) {
      const button = event.target.closest(".quote-button, .menu-button");
      if (button) button.classList.remove("is-pressed");
    });
  });
});
