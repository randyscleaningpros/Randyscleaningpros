/* =========================================================
   RANDY'S CLEANING PROS
   MAIN JAVASCRIPT
   File name: script.js
   Matches: index.html and styles.css
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const menuButton =
    document.getElementById("menuButton");

  const mainMenu =
    document.getElementById("mainMenu");

  const menuIcon =
    document.querySelector(".menu-icon");

  const menuText =
    document.querySelector(".menu-text");

  const year =
    document.getElementById("year");


  /* =======================================================
     1. OPEN THE DROP-DOWN MENU
     ======================================================= */

  function openMenu() {
    if (!menuButton || !mainMenu) {
      return;
    }

    mainMenu.classList.add("open");

    menuButton.setAttribute(
      "aria-expanded",
      "true"
    );

    menuButton.setAttribute(
      "aria-label",
      "Close navigation menu"
    );

    if (menuIcon) {
      menuIcon.textContent = "✕";
    }

    if (menuText) {
      menuText.textContent = "Close";
    }
  }


  /* =======================================================
     2. CLOSE THE DROP-DOWN MENU
     ======================================================= */

  function closeMenu() {
    if (!menuButton || !mainMenu) {
      return;
    }

    mainMenu.classList.remove("open");

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

    menuButton.setAttribute(
      "aria-label",
      "Open navigation menu"
    );

    if (menuIcon) {
      menuIcon.textContent = "☰";
    }

    if (menuText) {
      menuText.textContent = "Menu";
    }
  }


  /* =======================================================
     3. TOGGLE THE MENU BUTTON
     ======================================================= */

  function toggleMenu() {
    if (!mainMenu) {
      return;
    }

    const menuIsOpen =
      mainMenu.classList.contains("open");

    if (menuIsOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }


  if (menuButton && mainMenu) {
    menuButton.addEventListener(
      "click",
      function (event) {
        event.stopPropagation();
        toggleMenu();
      }
    );


    /* Keep clicks inside the menu from closing it too soon */

    mainMenu.addEventListener(
      "click",
      function (event) {
        event.stopPropagation();
      }
    );


    /* Close the menu after a menu link is selected */

    mainMenu
      .querySelectorAll("a")
      .forEach(function (link) {
        link.addEventListener(
          "click",
          closeMenu
        );
      });


    /* Close when clicking anywhere outside the menu */

    document.addEventListener(
      "click",
      function () {
        closeMenu();
      }
    );


    /* Close when the Escape key is pressed */

    document.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key === "Escape" &&
          mainMenu.classList.contains("open")
        ) {
          closeMenu();
          menuButton.focus();
        }
      }
    );


    /* Close the menu if the screen size changes */

    window.addEventListener(
      "resize",
      closeMenu
    );
  }


  /* =======================================================
     4. AUTOMATIC COPYRIGHT YEAR
     ======================================================= */

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }
});
