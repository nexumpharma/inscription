// module-horaires.js - Version complète avec options "Fermé", "24h/24", semaine paire/impaire

// Inject styles dynamiquement
const style = document.createElement("style");
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
.plage { display: flex; gap: 1rem; margin-bottom: 0.5rem; align-items: center; }
.plage input.heure { width: 100px; }
.plage select.frequence { margin-left: auto; }
.actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
.ferme { color: #999; font-style: italic; margin: 0.5rem 0; }
label.toggle { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
.exception-container {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 6px;
}
.exception-controls { margin-bottom: 1rem; }
.exception-container input[type="text"].date { margin-right: 0.5rem; }
`;
document.head.appendChild(style);

function initFlatpickrHeure(input) {
  return flatpickr(input, {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    locale: "fr",
    allowInput: true
  });
}

function makePlage(container, debut = "", fin = "") {
  const div = document.createElement("div");
  div.className = "plage";
  div.innerHTML = `
    <input type='text' class='heure' value='${debut}' placeholder="HH:MM">
    <span>à</span>
    <input type='text' class='heure' value='${fin}' placeholder="HH:MM">
    <select class="frequence">
      <option value="toutes">Toutes</option>
      <option value="paire">Semaines paires</option>
      <option value="impaire">Semaines impaires</option>
    </select>
    <button type='button' title="Supprimer cette plage">❌</button>
  `;
  div.querySelectorAll(".heure").forEach(input => initFlatpickrHeure(input));
  div.querySelector("button").onclick = () => div.remove();
  return div;
}

function creerBlocJour(jour, parentContainer, isException = false) {
  const container = document.createElement("div");
  container.className = "jour-container";
  container.dataset.jour = jour;

  const title = document.createElement("h3");
  title.textContent = jour;

  const status = document.createElement("div");
  status.className = "ferme";
  status.textContent = "Fermé";

  const plages = document.createElement("div");
  plages.className = "plages";
  plages.style.display = "none";

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.style.display = "none";

  const btnAdd = document.createElement("button");
  btnAdd.textContent = "+ Ajouter une plage";
  btnAdd.onclick = () => {
    plages.appendChild(makePlage(container));
    plages.style.display = "block";
    actions.style.display = "flex";
  };

  const checkboxFermeture = document.createElement("label");
  checkboxFermeture.className = "toggle";
  checkboxFermeture.innerHTML = `<input type="checkbox" class="ferme-checkbox"> Fermé ce jour-là`;

  const checkbox24h = document.createElement("label");
  checkbox24h.className = "toggle";
  checkbox24h.innerHTML = `<input type="checkbox" class="ouvert24h-checkbox"> Ouvert 24h/24`;

  const updateState = () => {
    const isFerme = checkboxFermeture.querySelector("input").checked;
    const is24h = checkbox24h.querySelector("input").checked;
    if (isFerme) {
      plages.innerHTML = "";
      plages.style.display = "none";
      actions.style.display = "none";
      status.textContent = "Fermé";
    } else if (is24h) {
      plages.innerHTML = "";
      plages.style.display = "none";
      actions.style.display = "none";
      status.textContent = "Ouvert 24h/24";
    } else {
      plages.style.display = plages.children.length ? "block" : "none";
      actions.style.display = plages.children.length ? "flex" : "none";
      status.textContent = "";
    }
  };

  checkboxFermeture.querySelector("input").addEventListener("change", updateState);
  checkbox24h.querySelector("input").addEventListener("change", updateState);

  actions.appendChild(btnAdd);

  container.append(title, status, checkboxFermeture, checkbox24h, plages, actions);
  parentContainer.appendChild(container);
}

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  if (typeof flatpickr === "undefined") return console.warn("flatpickr non chargé");

  const form = document.getElementById("horairesForm");
  if (form) form.style.display = "block";

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

  flatpickr.localize(flatpickr.l10ns.fr);
  const pickerStart = flatpickr("#date-exception-start", {
    dateFormat: "d/m/Y",
    locale: "fr",
    allowInput: true
  });
  const pickerEnd = flatpickr("#date-exception-end", {
    dateFormat: "d/m/Y",
    locale: "fr",
    allowInput: true
  });

  const parseDate = pickerStart.config.parseDate;

  document.querySelectorAll(".tab-button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });

  const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const horairesContainer = document.getElementById("horaires-habituels");
  jours.forEach(jour => creerBlocJour(jour, horairesContainer));

  document.getElementById("ajouter-exception").addEventListener("click", () => {
    const startInput = document.getElementById("date-exception-start");
    const endInput = document.getElementById("date-exception-end");
    const start = parseDate(startInput.value, "d/m/Y");
    const end = parseDate(endInput.value, "d/m/Y");

    if (!start || !end || start > end) {
      alert("Veuillez renseigner une plage de dates valide");
      return;
    }

    const formatFR = d => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

    const container = document.createElement("div");
    container.className = "exception-container";
    const range = document.createElement("div");
    range.innerHTML = `<strong>Exception du ${formatFR(start)} au ${formatFR(end)}</strong>
      <button onclick='this.parentNode.parentNode.remove()'>Supprimer</button>`;
    container.appendChild(range);

    const horaires = document.createElement("div");
    horaires.className = "horaires-exceptions";
    let current = new Date(start);
    while (current <= end) {
      const jour = current.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
      creerBlocJour(jour, horaires, true);
      current.setDate(current.getDate() + 1);
    }

    container.appendChild(horaires);
    document.getElementById("exceptions-list").appendChild(container);
    startInput.value = "";
    endInput.value = "";
  });
});
