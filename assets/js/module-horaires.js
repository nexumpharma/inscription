// module-horaires.js

// DOM Ready
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

// DOM Ready

document.addEventListener("DOMContentLoaded", async () => {
  const moduleWrapper = document.getElementById("moduleContainer");
  const { user } = await initAuthPage();
  if (!user) return;

  moduleWrapper.style.display = "block";

  const container = document.getElementById("module-horaires");
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
  flatpickr("#date-exception-start", { dateFormat: "d/m/Y", locale: "fr", allowInput: true });
  flatpickr("#date-exception-end", { dateFormat: "d/m/Y", locale: "fr", allowInput: true });

  function initFlatpickrHeure(input) {
    return flatpickr(input, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: true,
      locale: "fr",
      allowInput: true,
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

  document.getElementById("ajouter-exception").addEventListener("click", () => {
    const startInput = document.getElementById("date-exception-start");
    const endInput = document.getElementById("date-exception-end");
    const start = flatpickr.parseDate(startInput.value, "d/m/Y");
    const end = flatpickr.parseDate(endInput.value, "d/m/Y");

    if (!start || !end || start > end) return alert("Veuillez renseigner une plage de dates valide");

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

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "+ Ajouter une plage";
  addBtn.onclick = () => {
    plages.appendChild(makePlage(container));
    plages.style.display = "block";
    actions.style.display = "flex";
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
  };

  container.append(title, status, initBtn, plages, actions);
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

  div.querySelectorAll(".heure").forEach(input => initFlatpickrHeure(input));
  div.querySelector("button").onclick = () => div.remove();
  return div;
}
