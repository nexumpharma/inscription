// assets/js/rib.js

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("ribForm");
  const ribFileInput = document.getElementById("ribFile");
  const ibanInput = document.getElementById("iban");
  const ribPreview = document.getElementById("ribPreview");

  const { user, token } = await initAuthPage();
  if (!user) return;

  const config = window.config;
  const supabase = window.supabase;
  let recordId = null;
  let ribStoragePath = "";

  function invalide(champ, msg) {
    const el = form.querySelector(`[name="${champ}"], [id="${champ}"]`);
    if (el) {
      el.classList.add("error");
      const span = document.createElement("span");
      span.className = "error-message";
      span.textContent = msg;
      el.parentElement.appendChild(span);
    }
  }

  function sanitizeFilename(filename) {
    return filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.\-]/g, "_");
  }

  async function waitForSignedUrl(path, maxTries = 10, delayMs = 1000) {
    for (let i = 0; i < maxTries; i++) {
      const { data } = await supabase.storage.from("pharmacie").createSignedUrl(path.replace(/^\/+/, ""), 3600);
      if (data?.signedUrl) return data.signedUrl;
      await new Promise(res => setTimeout(res, delayMs));
    }
    throw new Error("Lien signé indisponible après plusieurs tentatives.");
  }

  async function displayPreview(path, type) {
    try {
      const url = await waitForSignedUrl(path);
      ribPreview.innerHTML = "";
      if (type === "application/pdf") {
        ribPreview.innerHTML = `<embed src="${url}" type="application/pdf" width="100%" height="500px" />`;
      } else {
        const img = document.createElement("img");
        img.src = url;
        ribPreview.appendChild(img);
      }
    } catch (err) {
      console.error("Erreur de preview :", err);
    }
  }

  function formatIban(value) {
    return value.replace(/\s+/g, "").toUpperCase().match(/.{1,4}/g)?.join(" ") || "";
  }

  function isValidIBAN(iban) {
    const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
    const regex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
    if (!regex.test(cleanIban)) return false;
    const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
    const numericIban = rearranged.replace(/[A-Z]/g, ch => (ch.charCodeAt(0) - 55));
    return BigInt(numericIban) % 97n === 1n;
  }

  async function uploadFile(file) {
    if (file.size > 5 * 1024 * 1024) {
      invalide("ribFile", "Le fichier dépasse 5 Mo");
      return null;
    }

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const base64File = reader.result.split(",")[1];
        const timestamp = Date.now();
        const cleanName = sanitizeFilename(file.name);
        const filename = `rib/${timestamp}-${cleanName}`;
        const type = file.type;

        try {
          const res = await fetch(`${config.SUPABASE_FUNCTION_BASE}/upload-rib`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ base64File, filename })
          });

          const json = await res.json();

          if (res.ok && json?.path) {
            ribStoragePath = json.path;
            await displayPreview(ribStoragePath, type);
            resolve({ path: ribStoragePath, type });
          } else {
            reject(json);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  async function saveDataAndNavigate(targetPage) {
    form.querySelectorAll(".error, .error-message").forEach(el => {
      el.classList.remove("error");
      if (el.classList.contains("error-message")) el.remove();
    });

    const file = ribFileInput.files[0];
    const iban = ibanInput.value.trim().replace(/\s+/g, '');
    let hasError = false;

    if (file && file.size > 5 * 1024 * 1024) {
      invalide("ribFile", "Fichier trop volumineux");
      hasError = true;
    }

    if (iban && !isValidIBAN(iban)) {
      invalide("iban", "IBAN invalide");
      hasError = true;
    }

    if (hasError) return;

    const res = await fetch(`${config.SUPABASE_FUNCTION_BASE}/update-pharmacie`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: recordId,
        fields: {
          IBAN: iban,
          "Chemin RIB": ribStoragePath
        }
      })
    });

    if (res.ok) {
      window.location.href = targetPage;
    } else {
      alert("❌ Erreur lors de l'enregistrement.");
    }
  }

  ribFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await uploadFile(file);
      ibanInput.value = "";
    } catch {
      invalide("ribFile", "❌ Erreur lors de l'envoi du fichier.");
    }
  });

  ibanInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    e.target.value = formatIban(value);
  });

  document.getElementById("prevBtn").addEventListener("click", () => saveDataAndNavigate("contrat.html"));
  document.getElementById("nextBtn").addEventListener("click", () => saveDataAndNavigate("horaires.html"));

  // 🔄 Chargement des données initiales
  let record;
  try {
    const recordRes = await fetch(`${config.SUPABASE_FUNCTION_BASE}/get-pharmacie`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    record = await recordRes.json();
  } catch (err) {
    console.error("❌ Exception fetch() :", err.message);
    alert(`❌ Erreur lors du chargement : ${err.message}`);
    return;
  }

  const fields = record?.records?.[0]?.fields;
  recordId = record?.records?.[0]?.id;

  if (fields?.IBAN) ibanInput.value = formatIban(fields.IBAN);
  if (fields?.["Chemin RIB"]) {
    ribStoragePath = fields["Chemin RIB"];
    const type = ribStoragePath.endsWith(".pdf") ? "application/pdf" : "image/*";
    await displayPreview(ribStoragePath, type);
  }

  form.style.removeProperty("display");
});
