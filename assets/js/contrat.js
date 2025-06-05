// assets/js/contrat.js

document.addEventListener("DOMContentLoaded", async () => {
  const signButton = document.getElementById("sign-button");
  const statusText = document.getElementById("status");
  const actionButtons = document.getElementById("action-buttons");

  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const step4 = document.getElementById("step4");
  const progress = document.getElementById("progress");

  const { user, token } = await initAuthPage();
  if (!user) return;

  function normalizeUrl(url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return "https://" + url;
    }
    return url;
  }

  const record = await fetch(`${config.SUPABASE_FUNCTION_BASE}/get-pharmacie`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());

  const fields = record?.records?.[0]?.fields;
  const recordId = record?.records?.[0]?.id;

  if (!fields || !recordId) {
    step2.className = "step visible error";
    return;
  }

  const existingLink = fields["Lien contrat"];
  const contratId = fields["Contrat ID"];

  if (existingLink && contratId) {
    const signUrl = normalizeUrl(existingLink);

    const statusRes = await fetch(`${config.SUPABASE_FUNCTION_BASE}/get-signature-status`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ objectId: contratId })
    });

    const statusData = await statusRes.json();

    if (statusRes.ok && statusData?.status === "completed") {
      // ✅ Contrat déjà signé
      progress.innerHTML = "<p><strong>✅ Contrat déjà signé.</strong></p>";
      signButton.querySelector("button").textContent = "Voir le contrat signé";
      signButton.href = signUrl;
      signButton.style.display = "inline-block";
      actionButtons.style.display = "flex";
      return;
    }

    // 🔁 Contrat pas encore signé mais généré
    step2.style.display = "none";
    step3.style.display = "none";
    step4.className = "step visible done";
    signButton.href = signUrl;
    signButton.style.display = "inline-block";
    actionButtons.style.display = "flex";
    return;
  }

  // 📝 Pas encore généré → lancement du process
  step2.className = "step visible pending";

  const pdfRes = await fetch(`${config.SUPABASE_FUNCTION_BASE}/trigger-google-pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  const pdfData = await pdfRes.json();
  if (!pdfRes.ok || !pdfData?.success) {
    step2.className = "step visible error";
    return;
  }

  step2.className = "step visible done";
  step3.className = "step visible pending";

  const recipient = {
    email: fields["Mail du titulaire"] || user.email,
    name: `${fields["Prénom"] || "Titulaire"} ${fields["Nom"] || ""}`.trim(),
    phone: fields["Portable du titulaire"] || ""
  };

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

  const signData = await signRes.json();
  const openSignUrl =
    signData?.iframeUrl ||
    signData?.openSignResponse?.signurl?.[0]?.url ||
    null;

  const docId = signData?.documentId || null;

  if (signRes.ok && openSignUrl && docId) {
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
  } else {
    step3.className = "step visible error";
    step4.className = "step visible error";
  }
});

