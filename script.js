/*
  Randy's Cleaning Pros
  Main website JavaScript file
*/

document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.getElementById("menuButton");
  const menuList = document.getElementById("menuList");

  if (menuButton && menuList) {
    menuButton.addEventListener("click", function () {
      const menuIsOpen = menuList.classList.toggle("show");

      menuButton.setAttribute(
        "aria-expanded",
        menuIsOpen ? "true" : "false"
      );
    });

    const menuLinks = menuList.querySelectorAll("a");

    menuLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        menuList.classList.remove("show");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", function (event) {
      const clickedMenuButton = menuButton.contains(event.target);
      const clickedInsideMenu = menuList.contains(event.target);

      if (!clickedMenuButton && !clickedInsideMenu) {
        menuList.classList.remove("show");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        menuList.classList.remove("show");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.focus();
      }
    });
  }

  const sectionLinks = document.querySelectorAll('a[href^="#"]');

  sectionLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      const sectionId = link.getAttribute("href");

      if (!sectionId || sectionId === "#") {
        return;
      }

      const section = document.querySelector(sectionId);

      if (section) {
        event.preventDefault();

        section.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });

  const buttons = document.querySelectorAll(
    ".quote-button, .menu-button"
  );

  buttons.forEach(function (button) {
    button.addEventListener("pointerdown", function () {
      button.style.transform = "scale(0.97)";
    });

    button.addEventListener("pointerup", function () {
      button.style.transform = "";
    });

    button.addEventListener("pointerleave", function () {
      button.style.transform = "";
    });
  });
}); 
