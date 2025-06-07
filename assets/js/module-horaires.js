// module-horaires.js

// Inject styles
const style = document.createElement('style');
style.textContent = `
#module-horaires { max-width: 1000px; margin: 2rem auto; font-family: 'Segoe UI', sans-serif; }
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

// Inject HTML structure
const container = document.getElementById("module-horaires");
if (container) {
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

  
// ✅ Correction de la case à cocher "Ouvert 24h/24"
document.addEventListener("change", (e) => {
  if (e.target && e.target.classList.contains("toggle-24h")) {
    const container = e.target.closest(".jour-container");
    const plages = container.querySelector(".plages");
    const actions = container.querySelector(".actions");
    const status = container.querySelector(".ferme");
    if (e.target.checked) {
      plages.style.display = "none";
      actions.style.display = "none";
      status.style.display = "none";
    } else {
      if (plages.children.length > 0) {
        plages.style.display = "block";
        actions.style.display = "block";
        status.style.display = "none";
      } else {
        plages.style.display = "none";
        actions.style.display = "none";
        status.style.display = "block";
      }
    }
  }
});

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
      check24h = document.createElement("input");
      check24h.type = "checkbox";
      check24h.className = "ouvert24hCheck";
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
    div.querySelector("button").onclick = () => div.remove();
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
