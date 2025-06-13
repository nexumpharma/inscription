// module-horaires.js

// Inject styles
const style = document.createElement('style');
style.textContent = `
#module-horaires { max-width: 700px; margin: 2rem auto; font-family: 'Segoe UI', sans-serif; }
.tabs { display: flex; gap: 1rem; margin-bottom: 1rem; }
.tab-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  background: #eee;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
}
.tab-button.active {
  background: #fff;
  border-bottom: none;
  font-weight: bold;
}
.tab-content {
  display: none;
  border: 1px solid #ccc;
  border-top: none;
  padding: 1rem;
  border-radius: 0 0 6px 6px;
}
.tab-content.active { display: block; }
.jour-container {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}
.plage { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
.plage input.heure { width: 120px; }
.actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
.ferme { color: #999; font-style: italic; margin: 0.5rem 0; }
#module-horaires button {
  background: #fff;
  color: #000;
  border: 1px solid #333;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
}
#module-horaires button:hover {
  background: #f0f0f0;
}
label.toggle {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  margin: 0.5rem 0;
  vertical-align: middle;
}
.exception-container {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 6px;
}
.exception-controls { margin-bottom: 1rem; }
.exception-container input[type="text"].date {
  margin-right: 0.5rem;
}`;
document.head.appendChild(style);

  function initFlatpickrHeure(input) {
    return flatpickr(input, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: true,
      locale: "fr",
      allowInput: true,
      defaultDate: null,
      onOpen(selectedDates, dateStr, instance) {
        if (!instance.input.value) {
          instance.setDate("12:00", true, "H:i");
        }
      }
    });
  }

  function makePlage(container, debut = "", fin = "") {
      console.log("🧩 makePlage appelée avec :", { debut, fin });
    const div = document.createElement("div");
    div.className = "plage";
    div.innerHTML = `
      <input type='text' class='heure' value='${debut}' placeholder="HH:MM">
      <span>à</span>
      <input type='text' class='heure' value='${fin}' placeholder="HH:MM">
      <button type='button' title="Supprimer cette plage">❌</button>
    `;
    div.querySelector("button").onclick = () => {
  div.remove();

  const plages = container.querySelectorAll('.plage');
  if (plages.length === 0) {
    const plagesEl = container.querySelector('.plages');
    const actions = container.querySelector('.actions');
    const advanced = container.querySelector('details');

    // Réaffiche le texte "Fermé"
    let status = container.querySelector('.ferme');
    if (!status) {
      status = document.createElement('div');
      status.className = 'ferme';
      status.textContent = 'Fermé';
    }
    container.insertBefore(status, plagesEl);

    const initBtn = createInitButton(container, plagesEl, actions, advanced, status);
    container.insertBefore(initBtn, plagesEl);

    if (advanced) {
      advanced.style.display = 'none';
      advanced.open = false;
    }

    const freq = container.querySelector('select.frequence');
    if (freq) {
      freq.value = 'toutes';
    }

    const check24 = container.querySelector('input.ouvert24hCheck');
    if (check24) {
      check24.checked = false;
    }

    actions.style.display = 'none';
    plagesEl.style.display = 'none';
  }
};

    div.querySelectorAll(".heure").forEach(input => initFlatpickrHeure(input));
 
      console.log("🧱 makePlage retourne :", div.outerHTML);
       return div;
  }

  function createInitButton(container, plages, actions, advanced, status) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "+ Ajouter une plage";
    btn.className = "init-ajouter";
    btn.onclick = () => {
      btn.remove();
      if (status) status.remove();
      plages.appendChild(makePlage(container));
      plages.style.display = "block";
      actions.style.display = "flex";
      if (advanced) {
        advanced.style.display = "block";
        advanced.open = false;
      }
    };
    return btn;
  }


function ajouterPlage(jour, debut, fin, container = null) {
  const jourContainer = container || document.querySelector(`.jour-container[data-jour="${jour}"]`);
  if (!jourContainer) return;
  const plagesContainer = jourContainer.querySelector(".plages");
  const node = makePlage(jourContainer, debut, fin);
console.log(`📌 Ajout manuel d'une plage dans ${jour} =>`, node.outerHTML);
plagesContainer.appendChild(node);
console.log(`📌 Après ajout, plagesContainer :`, plagesContainer.innerHTML);

  console.log("📥 DOM après appendChild :", plagesContainer.innerHTML);
  plagesContainer.style.display = "block";
  jourContainer.querySelector(".actions").style.display = "flex";
}


