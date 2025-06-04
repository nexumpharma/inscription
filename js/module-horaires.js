// === Inject styles ===
const style = document.createElement('style');
style.textContent = `body { font-family: 'Segoe UI', sans-serif; margin: 2rem; max-width: 1000px; }
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
    .jour-container { border: 1px solid #eee; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; }
    .plage { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
    .plage input.heure { width: 120px; }
    .actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
    .ferme { color: #999; font-style: italic; margin: 0.5rem 0; }
    button {
      cursor: pointer; padding: 0.4rem 0.8rem;
      border: 1px solid #333; background: #fff; border-radius: 4px;
    }
    button:hover { background: #f0f0f0; }
    label.toggle {
      display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;
    }
    .exception-container {
      border: 1px solid #ccc;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 6px;
    }
    .exception-controls {
      margin-bottom: 1rem;
    }
    .exception-container input[type="date"],
    .exception-container input[type="text"].date {
      margin-right: 0.5rem;
    }`;
document.head.appendChild(style);

// === Inject HTML content ===
const container = document.getElementById('module-horaires');
container.innerHTML = `<h1>Configuration des horaires</h1><div class="tabs">
<div class="tab-button active" data-tab="habituels">Horaires habituels</div>
<div class="tab-button" data-tab="exceptionnels">Horaires exceptionnels</div>
</div><div class="tab-content active" id="tab-habituels">
<div id="horaires-habituels"></div>
</div><div class="tab-content" id="tab-exceptionnels">
<div class="exception-controls">
<strong>Plage de dates :</strong>
<input class="date" id="date-exception-start" placeholder="JJ/MM/AAAA" type="text"/> au 
    <input class="date" id="date-exception-end" placeholder="JJ/MM/AAAA" type="text"/>
<button onclick="ajouterException()">+ Ajouter une exception</button>
</div>
<div id="exceptions-list"></div>
</div><script>
  document.addEventListener("DOMContentLoaded", () => {
    flatpickr.localize(flatpickr.l10ns.fr);

    // Initialisation des flatpickr date pour les dates exceptionnelles avec placeholder et valeur par défaut vide
    const fpStart = flatpickr("#date-exception-start", {
      dateFormat: "d/m/Y",
      locale: "fr",
      allowInput: true,
      defaultDate: null, // pas de date par défaut
      onOpen: function(selectedDates, dateStr, instance) {
  if (!instance.input.value) {
    const now = new Date();
    const jour = String(now.getDate()).padStart(2, "0");
    const mois = String(now.getMonth() + 1).padStart(2, "0");
    const annee = now.getFullYear();
    instance.setDate(`${jour}/${mois}/${annee}`, true, "d/m/Y");
  }
}
    });

    const fpEnd = flatpickr("#date-exception-end", {
      dateFormat: "d/m/Y",
      locale: "fr",
      allowInput: true,
      defaultDate: null,
      onOpen: function(selectedDates, dateStr, instance) {
  if (!instance.input.value) {
    const now = new Date();
    const jour = String(now.getDate()).padStart(2, "0");
    const mois = String(now.getMonth() + 1).padStart(2, "0");
    const annee = now.getFullYear();
    instance.setDate(`${jour}/${mois}/${annee}`, true, "d/m/Y");
  }
}
    });

    // Flatpickr pour heures habituels (sera aussi utilisé pour les nouvelles plages)
    function initFlatpickrHeure(input) {
      return flatpickr(input, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        locale: "fr",
        allowInput: true,
        defaultDate: null,
        onOpen: function(selectedDates, dateStr, instance) {
          // Au focus, si champ vide, pré-remplit avec 12:00 (heure par défaut)
          if (!instance.input.value) {
            instance.setDate("12:00", true, "H:i");
          }
        }
      });
    }

    // Gestion onglets
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(\`tab-${button.dataset.tab}\`).classList.add('active');
      });
    });

    const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const horairesContainer = document.getElementById("horaires-habituels");
    jours.forEach(jour => creerBlocJour(jour, horairesContainer));

    // Fonction qui crée un bloc jour, paramètre isException pour savoir si on est dans les exceptionnels
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
        freqLabel.innerHTML = \`Semaine : <select class='frequence'>
          <option value='toutes'>Toutes les semaines</option>
          <option value='paire'>Semaines paires</option>
          <option value='impaire'>Semaines impaires</option>
        </select>\`;

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

      if (check24h) {
        check24h.addEventListener("change", () => {
          if (check24h.checked) {
            plages.innerHTML = \`<div class='ferme'>Ouvert 24h/24</div>\`;
            plages.style.display = "block";
            actions.style.display = "none";
            if (advancedOptions) advancedOptions.style.display = "none";
            container.appendChild(toggle24h);
          } else {
            plages.innerHTML = "";
            plages.style.display = "none";
            actions.style.display = "none";
            if (advancedOptions) {
              advancedOptions.style.display = "none";
              advancedOptions.open = false;
              const freqSelect = advancedOptions.querySelector("select.frequence");
              if (freqSelect) freqSelect.value = "toutes";
              check24h.checked = false;
              if (!advancedOptions.contains(toggle24h)) advancedOptions.appendChild(toggle24h);
            }
            const status = document.createElement("div");
            status.className = "ferme";
            status.textContent = "Fermé";
            const initBtn = document.createElement("button");
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
            container.innerHTML = "";
            container.append(title, status, initBtn, plages, actions);
            if (advancedOptions) container.appendChild(advancedOptions);
          }
        });
      }

      const initBtn = document.createElement("button");
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

    // Fonction pour créer une plage horaire
    function makePlage(container, debut = "", fin = "") {
      const div = document.createElement("div");
      div.className = "plage";

      // Inputs avec placeholder HH:MM
      div.innerHTML = \`
        <input type='text' class='heure' value='${debut}' placeholder="HH:MM"> 
        <span>à</span> 
        <input type='text' class='heure' value='${fin}' placeholder="HH:MM"> 
        <button type='button' title="Supprimer cette plage">❌</button>
      \`;

      // Suppression plage
      div.querySelector("button").onclick = () => {
        div.remove();
        const plages = container.querySelector(".plages");
        const actions = container.querySelector(".actions");
        const check24h = container.querySelector(".ouvert24hCheck");
        const advancedOptions = container.querySelector("details");
        if (plages.children.length === 0) {
          plages.style.display = "none";
          actions.style.display = "none";
          plages.innerHTML = "";
          if (advancedOptions) {
            advancedOptions.style.display = "none";
            advancedOptions.open = false;
            const freqSelect = advancedOptions.querySelector("select.frequence");
            if (freqSelect) freqSelect.value = "toutes";
            if (check24h) check24h.checked = false;
          }
          const status = document.createElement("div");
          status.className = "ferme";
          status.textContent = "Fermé";
          const initBtn = document.createElement("button");
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
          container.innerHTML = "";
          const title = document.createElement("h3");
          title.textContent = container.dataset.jour || "";
          container.append(title, status, initBtn, plages, actions);
          if (advancedOptions) container.appendChild(advancedOptions);
        }
      };

      // Initialisation flatpickr pour chaque input heure avec focus pour auto-remplissage 12:00 si vide
      const timeInputs = div.querySelectorAll(".heure");
      timeInputs.forEach(input => {
        initFlatpickrHeure(input);
      });

      return div;
    }

    // Fonction pour ajouter une exception (plage de dates)
    window.ajouterException = function () {
      const startInput = document.getElementById("date-exception-start");
      const start = flatpickr.parseDate(startInput.value, "d/m/Y");
      const endInput = document.getElementById("date-exception-end");
      const end = flatpickr.parseDate(endInput.value, "d/m/Y");
      if (!start || !end || start > end) return alert("Veuillez renseigner une plage de dates valide");

      const formatFR = dateObj => dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const container = document.createElement("div");
      container.className = "exception-container";

      const range = document.createElement("div");
      range.innerHTML = \`<strong>Exception du ${formatFR(start)} au ${formatFR(end)}</strong> <button onclick='this.parentNode.parentNode.remove()'>Supprimer</button>\`;
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

      // Réinitialiser les champs date exceptionnels
      startInput.value = "";
      endInput.value = "";
    }

  });
</script>`;

// === Execute Module Logic ===
