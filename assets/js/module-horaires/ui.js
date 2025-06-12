import { makePlage } from './plages.js';
import { joursSemaine } from './utils.js'; // ["Lundi", "Mardi", ...]
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { French } from "flatpickr/dist/l10n/fr.js";

flatpickr.localize(French);

export function injectHorairesStyles() {
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
.plage { display: flex; gap: 1rem; margin-bottom: 0.5rem; align-items: center; }
.ferme { color: #777; font-style: italic; margin: 0.5rem 0; }
.toggle { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
.actions { margin-top: 1rem; }
details { margin-top: 1rem; }
details summary { cursor: pointer; font-weight: bold; }
.button-container {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}
  `;
  document.head.appendChild(style);
}

export async function injectUI() {
  injectHorairesStyles();

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

  flatpickr("#exception-start", { dateFormat: "d/m/Y" });
  flatpickr("#exception-end", { dateFormat: "d/m/Y" });
}
