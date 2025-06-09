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
  display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;
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
    // Réaffiche le bouton init si besoin
// Réaffiche le texte "Fermé"
let status = container.querySelector('.ferme');
if (!status) {
  status = document.createElement("div");
  status.className = "ferme";
  status.textContent = "Fermé";
}
container.insertBefore(status, container.querySelector('.plages'));

    const initBtn = document.createElement("button");
    initBtn.type = "button";
    initBtn.textContent = "+ Ajouter une plage";
    initBtn.onclick = () => {
      initBtn.remove();
      if (status) status.remove();
      container.querySelector('.plages').appendChild(makePlage(container));
      container.querySelector('.plages').style.display = "block";
      container.querySelector('.actions').style.display = "flex";

      const advanced = container.querySelector("details");
      if (advanced) {
        advanced.style.display = "block";
        advanced.open = false;
      }
    };
    container.insertBefore(initBtn, container.querySelector('.plages'));

    // Cache le bloc options avancées
    const advanced = container.querySelector("details");
    if (advanced) {
      advanced.style.display = "none";
      advanced.open = false;
    }

    // Réinitialise le champ semaine
    const freq = container.querySelector("select.frequence");
    if (freq) {
      freq.value = "toutes";
    }

    // Réinitialise la case 24h
    const check24 = container.querySelector("input.ouvert24hCheck");
    if (check24) {
      check24.checked = false;
    }

    // Cache les actions (boutons + Ajouter une plage)
    container.querySelector('.actions').style.display = "none";
    container.querySelector('.plages').style.display = "none";
  }
};

    div.querySelectorAll(".heure").forEach(input => initFlatpickrHeure(input));
 
    console.log("🧱 makePlage retourne :", div.outerHTML);
       return div;
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

  // Si aucune plage n’existe, on montre le bouton init pour en ajouter
const actions = container.querySelector(".actions");
const details = container.querySelector("details");

// Cas particulier : ouvert 24h/24
if (data.ouvert_24h) {
  boutonInit.style.display = "none";
  actions.style.display = "none";
  if (details) details.style.display = "none";
} else {
  const hasPlages = data.plages && data.plages.length > 0;
  boutonInit.style.display = hasPlages ? "none" : "inline-block";
  actions.style.display = hasPlages ? "flex" : "none";

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
      checkbox24h.checked = !!data.ouvert_24h;
      checkbox24h.dispatchEvent(new Event("change")); // pour déclencher le bon comportement
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
  }

// EXCEPTIONNELS
console.log("📆 Hydratation des horaires exceptionnels :", exceptionnels);

for (const item of exceptionnels) {
  const startInput = document.getElementById("exception-start");
  const endInput = document.getElementById("exception-end");
  if (!startInput || !endInput) {
    console.warn("❌ Impossible d'hydrater les exceptionnels, inputs manquants");
    continue;
  }

  // Remplit les dates puis simule un clic sur "Ajouter la période"
  startInput.value = item.debut;
  endInput.value = item.fin;
  document.querySelector("#add-exception-button")?.click();

  // ⏱ Laisser le temps au DOM de générer les conteneurs exceptionnels
  setTimeout(async () => {
for (const [jourComplet, details] of Object.entries(item.jours)) {
  const jourKey = jourComplet.split(" ")[0];
  const normalizedKey = jourKey.charAt(0).toUpperCase() + jourKey.slice(1).toLowerCase();

  // Simule l’ajout d’un bloc pour ce jour
  document.querySelector("#add-exception-button")?.click();

  // Donne un court délai au DOM pour créer le conteneur
  await new Promise(resolve => setTimeout(resolve, 50));

  const container = document.querySelector(`.jour-container[data-jour="${normalizedKey}"]:last-of-type`);

      if (!container) {
        console.warn(`❌ Pas de conteneur exceptionnel trouvé pour ${jourKey}`);
        continue;
      }

      console.log(`🔁 Exceptionnel ${jourKey} - ${jourComplet}`, details);

      const boutonInit = container.querySelector(".init-ajouter");
      const checkbox24h = container.querySelector(".ouvert24hCheck");

      boutonInit.style.display = "inline-block";
      container.querySelector(".actions").style.display = "block";
      container.querySelector("details").style.display = "block";

      if (checkbox24h) {
        checkbox24h.checked = !!details.ouvert_24h;
        checkbox24h.dispatchEvent(new Event("change"));
      }

      if (details.plages && details.plages.length > 0) {
        details.plages.forEach(({ debut, fin }) => {
          console.log(`➕ Ajout exception ${debut} - ${fin} pour ${jourKey}`);
          ajouterPlage(jourKey, debut, fin, container);
        });
      }
    }
  }, 100); // ou 50ms si le DOM est rapide
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
    initBtn = document.createElement("button");
    initBtn.type = "button";
    initBtn.className = "init-ajouter";
    initBtn.textContent = "+ Ajouter une plage";
    initBtn.onclick = () => {
      initBtn.remove();
      status.remove();
      plages.appendChild(makePlage(container));
      plages.style.display = "block";
      actions.style.display = "flex";
      if (advanced) {
        advanced.style.display = "block";
        advanced.open = false;
      }
    };
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

    const initBtn = document.createElement("button");
    initBtn.type = "button";
    initBtn.textContent = "+ Ajouter une plage";
    initBtn.className = "init-ajouter";

    initBtn.onclick = () => {
      initBtn.remove();
      status.remove();
      plages.appendChild(makePlage(container));
      plages.style.display = "block";
      actions.style.display = "flex";
      if (advancedOptions) {
        advancedOptions.style.display = "block";
        advancedOptions.open = false;
      }
    };

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
        <input type="text" class="date" id="exception-start" placeholder="JJ/MM/AAAA"> au
        <input type="text" class="date" id="exception-end" placeholder="JJ/MM/AAAA">
        <button type="button" id="ajouter-exception">+ Ajouter une exception</button>
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
  sauvegarderDansAirtable(data, true); // true = affichage du message "Enregistrement réussi"
}


async function sauvegarderDansAirtable(data, afficherMessage = false) {
  const payload = {
    id: pharmacieId,
    fields: { horaires: JSON.stringify(data) }

  };
  console.log("📦 Payload envoyé à Supabase :", payload);

  const token = (await window.supabase.auth.getSession()).data.session.access_token;

  fetch(`${window.config.SUPABASE_FUNCTION_BASE}/update-pharmacie`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) throw new Error("Erreur HTTP " + res.status);
      return res.json();
    })
    .then(json => {
      console.log("✅ Enregistrement réussi via Supabase :", json);
      if (json.error) {
        console.error("❌ Erreur retournée par Supabase :", json.error);
      }
      if (afficherMessage) alert("✅ Enregistrement effectué !");
    })
    .catch(err => {
      console.error("❌ Erreur update-pharmacie :", err);
      if (afficherMessage) alert("❌ Erreur lors de l'enregistrement");
    });
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



