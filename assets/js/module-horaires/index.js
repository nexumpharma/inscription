const injectUI = window.injectUI;
const attendreModulePret = window.attendreModulePret;
const hydrate = window.hydrate;
const enregistrerHoraires = window.enregistrerHoraires;
const getPharmacie = window.getPharmacie;

let pharmacieId = null;

document.addEventListener("DOMContentLoaded", () => {
  window.lancerModuleHoraires();
});

window.lancerModuleHoraires = async function () {
  console.log("🚀 Initialisation du module horaires...");

  const session = await window.initAuthPage?.();
  if (!session) {
    console.warn("❌ Utilisateur non authentifié");
    return;
  }

  await window.injectUI();
  await window.attendreModulePret();

  const { id, horaires } = await window.getPharmacie();
  if (!id || !horaires) {
    console.error("❌ Pharmacie introuvable ou horaires manquants");
    return;
  }

  pharmacieId = id;
  console.log("✅ ID pharmacie :", pharmacieId);
  console.log("🧪 Horaires récupérés :", horaires);
  window.hydrate(JSON.parse(horaires));

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      window.enregistrerHoraires(pharmacieId);
      window.location.href = "rib.html";
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      window.enregistrerHoraires(pharmacieId);
      window.location.href = "formation.html";
    });
  }

  console.log("✅ Module horaires prêt !");
};