function majAffichageJour(container, jourData) {
  const hasPlages = jourData.plages && jourData.plages.length > 0;
  const boutonInit = container.querySelector(".init-ajouter");
  const actions = container.querySelector(".actions");
  const details = container.querySelector("details");

  if (jourData.ouvert_24h) {
  if (boutonInit) boutonInit.style.display = "none";
  if (actions) actions.style.display = "none";
  if (details) {
    details.style.display = "none"; // ✅ correction ici
    details.open = false;
  }
}
 else if (hasPlages) {
    if (boutonInit) boutonInit.remove();
    if (actions) actions.style.display = "flex";
    if (details) details.style.display = "block";
  } else {
    if (boutonInit) boutonInit.style.display = "inline-block";
    if (actions) actions.style.display = "none";
    if (details) details.style.display = "none";
  }
}



async function hydrateModuleFromJson(json) {
 console.trace("📍 hydrateModuleFromJson appelée ici");
  
  if (!window.moduleHorairesReady) {
  console.warn("⏳ Module non prêt, hydratation annulée");
  return;
}
  

  const { habituels = {}, exceptionnels = [] } = json;
console.log("✅ Entrées habituels :", Object.entries(habituels));
console.log("✅ Entrées exceptionnels :", exceptionnels);
  
  // HABITUELS
  console.log("📆 Hydratation des horaires habituels :", Object.entries(habituels));

  for (const [jour, data] of Object.entries(habituels)) {
    const container = document.querySelector(`.jour-container[data-jour="${jour}"]`);
    if (!container) {
      console.warn(`❌ Aucun conteneur trouvé pour le jour ${jour}`);
      continue;
    }

    console.log(`🔧 Hydratation de ${jour} avec :`, data);

    const boutonInit = container.querySelector(".init-ajouter");
    const divFerme = container.querySelector(".ferme");
    const checkbox24h = container.querySelector(".ouvert24hCheck");
    const selectFrequence = container.querySelector(".frequence");

// Affiche les bonnes options si ouvert
if (data.ouvert) {
  divFerme.style.display = "none";

  const actions = container.querySelector(".actions");
  const details = container.querySelector("details");

  // Cas particulier : ouvert 24h/24
  if (data.ouvert_24h) {
  boutonInit.style.display = "none";
  if (actions) actions.style.display = "none";

  if (details) {
    details.style.display = "none"; // ✅ cache
    details.open = false;           // ✅ force la fermeture
  }

  divFerme.textContent = "Ouvert 24h/24";
  divFerme.style.display = "block";
}

 else {
const hasPlages = data.plages && data.plages.length > 0;


// 🔧 Corriger les doublons de bouton "Ajouter une plage"
if (hasPlages) {
  // Supprimer le bouton init s’il existe
  if (boutonInit) boutonInit.remove();

  // Assure que .actions est visible et contient un seul bouton
  if (actions) {
    actions.style.display = "flex";
    const btns = actions.querySelectorAll("button");
    if (btns.length > 1) {
      // Supprime les doublons
      btns.forEach((btn, i) => { if (i > 0) btn.remove(); });
    }
  }
} else {
  // Aucune plage => afficher le bouton init
  if (boutonInit) boutonInit.style.display = "inline-block";
  if (actions) actions.style.display = "none";
}

// Affichage des options avancées
if (details) {
  const afficherOptions = data.frequence !== "toutes" || hasPlages;
  details.style.display = afficherOptions ? "block" : "none";
}

    
// 🔧 Supprimer le bouton init si des plages existent déjà
if (hasPlages && boutonInit) {
  boutonInit.remove();
} else {
  boutonInit.style.display = "inline-block";
}

    if (actions) actions.style.display = hasPlages ? "flex" : "none";

    if (details) {
      const afficherOptions = data.frequence !== "toutes" || hasPlages;
      details.style.display = afficherOptions ? "block" : "none";
    }
  }
}



    // Fréquence des semaines
    if (selectFrequence && data.frequence) {
      selectFrequence.value = data.frequence;
    }

    // Checkbox 24h
    if (checkbox24h) {
  if (checkbox24h) {
  checkbox24h.checked = !!data.ouvert_24h;

  if (data.ouvert_24h) {
    const toggle24h = container.querySelector("label.toggle");
    const details = container.querySelector("details");

    // Déplace le toggle hors de details si besoin
    if (toggle24h?.dataset.alone !== "true") {
      container.appendChild(toggle24h);
      toggle24h.dataset.alone = "true";
    }

    // Masque les options avancées AVANT le dispatch
    if (details) {
      details.style.display = "none";
      details.open = false;
    }

    // Affiche le label "Ouvert 24h/24"
    const divFerme = container.querySelector(".ferme");
    if (divFerme) {
      divFerme.textContent = "Ouvert 24h/24";
      divFerme.style.display = "block";
    }

    // Enfin, déclenche le comportement normal
    checkbox24h.dispatchEvent(new Event("change"));
  } else {
    checkbox24h.dispatchEvent(new Event("change"));
  }
}
 else {
    checkbox24h.dispatchEvent(new Event("change"));
  }
}



    // Ajout des plages
    if (data.plages && data.plages.length > 0) {
      data.plages.forEach(({ debut, fin }) => {
        console.log(`➕ Ajout plage ${debut} - ${fin} pour ${jour}`);
        ajouterPlage(jour, debut, fin);
      });
    } else {
      console.log(`ℹ️ Aucune plage à afficher pour ${jour}`);
    }
    majAffichageJour(container, data);
  }

// EXCEPTIONNELS
console.log("📆 Hydratation des horaires exceptionnels :", exceptionnels);

for (let i = 0; i < exceptionnels.length; i++) {
  const item = exceptionnels[i];
  const startInput = document.getElementById("exception-start");
  const endInput = document.getElementById("exception-end");
  if (!startInput || !endInput) {
    console.warn("❌ Impossible d'hydrater les exceptionnels, inputs manquants");
    continue; // ← ce `continue` est OK ici car on est bien dans une boucle
  }

  // Simule l'ajout de la plage
const addBtn = document.getElementById("ajouter-exception");
if (addBtn) {
  startInput.value = item.debut;
  endInput.value = item.fin;
  addBtn.click();

  // Vide les champs ensuite pour éviter effet de bord visuel
  setTimeout(() => {
    startInput.value = "";
    endInput.value = "";
  }, 100);
}

// Ensuite : attendre que DOM ait généré les containers, puis hydrater
  setTimeout(() => {
    const containers = document.querySelectorAll("#exceptions-list .exception-container");

    containers.forEach(container => {
      const titre = container.querySelector("strong")?.textContent || "";
      const match = titre.match(/du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/);
      if (!match) return;

      const debut = match[1];
      const fin = match[2];
      const joursData = exceptionnels.find(e => e.debut === debut && e.fin === fin)?.jours;
      if (!joursData) return;

      Object.keys(joursData).forEach(jourComplet => {
        const jourData = joursData[jourComplet];
        const jourKey = jourComplet.trim();
        const containerJour = container.querySelector(`.jour-container[data-jour="${jourKey}"]`);
        if (!containerJour) {
          console.warn("❌ Jour non trouvé :", jourKey);
          return;
        }

        const checkbox = containerJour.querySelector(".ouvert24hCheck");
        if (checkbox) {
          checkbox.checked = !!jourData.ouvert_24h;
          checkbox.dispatchEvent(new Event("change"));
        }

        // Vider les anciennes plages pour éviter les doublons
const plagesContainer = containerJour.querySelector(".plages");
if (plagesContainer) {
  plagesContainer.innerHTML = "";
}

// Ajouter les plages de l'exception
(jourData.plages || []).forEach(p => {
  ajouterPlage(jourKey, p.debut, p.fin, containerJour);
});


        majAffichageJour(containerJour, jourData);
      });
    });
  }, 250); // délai pour attendre que le DOM soit prêt
}



  console.log("✅ Hydratation terminée !");
}




