/**
 * Waitlist — Formspree: https://formspree.io → form id from /f/XXXXX (public in client).
 */
const FORMSPREE_FORM_ID = 'xojrvzaj';
const FORMSPREE_ENDPOINT = `https://formspree.io/f/${FORMSPREE_FORM_ID}`;

(function initWaitlist() {
  const form = document.getElementById('waitlistForm');
  const btn = document.getElementById('formBtn');
  const input = document.getElementById('emailInput');
  const pill = document.getElementById('formPill');
  const success = document.getElementById('formSuccess');
  const formError = document.getElementById('formError');

  if (!form || !btn || !input) return;

  if (FORMSPREE_FORM_ID.trim()) {
    form.setAttribute('action', FORMSPREE_ENDPOINT);
  }

  const defaultBtnLabel = btn.textContent;

  function isLikelyEmail(s) {
    return s.length > 3 && s.includes('@') && s.includes('.');
  }

  function showError(msg) {
    if (!formError) return;
    formError.textContent = msg;
    formError.removeAttribute('hidden');
  }

  function hideError() {
    if (!formError) return;
    formError.setAttribute('hidden', '');
    formError.textContent = '';
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function showSuccessUI() {
    const revealSuccess = () => {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = defaultBtnLabel;
      if (success) {
        success.classList.add('show');
        success.style.opacity = '0';
        success.style.transform = 'translateY(8px)';
        success.style.transition = 'all 0.4s ease';
        requestAnimationFrame(() => {
          success.style.opacity = '1';
          success.style.transform = 'translateY(0)';
        });
      } else if (formError) {
        formError.textContent = "Noted. We'll whisper when the room's ready.";
        formError.removeAttribute('hidden');
      }
    };

    if (!pill) {
      revealSuccess();
      return;
    }
    pill.style.opacity = '0';
    pill.style.transform = 'translateY(-8px)';
    pill.style.transition = 'all 0.4s ease';
    setTimeout(() => {
      pill.style.display = 'none';
      revealSuccess();
    }, 350);
  }

  function runPrankThenSuccess() {
    const overlay = document.getElementById('prankOverlay');
    document.body.classList.add('waitlist-prank');
    if (overlay) {
      overlay.classList.add('is-on');
      overlay.setAttribute('aria-hidden', 'false');
    }
    window.setTimeout(() => {
      document.body.classList.remove('waitlist-prank');
      if (overlay) {
        overlay.classList.remove('is-on');
        overlay.setAttribute('aria-hidden', 'true');
      }
      showSuccessUI();
    }, 1350);
  }

  function onWaitlistSuccess() {
    if (prefersReducedMotion()) {
      showSuccessUI();
      return;
    }
    runPrankThenSuccess();
  }

  function showInvalidEmail() {
    if (pill) pill.style.borderColor = 'var(--rosewood)';
    input.style.color = 'var(--rosewood)';
    input.setAttribute('placeholder', 'That doesn’t look like an email');
    setTimeout(() => {
      if (pill) pill.style.borderColor = 'var(--oat)';
      input.style.color = 'var(--ink)';
      input.setAttribute('placeholder', 'Your email');
    }, 2000);
  }

  function formspreeErrorMessage(data) {
    if (!data || typeof data !== 'object') return null;
    if (typeof data.error === 'string') return data.error;
    const first = Array.isArray(data.errors) ? data.errors[0] : null;
    if (first && typeof first.message === 'string') return first.message;
    const fieldErrors = data.errors;
    if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
      const key = Object.keys(fieldErrors)[0];
      if (key) {
        const v = fieldErrors[key];
        const msg = Array.isArray(v) ? v[0] : v;
        if (typeof msg === 'string') return msg;
      }
    }
    return null;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = input.value.trim();
    if (!isLikelyEmail(email)) {
      showInvalidEmail();
      return;
    }

    const formId = FORMSPREE_FORM_ID.trim();
    if (!formId) {
      showError('Waitlist is not configured.');
      return;
    }

    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'One sec…';

    const action = form.getAttribute('action') || FORMSPREE_ENDPOINT;
    const fd = new FormData(form);

    try {
      const res = await fetch(action, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          formspreeErrorMessage(data) || "Couldn't save that. Try again.";
        throw new Error(msg);
      }

      onWaitlistSuccess();
    } catch (err) {
      const fallback = "Couldn't save that. Try again in a moment.";
      const isNetwork =
        err instanceof TypeError ||
        (err instanceof Error &&
          (err.message === 'Failed to fetch' || err.message === 'Load failed'));
      const message =
        err instanceof Error && err.message && !isNetwork ? err.message : fallback;
      showError(message);
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = defaultBtnLabel;
      return;
    }
  });
})();
