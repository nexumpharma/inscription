// assets/js/contrat.js
document.addEventListener("DOMContentLoaded", async () => {
  const signButton = document.getElementById("sign-button");
  const statusText = document.getElementById("status");
  const actionButtons = document.getElementById("action-buttons");

  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const step4 = document.getElementById("step4");

  const config = window.config;
  const supabase = window.supabase;

  const normalizeUrl = url =>
    url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  // 🔐 Authentification
  const { user, token } = await initAuthPage();
  if (!user) return;

  // 📄 Récupération des données pharmacie
  let record;
  try {
    const res = await fetch(`${config.SUPABASE_FUNCTION_BASE}/get-pharmacie`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    record = await res.json();
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des données pharmacie", err);
    step2.className = "step visible error";
    return;
  }

  const fields = record?.records?.[0]?.fields;
  const recordId = record?.records?.[0]?.id;

  if (!fields || !recordId) {
    console.error("❌ Données pharmacie manquantes");
    step2.className = "step visible error";
    return;
  }

  const existingLink = fields["Lien contrat"];
  const contratId = fields["Contrat ID"];

  console.log("📄 Lien contrat existant :", existingLink);
  console.log("📄 Contrat ID :", contratId);

  // ✅ Contrat déjà généré
  if (existingLink && contratId) {
    const signUrl = normalizeUrl(existingLink);
    console.log("🔗 Lien normalisé :", signUrl);

    try {
      const statusRes = await fetch(`${config.SUPABASE_FUNCTION_BASE}/get-signature-status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ objectId: contratId })
      });

      const statusData = await statusRes.json();
      console.log("📄 Résultat get-signature-status :", statusData);

      if (statusRes.ok && statusData?.status === "completed") {
        document.getElementById("progress").innerHTML = "<p><strong>✅ Contrat déjà signé.</strong></p>";
        signButton.textContent = "Voir le contrat signé";
        signButton.href = signUrl;
        signButton.style.display = "inline-block";
        actionButtons.style.display = "flex";
        return;
      }

      // Si non signé
      console.log("⏳ Contrat en attente de signature...");
      step2.style.display = "none";
      step3.style.display = "none";
      step4.className = "step visible done";
      signButton.href = signUrl;
      signButton.style.display = "inline-block";
      actionButtons.style.display = "flex";
      return;

    } catch (err) {
      console.error("❌ Erreur lors de la vérification du statut de signature", err);
      step2.className = "step visible error";
      return;
    }
  }

  // 📝 Génération du PDF
  step2.className = "step visible pending";

  let pdfData;
  try {
    const pdfRes = await fetch(`${config.SUPABASE_FUNCTION_BASE}/trigger-google-pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields })
    });
    pdfData = await pdfRes.json();

    if (!pdfRes.ok || !pdfData?.success) {
      throw new Error("Réponse PDF invalide");
    }

    console.log("🧾 PDF généré :", pdfData);
  } catch (err) {
    console.error("❌ Erreur lors de la génération du PDF", err);
    step2.className = "step visible error";
    return;
  }

  step2.className = "step visible done";
  step3.className = "step visible pending";

  // ✍️ Signature
  const recipient = {
    email: fields["Mail du titulaire"] || user.email,
    name: `${fields["Prénom"] || "Titulaire"} ${fields["Nom"] || ""}`.trim(),
    phone: fields["Portable du titulaire"] || ""
  };

  let signData;
  try {
    const signRes = await fetch(`${config.SUPABASE_FUNCTION_BASE}/create-signature-from-pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pdfBase64: pdfData.pdfBase64,
        recipient
      })
    });

    signData = await signRes.json();
    console.log("✍️ Signature créée :", signData);

    const openSignUrl =
      signData?.iframeUrl ||
      signData?.openSignResponse?.signurl?.[0]?.url ||
      null;

    const docId = signData?.documentId || null;

    if (!signRes.ok || !openSignUrl || !docId) {
      throw new Error("Lien ou ID de signature manquant");
    }

    // 📬 Mise à jour Airtable
    await fetch(`${config.SUPABASE_FUNCTION_BASE}/update-pharmacie`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: recordId,
        fields: {
          "Lien contrat": openSignUrl,
          "Contrat ID": docId
        }
      })
    });

    step3.className = "step visible done";
    step4.className = "step visible done";
    signButton.href = normalizeUrl(openSignUrl);
    signButton.style.display = "inline-block";
    actionButtons.style.display = "flex";

  } catch (err) {
    console.error("❌ Erreur création signature ou mise à jour Airtable", err);
    step3.className = "step visible error";
    step4.className = "step visible error";
  }
});
