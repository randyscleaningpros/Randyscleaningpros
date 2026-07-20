/* ==========================================================
   RANDY'S CLEANING PROS
   WEBSITE JAVASCRIPT
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ========================================================
     MENU BUTTON
     ======================================================== */

  const menuToggle = document.getElementById("menuToggle");
  const mainMenu = document.getElementById("mainMenu");

  function openMenu() {
    menuToggle.classList.add("open");
    mainMenu.classList.add("open");

    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close website menu");
  }

  function closeMenu() {
    menuToggle.classList.remove("open");
    mainMenu.classList.remove("open");

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open website menu");
  }

  function toggleMenu() {
    const menuIsOpen = mainMenu.classList.contains("open");

    if (menuIsOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (menuToggle && mainMenu) {
    menuToggle.addEventListener("click", toggleMenu);

    mainMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      const clickedInsideMenu = mainMenu.contains(event.target);
      const clickedMenuButton = menuToggle.contains(event.target);

      if (!clickedInsideMenu && !clickedMenuButton) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        menuToggle.focus();
      }
    });
  }


  /* ========================================================
     HIGHLIGHT THE CURRENT PAGE
     ======================================================== */

  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".menu-link").forEach((link) => {
    const linkPage = link.getAttribute("href");

    if (linkPage === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });


  /* ========================================================
     SCROLL REVEAL ANIMATIONS
     ======================================================== */

  const revealElements = document.querySelectorAll(
    ".trust-card, " +
    ".promotion-card, " +
    ".work-photo, " +
    ".work-content, " +
    ".gold-badge, " +
    ".gold-standard-content, " +
    ".service-card, " +
    ".photo-banner-overlay"
  );

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {

        entries.forEach((entry) => {

          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }

        });

      },
      {
        threshold: 0.12
      }
    );

    revealElements.forEach((element) => {
      element.classList.add("reveal-item");
      revealObserver.observe(element);
    });

  } else {

    revealElements.forEach((element) => {
      element.classList.add("visible");
    });

  }


  /* ========================================================
     BUTTON RIPPLE EFFECT
     ======================================================== */

  const clickableButtons = document.querySelectorAll(
    ".primary-button, " +
    ".secondary-button, " +
    ".promotion-button, " +
    ".gold-button, " +
    ".large-quote-button, " +
    ".menu-quote-link"
  );

  clickableButtons.forEach((button) => {

    button.addEventListener("click", function (event) {

      const oldRipple = this.querySelector(".ripple");

      if (oldRipple) {
        oldRipple.remove();
      }

      const circle = document.createElement("span");
      const rectangle = this.getBoundingClientRect();
      const size = Math.max(rectangle.width, rectangle.height);

      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;

      circle.style.left =
        `${event.clientX - rectangle.left - size / 2}px`;

      circle.style.top =
        `${event.clientY - rectangle.top - size / 2}px`;

      circle.classList.add("ripple");

      this.appendChild(circle);

      window.setTimeout(() => {
        circle.remove();
      }, 650);

    });

  });


  /* ========================================================
     BACK-TO-TOP BUTTON
     ======================================================== */

  const backToTopButton = document.createElement("button");

  backToTopButton.type = "button";
  backToTopButton.className = "back-to-top";
  backToTopButton.setAttribute("aria-label", "Return to top of page");
  backToTopButton.textContent = "↑";

  document.body.appendChild(backToTopButton);

  window.addEventListener("scroll", () => {

    if (window.scrollY > 500) {
      backToTopButton.classList.add("show");
    } else {
      backToTopButton.classList.remove("show");
    }

  });

  backToTopButton.addEventListener("click", () => {

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

});
