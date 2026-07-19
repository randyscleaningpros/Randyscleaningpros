/* =========================================================
   RANDY'S CLEANING PROS
   COMPLETE JAVASCRIPT
   File name: script.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.getElementById("menuButton");
  const navLinks = document.getElementById("navLinks");
  const year = document.getElementById("year");
  const header = document.querySelector(".site-header");

  /* =======================================================
     1. MOBILE MENU
     ======================================================= */

  function closeMenu() {
    if (!menuButton || !navLinks) {
      return;
    }

    navLinks.classList.remove("open");

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

    menuButton.setAttribute(
      "aria-label",
      "Open navigation menu"
    );

    menuButton.textContent = "☰ Menu";
  }

  function openMenu() {
    if (!menuButton || !navLinks) {
      return;
    }

    navLinks.classList.add("open");

    menuButton.setAttribute(
      "aria-expanded",
      "true"
    );

    menuButton.setAttribute(
      "aria-label",
      "Close navigation menu"
    );

    menuButton.textContent = "✕ Close";
  }

  function toggleMenu() {
    if (!menuButton || !navLinks) {
      return;
    }

    const menuIsOpen =
      navLinks.classList.contains("open");

    if (menuIsOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (menuButton && navLinks) {
    menuButton.addEventListener(
      "click",
      function (event) {
        event.stopPropagation();
        toggleMenu();
      }
    );

    navLinks.addEventListener(
      "click",
      function (event) {
        event.stopPropagation();
      }
    );

    navLinks
      .querySelectorAll("a")
      .forEach(function (link) {
        link.addEventListener(
          "click",
          closeMenu
        );
      });

    document.addEventListener(
      "click",
      function () {
        closeMenu();
      }
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Escape") {
          closeMenu();
          menuButton.focus();
        }
      }
    );

    window.addEventListener(
      "resize",
      function () {
        if (window.innerWidth > 1080) {
          closeMenu();
        }
      }
    );
  }

  /* =======================================================
     2. AUTOMATIC COPYRIGHT YEAR
     ======================================================= */

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }

  /* =======================================================
     3. HEADER SHADOW WHILE SCROLLING
     ======================================================= */

  function updateHeader() {
    if (!header) {
      return;
    }

    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  updateHeader();

  window.addEventListener(
    "scroll",
    updateHeader,
    {
      passive: true
    }
  );

  /* =======================================================
     4. SMOOTH SCROLL FOR SAME-PAGE LINKS
     ======================================================= */

  document
    .querySelectorAll('a[href^="#"]')
    .forEach(function (link) {
      link.addEventListener(
        "click",
        function (event) {
          const targetId =
            link.getAttribute("href");

          if (
            !targetId ||
            targetId === "#"
          ) {
            return;
          }

          const target =
            document.querySelector(targetId);

          if (!target) {
            return;
          }

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

          closeMenu();
        }
      );
    });

  /* =======================================================
     5. BUTTON CLICK EFFECT
     ======================================================= */

  document
    .querySelectorAll(".button")
    .forEach(function (button) {
      button.addEventListener(
        "pointerdown",
        function () {
          button.classList.add(
            "button-clicked"
          );
        }
      );

      button.addEventListener(
        "pointerup",
        function () {
          button.classList.remove(
            "button-clicked"
          );
        }
      );

      button.addEventListener(
        "pointerleave",
        function () {
          button.classList.remove(
            "button-clicked"
          );
        }
      );

      button.addEventListener(
        "pointercancel",
        function () {
          button.classList.remove(
            "button-clicked"
          );
        }
      );
    });

  /* =======================================================
     6. SCROLL REVEAL EFFECT
     ======================================================= */

  const revealItems =
    document.querySelectorAll(
      ".promise-card, " +
      ".service-card, " +
      ".purpose-box, " +
      ".gold-copy, " +
      ".gold-emblem, " +
      ".section-heading, " +
      ".narrow-container"
    );

  revealItems.forEach(function (item) {
    item.classList.add(
      "reveal-on-scroll"
    );
  });

  if (
    "IntersectionObserver" in window
  ) {
    const observer =
      new IntersectionObserver(
        function (entries, observerInstance) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add(
                "is-visible"
              );

              observerInstance.unobserve(
                entry.target
              );
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin:
            "0px 0px -40px 0px"
        }
      );

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add(
        "is-visible"
      );
    });
  }

  /* =======================================================
     7. PAGE FADE-IN
     ======================================================= */

  document.body.classList.add(
    "page-loaded"
  );
});
