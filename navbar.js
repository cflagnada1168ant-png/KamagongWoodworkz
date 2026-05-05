document.addEventListener('DOMContentLoaded', function () {
  const toggle   = document.querySelector('.navigation .menu-toggle');
  const navLinks = document.querySelector('.navigation .nav-links');
  const icon     = toggle ? toggle.querySelector('i') : null;

  if (!toggle || !navLinks) {
    console.warn('Navbar: .menu-toggle or .nav-links not found.');
    return;
  }

  /*Open/Close helpers*/
  function openMenu() {
    navLinks.classList.add('active');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    if (icon) {
      icon.classList.replace('fa-bars', 'fa-xmark');
    }
  }

  function closeMenu() {
    navLinks.classList.remove('active');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if (icon) {
      icon.classList.replace('fa-xmark', 'fa-bars');
    }
  }

  function toggleMenu() {
    navLinks.classList.contains('active') ? closeMenu() : openMenu();
  }

  /*Toggle on hamburger click*/
  toggle.addEventListener('click', toggleMenu);

  /*Keyboard: Enter/Space*/
  toggle.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  });

  /*Close when a nav link is clicked*/
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  /*Close when clicking outside the nav*/
  document.addEventListener('click', function (e) {
    if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
      closeMenu();
    }
  });

  /*Close on Escape key*/
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /*Reset on resize back to desktop*/
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) closeMenu();
  });
});
