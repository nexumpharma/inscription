import flatpickr from "flatpickr";
import { French } from "flatpickr/dist/l10n/fr.js";
flatpickr.localize(French);

export function initFlatpickrHeure(input) {
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

export function makePlage(container, debut = "", fin = "") {
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
      // Réaffiche "Fermé" si plus aucune plage
      let status = container.querySelector('.ferme');
      if (!status) {
        status = document.createElement("div");
        status.className = "ferme";
        status.textContent = "Fermé";
      }
      container.insertBefore(status, container.querySelector('.plages'));

      // Réaffiche bouton initial
      const initBtn = document.createElement("button");
      initBtn.type = "button";
      initBtn.textContent = "+ Ajouter une plage";
      initBtn.className = "init-ajouter";
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

      // Réinitialise options
      const advanced = container.querySelector("details");
      if (advanced) {
        advanced.style.display = "none";
        advanced.open = false;
      }

      const freq = container.querySelector("select.frequence");
      if (freq) freq.value = "toutes";

      const check24 = container.querySelector("input.ouvert24hCheck");
      if (check24) check24.checked = false;

      container.querySelector('.actions').style.display = "none";
      container.querySelector('.plages').style.display = "none";
    }
  };

  div.querySelectorAll(".heure").forEach(input => initFlatpickrHeure(input));
  return div;
}

export function ajouterPlage(jour, debut, fin, container = null) {
  const jourContainer = container || document.querySelector(`.jour-container[data-jour="${jour}"]`);
  if (!jourContainer) return;

  const plagesContainer = jourContainer.querySelector(".plages");
  const node = makePlage(jourContainer, debut, fin);
  plagesContainer.appendChild(node);

  plagesContainer.style.display = "block";
  const actions = jourContainer.querySelector(".actions");
  if (actions) actions.style.display = "flex";
}
