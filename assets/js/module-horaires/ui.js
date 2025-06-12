import { makePlage } from './plages.js';
import { joursSemaine } from './utils.js'; // ["Lundi", "Mardi", ...]
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { French } from "flatpickr/dist/l10n/fr.js";

flatpickr.localize(French);

export async function injectUI() {
  const container = document.getElementById("module-horaires");
  if (!container) {
    console.error("❌ Élément #module-horaires introuvable");
    return;
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
        <br>
        <button type="button" id="ajouter-exception" style="margin-top: 0.5rem;">+ Ajouter une exception</button>
      </div>
      <div id="exceptions-list"></div>
    </div>
  `;

  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
    });
  });

  joursSemaine.forEach(jour => {
    const container = document.getElementById("horaires-habituels");
    creerBlocJour(jour, container, false);
  });

  // Init Flatpickr pour les exceptions
  flatpickr("#exception-start", {
    dateFormat: "d/m/Y",
    allowInput: true,
    defaultDate: null,
  });

  flatpickr("#exception-end", {
    dateFormat: "d/m/Y",
    allowInput: true,
    defaultDate: null,
  });

  window.moduleHorairesReady = true;
  document.dispatchEvent(new Event("moduleHorairesReady"));
}

export function attendreModulePret() {
  return new Promise(resolve => {
    if (window.moduleHorairesReady) return resolve();
    document.addEventListener("moduleHorairesReady", resolve, { once: true });
  });
}

// ↓↓↓ Tu vas compléter ou extraire ça dans un fichier à part (ex: blocs.js)

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
  addBtn.addEventListener("click", () => {
    plages.appendChild(makePlage(container));
    plages.style.display = "block";
    actions.style.display = "flex";
  });

  actions.appendChild(addBtn);

  container.append(title, status, plages, actions);
  parentContainer.appendChild(container);
}
