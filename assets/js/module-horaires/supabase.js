// module-horaires/supabase.js
(function() {
  // Initialisation du client Supabase avec l’URL et la clé depuis config.js
  const { createClient } = supabase;
  window.supabase = createClient(
    window.config.supabaseUrl,
    window.config.supabaseKey
  );

  // Wrapper pour appeler la fonction cloud "get-pharmacie"
  window.getPharmacie = async function() {
    const resp = await fetch(
      `${window.config.functionsUrl}/get-pharmacie`,
      {
        headers: {
          Authorization: `Bearer ${window.config.token}`
        }
      }
    );
    if (!resp.ok) {
      throw new Error(`Erreur get-pharmacie: ${resp.status}`);
    }
    return resp.json();
  };
})();
