// Echo Showcase Hub - Client-side Interactive Logic

document.addEventListener('DOMContentLoaded', () => {
  initLikeButtons();
  initPresetAudioButtons();
  initFormValidation();
});

/**
 * Handle non-refresh AJAX Track Likes
 */
function initLikeButtons() {
  const likeButtons = document.querySelectorAll('.btn-like');

  likeButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      const trackId = btn.dataset.trackId;
      const countSpan = btn.querySelector('.like-count');
      const icon = btn.querySelector('i');

      if (!trackId) return;

      // Prevent rapid spam clicking during network request
      btn.disabled = true;

      try {
        const response = await fetch(`/api/tracks/${trackId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          // Update count in UI seamlessly
          if (countSpan) {
            countSpan.textContent = data.likes;
          }

          // Visual feedback animations
          btn.classList.add('liked');
          if (icon) {
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill');
            btn.classList.add('pulse');
            setTimeout(() => btn.classList.remove('pulse'), 300);
          }

          // Optional toast or small floating indicator
          showFloatingToast('Loved track! ❤️', 'success');
        } else {
          showFloatingToast(data.message || 'Error liking track', 'danger');
        }
      } catch (err) {
        console.error('AJAX Like error:', err);
        showFloatingToast('Network error while liking track.', 'danger');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

/**
 * Helper to select pre-filled audio URLs in admin panel
 */
function initPresetAudioButtons() {
  const presetButtons = document.querySelectorAll('.preset-audio-btn');
  const urlInput = document.getElementById('audioUrl');

  if (!presetButtons.length || !urlInput) return;

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetUrl = btn.dataset.url;
      if (presetUrl) {
        urlInput.value = presetUrl;
        urlInput.classList.add('is-valid');
        showFloatingToast('Preset audio URL selected!', 'info');
      }
    });
  });
}

/**
 * Basic Bootstrap client validation styling
 */
function initFormValidation() {
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
}

/**
 * Toast notifications generator
 */
function showFloatingToast(message, type = 'info') {
  let toastContainer = document.getElementById('echo-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'echo-toast-container';
    toastContainer.className = 'echo-toast position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1090';
    document.body.appendChild(toastContainer);
  }

  const toastEl = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-warning text-dark';
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

  toastEl.className = `toast align-items-center text-white ${bgClass} border-0 show shadow-lg mb-2`;
  toastEl.role = 'alert';
  toastEl.ariaLive = 'assertive';
  toastEl.ariaAtomic = 'true';

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2 font-monospace">
        <i class="bi ${icon} fs-5"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 300);
  }, 3500);
}
