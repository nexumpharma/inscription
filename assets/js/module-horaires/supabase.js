// Utilise window.supabase qui est déjà initialisé globalement

async function getAuthToken() {
  try {
    const { data } = await window.supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch (err) {
    console.error("❌ Erreur récupération token :", err);
    return null;
  }
}

async function getPharmacie() {
  const token = await getAuthToken();
  if (!token) return { id: null, horaires: null };

  try {
    const res = await fetch(`${window.config.SUPABASE_FUNCTION_BASE}/get-pharmacie`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const fullData = await res.json();
    const record = fullData.records?.[0];
    if (!record?.id || !record?.fields?.horaires) {
      console.warn("❌ Données incomplètes reçues :", fullData);
      return { id: null, horaires: null };
    }

    return { id: record.id, horaires: record.fields.horaires };
  } catch (err) {
    console.error("❌ Erreur getPharmacie :", err);
    return { id: null, horaires: null };
  }
}

window.getAuthToken = getAuthToken;
window.getPharmacie = getPharmacie;

