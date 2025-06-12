// Vérifie d’abord que tout est bien disponible
if (
  window.injectUI &&
  window.attendreModulePret &&
  window.hydrate &&
  window.enregistrerHoraires &&
  window.getPharmacie &&
  window.initAuthPage
) {
  const injectUI = window.injectUI;
  const attendreModulePret = window.attendreModulePret;
  const hydrate = window.hydrate;
  const enregistrerHoraires = window.enregistrerHoraires;
  const getPharmacie = window.getPharmacie;

  let pharmacieId = null;

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.lancerModuleHoraires === "function") {
      window.lancerModuleHoraires();
    }
  });

  if (!window.lancerModuleHoraires) {
    window.lancerModuleHoraires = async function () {
      console.log("🚀 Initialisation du module horaires...");

      const session = await window.initAuthPage?.();
      if (!session) {
        console.warn("❌ Utilisateur non authentifié");
        return;
      }

      await injectUI();
      await attendreModulePret();

      const { id, horaires } = await getPharmacie();
      if (!id || !horaires) {
        console.error("❌ Pharmacie introuvable ou horaires manquants");
        return;
      }

      pharmacieId = id;
      console.log("✅ ID pharmacie :", pharmacieId);
      console.log("🧪 Horaires récupérés :", horaires);
      hydrate(JSON.parse(horaires));

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

      console.log("✅ Module horaires prêt !");
    };
  }
} else {
  console.error("❌ Certains modules UMD ne sont pas chargés correctement.");
}