// 👉 Tu peux maintenant continuer avec le reste de ton module (injection HTML, Flatpickr, creerBlocJour, makePlage, etc.)
// Assure-toi simplement d’appeler scheduleAutoSave() après chaque action utilisateur qui modifie les horaires.


// Inject HTML structure
document.addEventListener("DOMContentLoaded", async () => {
  const session = await window.initAuthPage();
  if (!session) return;
  // Partie 1 : injection HTML + module prêt
  const container = document.getElementById("module-horaires");
  if (!container) return;


  function creerBlocJour(jour, parentContainer, isException = false) {
    const container = document.createElement("div");
    container.className = "jour-container";
    container.dataset.jour = jour;

    const title = document.createElement("h3");
    title.textContent = jour.charAt(0).toUpperCase() + jour.slice(1);

    const status = document.createElement("div");
    status.className = "ferme";
    status.textContent = "Fermé";

    const plages = document.createElement("div");
    plages.className = "plages";
    plages.style.display = "none";

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.style.display = "none";

    let advancedOptions = null;
    let toggle24h, check24h;
    if (!isException) {
      advancedOptions = document.createElement("details");
      advancedOptions.style.display = "none";
      const summary = document.createElement("summary");
      summary.textContent = "Options avancées";
      advancedOptions.appendChild(summary);

      const freqLabel = document.createElement("label");
      freqLabel.innerHTML = `Semaine : <select class='frequence'>
        <option value='toutes'>Toutes les semaines</option>
        <option value='paire'>Semaines paires</option>
        <option value='impaire'>Semaines impaires</option>
      </select>`;

      toggle24h = document.createElement("label");
      toggle24h.className = "toggle";

toggle24h.style.marginBottom = "1rem"; // un peu d’air
toggle24h.dataset.alone = "false"; // pour savoir si elle est déplacée ou pas

      
      check24h = document.createElement("input");
      check24h.type = "checkbox";
      check24h.className = "ouvert24hCheck";

check24h.addEventListener("change", () => {
  let status = container.querySelector(".ferme");
  const plages = container.querySelector(".plages");
  const actions = container.querySelector(".actions");
  const initBtn = container.querySelector(".init-ajouter");

  const advanced = container.querySelector("details");
  const freq = container.querySelector("select.frequence");

  if (!status) {
    status = document.createElement("div");
    status.className = "ferme";
    container.insertBefore(status, plages);
  }

  if (check24h.checked) {
    // Affiche "Ouvert 24h/24"
    status.textContent = "Ouvert 24h/24";

    // Supprime toutes les plages
    plages.innerHTML = "";
    plages.style.display = "none";
    actions.style.display = "none";

    // Cache bouton ajouter
    if (initBtn) initBtn.style.display = "none";

    // Cache les options avancées
    if (advanced) advanced.style.display = "none";

    // Réinitialise fréquence
    if (freq) freq.value = "toutes";

    // Déplace le label toggle24h en dehors des options avancées si besoin
    if (toggle24h.dataset.alone !== "true") {
      container.appendChild(toggle24h);
      toggle24h.dataset.alone = "true";
    }

} else {
  // Retour à "Fermé"
  status.textContent = "Fermé";
  if (!status.parentNode) {
    container.insertBefore(status, plages);
  }

  plages.style.display = "none";
  actions.style.display = "none";

  // ✅ Recrée le bouton init s’il n’existe plus
  let initBtn = container.querySelector(".init-ajouter");
  if (!initBtn) {
    initBtn = createInitButton(container, plages, actions, advanced, status);
    container.insertBefore(initBtn, plages);
  } else {
    initBtn.style.display = "inline-block";
  }

  // Replace le toggle dans les options avancées
  if (toggle24h.dataset.alone === "true" && advanced) {
    advanced.appendChild(toggle24h);
    toggle24h.dataset.alone = "false";
  }

  if (advanced) advanced.style.display = "none";
}

});


      
      toggle24h.appendChild(check24h);
      toggle24h.append("Ouvert 24h/24");

      advancedOptions.appendChild(freqLabel);
      advancedOptions.appendChild(toggle24h);
    }

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "+ Ajouter une plage";
    addBtn.onclick = () => {
      plages.appendChild(makePlage(container));
      plages.style.display = "block";
      actions.style.display = "flex";
      if (advancedOptions) {
        advancedOptions.style.display = "block";
        advancedOptions.open = false;
      }
    };
    actions.appendChild(addBtn);

    const initBtn = createInitButton(container, plages, actions, advancedOptions, status);

    container.append(title, status, initBtn, plages, actions);
    if (advancedOptions) container.appendChild(advancedOptions);
    parentContainer.appendChild(container);
  }
  
  container.innerHTML = `
    <div class="tabs">
      <div class="tab-button active" data-tab="habituels">Horaires habituels</div>
      <div class="tab-button" data-tab="exceptionnels">Horaires exceptionnels</div>
    </div>
    <div class="tab-content active" id="tab-habituels">
      <div id="horaires-habituels"></div>
    </div>
    <div class="tab-content" id="tab-exceptionnels">
      <div class="exception-controls">
        <strong>Plage de dates :</strong>
<input type="text" class="date flatpickr-input" id="exception-start" placeholder="JJ/MM/AAAA"> au
<input type="text" class="date flatpickr-input" id="exception-end" placeholder="JJ/MM/AAAA">
<br>
<button type="button" id="ajouter-exception" style="margin-top: 0.5rem;">+ Ajouter une exception</button>

      </div>
      <div id="exceptions-list"></div>
    </div>
  `;

  // === Logique complète du module ===
  flatpickr.localize(flatpickr.l10ns.fr);

  flatpickr("#exception-start", {
    dateFormat: "d/m/Y",
    locale: "fr",
    allowInput: true,
    defaultDate: null,
    onOpen(selectedDates, dateStr, instance) {
      if (!instance.input.value) {
        const now = new Date();
        instance.setDate(now, true);
      }
    }
  });

  flatpickr("#exception-end", {
    dateFormat: "d/m/Y",
    locale: "fr",
    allowInput: true,
    defaultDate: null,
    onOpen(selectedDates, dateStr, instance) {
      if (!instance.input.value) {
        const now = new Date();
        instance.setDate(now, true);
      }
    }
  });



  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
    });
  });

  const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const horairesContainer = document.getElementById("horaires-habituels");
  jours.forEach(jour => creerBlocJour(jour, horairesContainer));

