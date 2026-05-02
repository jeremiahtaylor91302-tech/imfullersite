/**
 * Waitlist — Formspree (free): https://formspree.io → New form → copy the id from /f/XXXXX
 * Paste only the id below (e.g. mqkorabc). Leave '' for demo mode (no server; UI only).
 */
const FORMSPREE_FORM_ID = '';

const btn = document.getElementById('formBtn');
const input = document.getElementById('emailInput');
const pill = document.getElementById('formPill');
const success = document.getElementById('formSuccess');
const formError = document.getElementById('formError');

if (!btn || !input || !pill || !success) return;

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

function showSuccessUI() {
  pill.style.opacity = '0';
  pill.style.transform = 'translateY(-8px)';
  pill.style.transition = 'all 0.4s ease';
  setTimeout(() => {
    pill.style.display = 'none';
    success.classList.add('show');
    success.style.opacity = '0';
    success.style.transform = 'translateY(8px)';
    success.style.transition = 'all 0.4s ease';
    requestAnimationFrame(() => {
      success.style.opacity = '1';
      success.style.transform = 'translateY(0)';
    });
  }, 350);
}

function showInvalidEmail() {
  pill.style.borderColor = 'var(--rosewood)';
  input.style.color = 'var(--rosewood)';
  input.setAttribute('placeholder', 'That doesn’t look like an email');
  setTimeout(() => {
    pill.style.borderColor = 'var(--oat)';
    input.style.color = 'var(--ink)';
    input.setAttribute('placeholder', 'Your email');
  }, 2000);
}

btn.addEventListener('click', async () => {
  hideError();
  const email = input.value.trim();
  if (!isLikelyEmail(email)) {
    showInvalidEmail();
    return;
  }

  const formId = FORMSPREE_FORM_ID.trim();
  if (!formId) {
    showSuccessUI();
    return;
  }

  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  btn.textContent = 'One sec…';

  try {
    const res = await fetch(`https://formspree.io/f/${formId}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (data && data.error) ||
        (data.errors && data.errors[0] && data.errors[0].message) ||
        "Couldn't save that. Try again.";
      throw new Error(typeof msg === 'string' ? msg : "Couldn't save that. Try again.");
    }

    showSuccessUI();
  } catch {
    showError("Couldn't save that. Try again in a moment.");
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.textContent = defaultBtnLabel;
    return;
  }

  btn.removeAttribute('aria-busy');
  btn.textContent = defaultBtnLabel;
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btn.click();
});
