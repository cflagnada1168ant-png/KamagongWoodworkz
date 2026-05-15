document.addEventListener("DOMContentLoaded", function() {
    const menuToggle = document.getElementById("mobile-menu");
    const navLinks = document.getElementById("nav-links");

    if (menuToggle && navLinks) {
        
        // Single unified click event
        menuToggle.addEventListener("click", function() {
            menuToggle.classList.toggle("open");   // Morph hamburger lines to X
            navLinks.classList.toggle("active");   // Slides dropdown open/closed
        });

        // Close dropdown when a navigation link inside is clicked
        document.querySelectorAll(".nav-links a").forEach(link => {
            link.addEventListener("click", () => {
                menuToggle.classList.remove("open");
                navLinks.classList.remove("active");
            });
        });
        
    } else {
        console.error("Navigation error: Essential elements were missing from DOM.");
    }
});