window.moduleHorairesReady = true;
  document.dispatchEvent(new Event("moduleHorairesReady"));

    document.getElementById("ajouter-exception").addEventListener("click", () => {
    const startInput = document.getElementById("exception-start");
    const endInput = document.getElementById("exception-end");
    const start = flatpickr.parseDate(startInput.value, "d/m/Y");
    const end = flatpickr.parseDate(endInput.value, "d/m/Y");

    if (!start || !end || start > end) return alert("Veuillez renseigner une plage de dates valide");

    const formatFR = dateObj => dateObj.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });

    const container = document.createElement("div");
    container.className = "exception-container";
    const range = document.createElement("div");
    range.innerHTML = `<strong>Exception du ${formatFR(start)} au ${formatFR(end)}</strong>
      <button onclick='this.parentNode.parentNode.remove()'>Supprimer</button>`;
    container.appendChild(range);

    const horaires = document.createElement("div");
    horaires.className = "horaires-exceptions";
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      const jour = current.toLocaleDateString("fr-FR", {
        weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
      });
      creerBlocJour(jour, horaires, true);
      current.setDate(current.getDate() + 1);
    }

    container.appendChild(horaires);
    document.getElementById("exceptions-list").appendChild(container);
    startInput.value = "";
    endInput.value = "";
  });

