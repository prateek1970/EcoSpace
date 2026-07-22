// Client-side Hydration / Script for STUDIO SHOWDE Music Festival

(function() {
  console.log("⚡ STUDIO SHOWDE Festival Experience initialized.");

  // Mobile menu toggle smooth scroll helper
  document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling to all inner links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      });
    });
  });
})();
