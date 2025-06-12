import { ajouterPlage } from './plages.js';

export function hydrate(data) {
  const { habituels = {}, exceptionnels = [] } = data;

  console.log("📥 Hydratation - horaires habituels :", habituels);
  console.log("📥 Hydratation - horaires exceptionnels :", exceptionnels);

  hydrateHorairesHabituels(habituels);
  hydrateHorairesExceptionnels(exceptionnels);
}

function hydrateHorairesHabituels(habituels) {
  Object.entries(habituels).forEach(([jour, info]) => {
    const container = document.querySelector(`.jour-container[data-jour="${jour}"]`);
    if (!container) {
      console.warn("❌ Conteneur non trouvé pour :", jour);
      return;
    }

    const check24h = container.querySelector(".ouvert24hCheck");
    if (check24h) {
      check24h.checked = !!info.ouvert_24h;
      check24h.dispatchEvent(new Event("change"));
    }

    const selectFreq = container.querySelector("select.frequence");
    if (selectFreq && info.frequence) {
      selectFreq.value = info.frequence;
    }

    if (Array.isArray(info.plages)) {
      const initBtn = container.querySelector(".init-ajouter");
      if (initBtn) initBtn.remove();

      const status = container.querySelector(".ferme");
      if (status) status.remove();

      const plagesContainer = container.querySelector(".plages");
      const actionsContainer = container.querySelector(".actions");

      info.plages.forEach(({ debut, fin }) => {
        ajouterPlage(jour, debut, fin, container);
      });

      plagesContainer.style.display = "block";
      actionsContainer.style.display = "flex";

      const advanced = container.querySelector("details");
      if (advanced) {
        advanced.style.display = "block";
        advanced.open = false;
      }
    }
  });
}

function hydrateHorairesExceptionnels(exceptionnels) {
  exceptionnels.forEach(item => {
    const { debut, fin, jours } = item;

    const startInput = document.getElementById("exception-start");
    const endInput = document.getElementById("exception-end");
    const addBtn = document.getElementById("ajouter-exception");

    if (!startInput || !endInput || !addBtn) return;

    // Simule l'ajout d'une plage exceptionnelle
    startInput.value = debut;
    endInput.value = fin;
    addBtn.click();

    // Hydratation après délai (DOM doit générer les jours)
    setTimeout(() => {
      const containers = document.querySelectorAll("#exceptions-list .exception-container");

      containers.forEach(container => {
        const titre = container.querySelector("strong")?.textContent || "";
        const match = titre.match(/du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/);
        if (!match || match[1] !== debut || match[2] !== fin) return;

        Object.entries(jours).forEach(([jourComplet, jourData]) => {
          const jourKey = jourComplet.trim();
          const jourContainer = container.querySelector(`.jour-container[data-jour="${jourKey}"]`);
          if (!jourContainer) return;

          const checkbox = jourContainer.querySelector(".ouvert24hCheck");
          if (checkbox) {
            checkbox.checked = !!jourData.ouvert_24h;
            checkbox.dispatchEvent(new Event("change"));
          }

          const plagesContainer = jourContainer.querySelector(".plages");
          if (plagesContainer) plagesContainer.innerHTML = "";

          (jourData.plages || []).forEach(({ debut, fin }) => {
            ajouterPlage(jourKey, debut, fin, jourContainer);
          });
        });
      });
    }, 250);
  });
}
