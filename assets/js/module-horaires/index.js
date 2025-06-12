const injectUI = window.injectUI;
const attendreModulePret = window.attendreModulePret;
const hydrate = window.hydrate;
const enregistrerHoraires = window.enregistrerHoraires;
const getPharmacie = window.getPharmacie;

let pharmacieId = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Initialisation du module horaires...");

  // 1. Authentification via window (UMD)
  const session = await window.initAuthPage?.();
  if (!session) {
    console.warn("❌ Utilisateur non authentifié");
    return;
  }

  // 2. Injection UI & DOM ready
  await injectUI();
  await attendreModulePret(); // utile pour l’hydratation

  // 3. Récupération des horaires depuis Supabase
  const { id, horaires } = await getPharmacie();
  if (!id || !horaires) {
    console.error("❌ Pharmacie introuvable ou horaires manquants");
    return;
  }

  pharmacieId = id;
  console.log("✅ ID pharmacie :", pharmacieId);
  console.log("🧪 Horaires récupérés :", horaires);

  // 4. Hydratation du module avec les données
  hydrate(JSON.parse(horaires));

  // 5. Navigation entre pages
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      enregistrerHoraires(pharmacieId);
      window.location.href = "rib.html";
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      enregistrerHoraires(pharmacieId);
      window.location.href = "formation.html";
    });
  }

  // 6. Rendu terminé
  console.log("✅ Module horaires prêt !");
});
