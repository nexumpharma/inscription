//penser à refacto l'auth

const supabase = window.supabase;
const SUPABASE_FUNCTION_BASE = window.config.SUPABASE_FUNCTION_BASE;
const DEBUG = false;
function debug(...args) { if (DEBUG) console.log(...args); }
const logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "connexion.html";
};


const signButton = document.getElementById("sign-button");
const statusContainer = document.getElementById("status-container");
const statusText = document.getElementById("status");
const logoutBtn = document.getElementById("logoutBtn");
const actionButtons = document.getElementById("action-buttons");

const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const step4 = document.getElementById("step4");

function normalizeUrl(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

function setStepStatus(stepElement, status) {
  // Cacher toutes les étapes sauf celle-ci
  [step2, step3, step4].forEach(step => {
    if (step !== stepElement) {
      step.classList.remove("visible", "pending", "done", "error");
    }
  });

  // Afficher l'étape cible avec le bon statut
  stepElement.classList.add("visible");
  stepElement.classList.remove("pending", "done", "error");
  if (status) stepElement.classList.add(status);

  debug(`⏱ Étape [${stepElement.id}] → ${status}`);
}


async function run() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    window.location.href = "connexion.html";
    return;
  }

  const session = await supabase.auth.getSession();
  const token = session.data.session.access_token;

  statusText.innerHTML = `✅ Connecté en tant que <strong>${user.email}</strong>`;
  statusContainer.style.display = "flex";
  logoutBtn.style.display = "inline-block";

  let record;
  try {
    const recordRes = await fetch(`${SUPABASE_FUNCTION_BASE}/get-pharmacie`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    record = await recordRes.json();
  } catch (err) {
    console.error("❌ Exception fetch() :", err.message);
    alert(`❌ Impossible de récupérer les informations : ${err.message}`);
    return;
  }

  const fields = record?.records?.[0]?.fields;
  const recordId = record?.records?.[0]?.id;

  if (!fields || !recordId) {
    setStepStatus(step2, "error");
    return;
  }

  const existingLink = fields["Lien contrat"];
  const contratId = fields["Contrat ID"];

  if (existingLink && contratId) {
    const signUrl = normalizeUrl(existingLink);

    const statusRes = await fetch(`${SUPABASE_FUNCTION_BASE}/get-signature-status`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ objectId: contratId })
    });

    const statusData = await statusRes.json();

    if (statusRes.ok && statusData?.status === "completed") {
setStepStatus(step2, "done");
step2.innerHTML = "✅ Contrat déjà signé.";
signButton.textContent = "📄 Voir le contrat signé"; // au lieu de querySelector
signButton.href = signUrl;
signButton.style.display = "inline-block";
actionButtons.style.display = "flex";
      return;
    }

    step2.style.display = "none";
    step3.style.display = "none";
    setStepStatus(step4, "done");
    signButton.href = signUrl;
    signButton.style.display = "inline-block";
    actionButtons.style.display = "flex";
    return;
  }

  setStepStatus(step2, "pending");

  const pdfRes = await fetch(`${SUPABASE_FUNCTION_BASE}/trigger-google-pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  const pdfData = await pdfRes.json();
  if (!pdfRes.ok || !pdfData?.success) {
    setStepStatus(step2, "error");
    return;
  }

  setStepStatus(step2, "done");
  setStepStatus(step3, "pending");

  const recipient = {
    email: fields["Mail du titulaire"] || user.email,
    name: `${fields["Prénom"] || "Titulaire"} ${fields["Nom"] || ""}`.trim(),
    phone: fields["Portable du titulaire"] || ""
  };

  const signRes = await fetch(`${SUPABASE_FUNCTION_BASE}/create-signature-from-pdf`, {
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
    await fetch(`${SUPABASE_FUNCTION_BASE}/update-pharmacie`, {
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

    setStepStatus(step3, "done");
    setStepStatus(step4, "done");
    signButton.href = normalizeUrl(openSignUrl);
    signButton.style.display = "inline-block";
    actionButtons.style.display = "flex";
    signButton.textContent = "🖊️ Signer le contrat";

  } else {
    setStepStatus(step3, "error");
    setStepStatus(step4, "error");
  }
}

logoutBtn.addEventListener("click", logout);
run();
