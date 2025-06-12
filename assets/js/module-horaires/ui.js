// Utilisation en mode UMD
const makePlage = window.makePlage;
const joursSemaine = window.joursSemaine;

// Flatpickr global (via <script> non-ESM)
if (window.flatpickr && window.flatpickr.l10ns) {
  window.flatpickr.localize(window.flatpickr.l10ns.fr);
}




function injectHorairesStyles() {
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

async function injectUI() {
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

if (window.flatpickr) {
  window.flatpickr("#exception-start", { dateFormat: "d/m/Y" });
  window.flatpickr("#exception-end", { dateFormat: "d/m/Y" });
}
}

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
    toggle24h.style.marginBottom = "1rem";
    toggle24h.dataset.alone = "false";

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
        status.textContent = "Ouvert 24h/24";
        plages.innerHTML = "";
        plages.style.display = "none";
        actions.style.display = "none";
        if (initBtn) initBtn.style.display = "none";
        if (advanced) advanced.style.display = "none";
        if (freq) freq.value = "toutes";
        if (toggle24h.dataset.alone !== "true") {
          container.appendChild(toggle24h);
          toggle24h.dataset.alone = "true";
        }
      } else {
        status.textContent = "Fermé";
        plages.style.display = "none";
        actions.style.display = "none";
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
  initBtn.className = "init-ajouter";
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

window.injectUI = injectUI;
window.creerBlocJour = creerBlocJour;
