// assets/js/connexion.js

const DEBUG = false;
function debug(...args) { if (DEBUG) console.log(...args); }

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const messageEl = document.getElementById('message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();

    if (!email) {
      messageEl.textContent = 'Veuillez entrer une adresse email.';
      return;
    }

    messageEl.textContent = 'Vérification en cours...';

    try {
      const response = await fetch(`${window.config.SUPABASE_FUNCTION_BASE}/generate-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      debug('Réponse backend:', result);

      if (response.ok) {
        messageEl.textContent = 'Consultez votre boîte mail pour vous connecter.';
      } else {
        messageEl.textContent = result.error || 'Une erreur est survenue.';
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      messageEl.textContent = 'Erreur réseau. Veuillez réessayer.';
    }
  });
});
