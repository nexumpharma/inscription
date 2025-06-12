async function getAuthToken() {
  const session = await window.supabase.auth.getSession();
  return session?.data?.session?.access_token || null;
}

function collectHoraires() {
  const result = { habituels: {}, exceptionnels: [] };

  // ➕ Horaires habituels
  document.querySelectorAll("#horaires-habituels .jour-container").forEach(container => {
    const jour = container.dataset.jour;
    const ouvert24h = container.querySelector("input.ouvert24hCheck")?.checked || false;
    const frequence = container.querySelector("select.frequence")?.value || "toutes";

    const plages = [];
    container.querySelectorAll(".plage").forEach(plage => {
      const [debutInput, finInput] = plage.querySelectorAll("input.heure");
      plages.push({ debut: debutInput.value, fin: finInput.value });
    });

    const ouvert = ouvert24h || plages.length > 0;
    result.habituels[jour] = {
      ...(ouvert ? { plages } : {}),
      ouvert_24h: ouvert24h,
      frequence
    };
  });

  // ➕ Horaires exceptionnels
  document.querySelectorAll("#exceptions-list .exception-container").forEach(container => {
    const titre = container.querySelector("strong")?.textContent || "";
    const match = titre.match(/du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/);
    if (!match) return;
    const [_, debut, fin] = match;

    const jours = {};
    container.querySelectorAll(".jour-container").forEach(jourContainer => {
      const jour = jourContainer.dataset.jour;
      const ouvert24h = jourContainer.querySelector("input.ouvert24hCheck")?.checked || false;

      const plages = [];
      jourContainer.querySelectorAll(".plage").forEach(plage => {
        const [debutInput, finInput] = plage.querySelectorAll("input.heure");
        plages.push({ debut: debutInput.value, fin: finInput.value });
      });

      jours[jour] = { ouvert_24h: ouvert24h, plages };
    });

    result.exceptionnels.push({ debut, fin, jours });
  });

  return result;
}

async function enregistrerHoraires(pharmacieId) {
  const data = collectHoraires();
  const horairesJSON = JSON.stringify(data);
  console.log("📝 Données collectées :", data);

  const token = await getAuthToken();
  if (!token || !pharmacieId) {
    console.error("❌ Token ou ID pharmacie manquant");
    return;
  }

  const payload = {
    id: pharmacieId,
    fields: { horaires: horairesJSON }
  };

  try {
    const res = await fetch(`${window.config.SUPABASE_FUNCTION_BASE}/update-pharmacie`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Erreur HTTP ${res.status}`);
    console.log("✅ Enregistrement Supabase réussi :", json);
    const statusDiv = document.getElementById("save-status");
    if (statusDiv) {
      statusDiv.style.display = "block";
      setTimeout(() => statusDiv.style.display = "none", 3000);
    }

  } catch (err) {
    console.error("❌ Erreur lors de l'enregistrement :", err);
    alert("❌ Erreur lors de l'enregistrement des horaires");
  }
}

async function getPharmacie() {
  const { data: user } = await window.supabase.auth.getUser();
  if (!user || !user.user) {
    console.warn("❌ Utilisateur introuvable");
    return {};
  }

  const email = user.user.email;
  const { data, error } = await window.supabase
    .from("pharmacies")
    .select("id, horaires")
    .eq("email", email)
    .maybeSingle();

  if (error || !data) {
    console.warn("❌ Aucune pharmacie trouvée pour :", email);
    return {};
  }

  return { id: data.id, horaires: data.horaires };
}

// ✅ Export global explicite
window.collectHoraires = collectHoraires;
window.enregistrerHoraires = enregistrerHoraires;
window.getPharmacie = getPharmacie;
