/* ==========================================================
   RANDY'S CLEANING PROS
   script.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       Highlight Current Page
    =============================== */

    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll(".nav-button").forEach(button => {

        const link = button.getAttribute("href");

        if (
            link === currentPage ||
            (currentPage === "" && link === "index.html")
        ) {
            button.classList.add("active");
        }

    });


    /* ===============================
       Button Click Animation
    =============================== */

    document.querySelectorAll(".primary-button, .secondary-button, .nav-button, .promotion-button, .large-quote-button")
        .forEach(button => {

            button.addEventListener("click", function () {

                this.style.transform = "scale(.96)";

                setTimeout(() => {

                    this.style.transform = "";

                }, 150);

            });

        });


    /* ===============================
       Fade In Animation
    =============================== */

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    }, {

        threshold: .15

    });

    document.querySelectorAll(
        ".trust-card, .service-card, .procedure-card, .promotion-card, .gold-standard-content, .gold-badge"
    ).forEach(item => {

        item.classList.add("hidden");

        observer.observe(item);

    });


    /* ===============================
       Ripple Effect
    =============================== */

    document.querySelectorAll("a").forEach(button => {

        button.addEventListener("click", function (e) {

            const circle = document.createElement("span");

            const rect = this.getBoundingClientRect();

            const size = Math.max(rect.width, rect.height);

            circle.style.width = size + "px";
            circle.style.height = size + "px";

            circle.style.left =
                e.clientX - rect.left - size / 2 + "px";

            circle.style.top =
                e.clientY - rect.top - size / 2 + "px";

            circle.classList.add("ripple");

            this.appendChild(circle);

            setTimeout(() => {

                circle.remove();

            }, 600);

        });

    });


    /* ===============================
       Back To Top Button
    =============================== */

    const topButton = document.createElement("button");

    topButton.innerHTML = "↑";

    topButton.className = "back-to-top";

    document.body.appendChild(topButton);

    window.addEventListener("scroll", () => {

        if (window.scrollY > 400) {

            topButton.classList.add("show");

        } else {

            topButton.classList.remove("show");

        }

    });

    topButton.addEventListener("click", () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

});