// Partie 2 : récupération Supabase
  const token = (await window.supabase.auth.getSession()).data.session.access_token;

  const res = await fetch(`${window.config.SUPABASE_FUNCTION_BASE}/get-pharmacie`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const fullData = await res.json();
  const data = fullData.records?.[0];
  if (!data?.id) {
    console.error("❌ ID pharmacie introuvable");
    return;
  }

  pharmacieId = data.id;
  console.log("✅ ID pharmacie :", pharmacieId);

  // Hydratation
  if (data.fields?.horaires) {
    await attendreModulePret();

    // ✅ Attendre DOM prêt
    await new Promise(resolve => {
      const check = () => {
        const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
        const tousLesConteneursSontPrets = jours.every(jour =>
          document.querySelector(`[data-jour="${jour}"] .plages`)
        );
        if (tousLesConteneursSontPrets) return resolve();
        setTimeout(check, 50);
      };
      check();
    });

    console.log("✅ Hydratation du module avec les données :", data.fields.horaires);
function attendreModulePretEtHydrater(horaires) {
  if (window.moduleHorairesReady) {
    console.log("✅ Module prêt, on hydrate");
    hydrateModuleFromJson(horaires);
  } else {
    console.warn("⏳ Module pas encore prêt, on attend...");
    document.addEventListener("moduleHorairesReady", () => {
      console.log("🟢 moduleHorairesReady détecté (via event)");
      hydrateModuleFromJson(horaires);
    }, { once: true });
  }
}




// 💡 Utilisation
attendreModulePretEtHydrater(JSON.parse(data.fields.horaires));
  }

      // Navigation avec sauvegarde
document.getElementById("prevBtn").addEventListener("click", async () => {
  await enregistrerHoraires();
  window.location.href = "rib.html"; // 🔁 ou autre page précédente
});

document.getElementById("nextBtn").addEventListener("click", async () => {
  await enregistrerHoraires();
  window.location.href = "formation.html"; // 🔁 ou page suivante
});
  
});






