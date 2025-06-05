// assets/js/auth.js

window.supabase = window.supabase.createClient(
  window.config.SUPABASE_URL,
  window.config.SUPABASE_KEY
);

// Fonction de redirection intelligente
function redirectToConnexion() {
  const isInPages = location.pathname.includes("/pages/");
  window.location.href = isInPages ? "connexion.html" : "pages/connexion.html";
}

// Fonction à réutiliser dans toutes les pages
window.initAuthPage = async function () {
  const supabase = window.supabase;
  const app = document.getElementById("app");
  const statusContainer = document.getElementById("status-container");
  const statusText = document.getElementById("status");
  const logoutBtn = document.getElementById("logoutBtn");

  // Masque l'app en attendant validation
  if (app) app.style.display = "none";

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    redirectToConnexion();
    return null;
  }

  const session = await supabase.auth.getSession();
  const token = session.data.session.access_token;

  // Affiche l'app
  if (app) app.style.display = "block";
  if (statusContainer) statusContainer.style.display = "flex";
  if (logoutBtn) logoutBtn.style.display = "inline-block";
  if (statusText) statusText.innerHTML = `✅ Connecté en tant que <strong>${user.email}</strong>`;

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      alert("Déconnecté.");
      redirectToConnexion();
    });
  }

  return { user, token };
};
