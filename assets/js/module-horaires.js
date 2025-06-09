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

function hydrateModuleFromJson(horairesJson) {
  console.log("🚀 Début de l'hydratation du module...");
  console.log("✅ hydrateModuleFromJson appelée avec :", horairesJson);

  if (!horairesJson) {
    console.warn("❌ Aucune donnée à hydrater !");
    return;
  }

  // --- HABITUELS ---
  const jours = Object.keys(horairesJson.habituels || {});
  console.log("📆 Hydratation des horaires habituels :", jours);

  jours.forEach(jour => {
    const info = horairesJson.habituels[jour];
    console.log(`➡️ Jour : ${jour}`, info);

    const container = document.querySelector(`.jour-container[data-jour="${jour}"]`);
    if (!container) {
      console.warn(`⚠️ Conteneur introuvable pour ${jour}`);
      return;
    }

    if (info.ouvert) {
      console.log(`✅ ${jour} est ouvert`);

      const initBtn = container.querySelector(".init-ajouter");
      if (initBtn) {
        initBtn.remove();
        console.log("🧹 Bouton '+ Ajouter une plage' retiré");
      }

      const status = container.querySelector(".ferme");
      if (status) {
        status.remove();
        console.log("🧹 Étiquette 'Fermé' retirée");
      }

      creerBlocJour(jour, container, true);
      console.log("🧱 Bloc jour recréé");

      for (const plage of info.plages || []) {
        console.log(`➕ Plage ajoutée : ${plage.debut} - ${plage.fin}`);
        ajouterPlage(jour, plage.debut, plage.fin, info.frequence || "toutes");
      }

      const checkbox = container.querySelector(".ouvert24hCheck");
      if (checkbox) {
        checkbox.checked = !!info.ouvert_24h;
        console.log("🕛 Checkbox 'Ouvert 24h/24' cochée :", checkbox.checked);
      }

      const select = container.querySelector(".frequence");
      if (select && info.frequence) {
        select.value = info.frequence;
        console.log("🔁 Fréquence définie :", info.frequence);
      }
    } else {
      console.log(`❌ ${jour} est fermé`);
    }
  });

  // --- EXCEPTIONNELS ---
  const exceptionnels = horairesJson.exceptionnels || [];
  console.log("📆 Hydratation des horaires exceptionnels :", exceptionnels);

  for (const exception of exceptionnels) {
    const { debut: start, fin: end, jours: journees } = exception;
    console.log(`📅 Exception du ${start} au ${end}`, journees);

    if (!start || !end) {
      console.warn("⚠️ Exception ignorée : dates manquantes");
      continue;
    }

    const startInput = document.getElementById("date-exception-start");
    const endInput = document.getElementById("date-exception-end");

    startInput.value = start;
    endInput.value = end;

    document.getElementById("ajouter-exception").click();
    console.log("➕ Exception ajoutée à l'UI");

    const lastContainer = document.querySelector("#exceptions-list > .exception-container:last-child");

    if (!lastContainer) {
      console.warn("❌ Conteneur d'exception non trouvé !");
      continue;
    }

    for (const jour of Object.keys(journees)) {
      const info = journees[jour];
      const jourContainer = lastContainer.querySelector(`.jour-container[data-jour="${jour}"]`);

      if (!jourContainer) {
        console.warn(`⚠️ Jour ${jour} introuvable dans le conteneur d'exception`);
        continue;
      }

      console.log(`🧩 Hydratation du jour ${jour} (exceptionnel)`, info);

      const initBtn = jourContainer.querySelector(".init-ajouter");
      if (initBtn) initBtn.remove();

      const status = jourContainer.querySelector(".ferme");
      if (status) status.remove();

      creerBlocJour(jour, jourContainer, true);

      for (const plage of info.plages || []) {
        console.log(`➕ (Exceptionnel) ${jour} : ${plage.debut} - ${plage.fin}`);
        ajouterPlage(jour, plage.debut, plage.fin, info.frequence || "toutes", jourContainer);
      }

      const checkbox = jourContainer.querySelector(".ouvert24hCheck");
      if (checkbox) {
        checkbox.checked = !!info.ouvert_24h;
        console.log("🕛 (Exceptionnel) Checkbox 'Ouvert 24h/24' cochée :", checkbox.checked);
      }

      const select = jourContainer.querySelector(".frequence");
      if (select && info.frequence) {
        select.value = info.frequence;
        console.log("🔁 (Exceptionnel) Fréquence définie :", info.frequence);
      }
    }
  }

  console.log("✅ Hydratation terminée !");
}

window.hydrateModuleFromJson = hydrateModuleFromJson;


// 👉 Tu peux maintenant continuer avec le reste de ton module (injection HTML, Flatpickr, creerBlocJour, makePlage, etc.)
// Assure-toi simplement d’appeler scheduleAutoSave() après chaque action utilisateur qui modifie les horaires.


// Inject HTML structure
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("module-horaires");
  if (!container) return;

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
        <input type="text" class="date" id="date-exception-start" placeholder="JJ/MM/AAAA"> au
        <input type="text" class="date" id="date-exception-end" placeholder="JJ/MM/AAAA">
        <button type="button" id="ajouter-exception">+ Ajouter une exception</button>
      </div>
      <div id="exceptions-list"></div>
    </div>
  `;

  // === Logique complète du module ===
  flatpickr.localize(flatpickr.l10ns.fr);

  flatpickr("#date-exception-start", {
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

  flatpickr("#date-exception-end", {
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

  function makePlage(container, debut = "", fin = "") {
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
    return div;
  }

  document.getElementById("ajouter-exception").addEventListener("click", () => {
    const startInput = document.getElementById("date-exception-start");
    const endInput = document.getElementById("date-exception-end");
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

  window.moduleHorairesReady = true;

});

let pharmacieId = null; // accessible globalement dans ce fichier

document.addEventListener("DOMContentLoaded", async () => {
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
  hydrateModuleFromJson(data.fields.horaires);
}

});





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