let pharmacieId = null; // accessible globalement dans ce fichier







function collectHoraires() {
  const result = { habituels: {}, exceptionnels: [] };

  // Horaires habituels
  document.querySelectorAll("#horaires-habituels .jour-container").forEach(container => {
    const jour = container.dataset.jour;
    const ouvert24h = container.querySelector("input.ouvert24hCheck")?.checked || false;
    const freq = container.querySelector("select.frequence")?.value || "toutes";
    const plages = [];

    container.querySelectorAll(".plage").forEach(plage => {
      const inputs = plage.querySelectorAll("input.heure");
      plages.push({ debut: inputs[0].value, fin: inputs[1].value });
    });

    const ouvert = ouvert24h || plages.length > 0;
    result.habituels[jour] = { ouvert_24h: ouvert24h, plages, frequence: freq, ouvert };
  });

  // Horaires exceptionnels
  document.querySelectorAll("#exceptions-list .exception-container").forEach(container => {
    const titre = container.querySelector("strong")?.textContent || "";
    const match = titre.match(/du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/);
    if (!match) return;
    const debut = match[1];
    const fin = match[2];

    const jours = {};
    container.querySelectorAll(".jour-container").forEach(jourContainer => {
      const jour = jourContainer.dataset.jour;
      const ouvert24h = jourContainer.querySelector("input.ouvert24hCheck")?.checked || false;
      const plages = [];
      jourContainer.querySelectorAll(".plage").forEach(plage => {
        const inputs = plage.querySelectorAll("input.heure");
        plages.push({ debut: inputs[0].value, fin: inputs[1].value });
      });
      jours[jour] = { ouvert_24h: ouvert24h, plages };
    });

    result.exceptionnels.push({ debut, fin, jours });
  });

  return result;
}



function enregistrerHoraires() {
  const data = collectHoraires();
  console.log("➡️ Données à enregistrer :", data);
  // Retourne la promesse pour permettre d'attendre la fin de l'enregistrement
  return sauvegarderDansAirtable(data, true); // true = affichage du message "Enregistrement réussi"
}


async function sauvegarderDansAirtable(data, afficherMessage = false) {
  const payload = {
    id: pharmacieId,
    fields: { horaires: JSON.stringify(data) }

  };
  console.log("📦 Payload envoyé à Supabase :", payload);

  try {
    const token = (await window.supabase.auth.getSession()).data.session.access_token;
    console.log('🔑 Token extrait :', token ? token.slice(0, 5) + '…' : 'absent');
    const res = await fetch(`${window.config.SUPABASE_FUNCTION_BASE}/update-pharmacie`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Erreur HTTP ${res.status} ${errText}`);
    }

    const json = await res.json();
    console.log("✅ Enregistrement réussi via Supabase :", json);
    if (json.error) {
      console.error("❌ Erreur retournée par Supabase :", json.error);
    }
    if (afficherMessage) alert("✅ Enregistrement effectué !");
  } catch (err) {
    console.error(err);
    if (afficherMessage) alert("❌ Erreur lors de l'enregistrement");
  }
}




// Pour que le bouton fonctionne même si le script est en module
window.enregistrerHoraires = enregistrerHoraires;



function attendreModulePret() {
  return new Promise(resolve => {
    const check = () => {
      if (window.moduleHorairesReady) {
        console.log("🟢 moduleHorairesReady détecté");
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}
