console.log("🔍 Vérification des modules UMD :");
console.log("injectUI", window.injectUI);
console.log("attendreModulePret", window.attendreModulePret);
console.log("hydrate", window.hydrate);
console.log("enregistrerHoraires", window.enregistrerHoraires);
console.log("getPharmacie", window.getPharmacie);
console.log("initAuthPage", window.initAuthPage);

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM ready");

  const allReady =
    window.injectUI &&
    window.attendreModulePret &&
    window.hydrate &&
    window.enregistrerHoraires &&
    window.getPharmacie &&
    window.initAuthPage;

  if (allReady) {
    await window.lancerModuleHoraires();
  } else {
    console.error("❌ Certains modules UMD ne sont pas chargés correctement au moment du DOMContentLoaded.");

    // 💤 Tentative de relancer après un petit délai (par sécurité)
    setTimeout(async () => {
      const stillMissing = [
        !window.injectUI && "injectUI",
        !window.attendreModulePret && "attendreModulePret",
        !window.hydrate && "hydrate",
        !window.enregistrerHoraires && "enregistrerHoraires",
        !window.getPharmacie && "getPharmacie",
        !window.initAuthPage && "initAuthPage",
      ].filter(Boolean);

      if (stillMissing.length === 0) {
        console.warn("⏳ Modules UMD présents après délai, on tente un lancement");
        await window.lancerModuleHoraires();
      } else {
        console.error("❌ Modules toujours manquants :", stillMissing.join(", "));
      }
    }, 300);
  }
});

async function lancerModuleHoraires() {
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

  const pharmacieId = id;
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
}

window.lancerModuleHoraires = lancerModuleHoraires;
