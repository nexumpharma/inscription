// assets/js/infos.js

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("pharmacyForm");
  const status = document.querySelector(".status");
  const statusContainer = document.querySelector(".status-container");
  const logoutBtn = document.querySelector(".logoutBtn");

  let recordId = null;

  const { user, token } = await initAuthPage();
  if (!user) return;

  // Récupération des données existantes
  const res = await fetch(`${window.config.SUPABASE_FUNCTION_BASE}/get-pharmacie`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const record = (await res.json()).records?.[0];

  if (record) {
    recordId = record.id;
    for (const [key, value] of Object.entries(record.fields)) {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = value;
        if (
          value?.trim().toLowerCase() === user.email.trim().toLowerCase() &&
          (key === "Mail du titulaire" || key === "Mail de la pharmacie")
        ) {
          input.disabled = true;
          input.title = key === "Mail du titulaire"
            ? "Ce champ ne peut pas être modifié car il correspond à votre mail de connexion. Pour le modifier, vous devez vous connecter avec le mail de la pharmacie."
            : "Ce champ ne peut pas être modifié car il correspond à votre mail de connexion. Pour le modifier, vous devez vous connecter avec le mail du titulaire.";
        
          // Ajout d'un champ hidden pour que la valeur soit envoyée dans FormData
          const hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          hiddenInput.name = input.name;
          hiddenInput.value = input.value;
          form.appendChild(hiddenInput);
        }
      }
    }
  } else {
    status.textContent += " | Aucune donnée trouvée. Veuillez remplir le formulaire.";
  }

  form.style.display = "block";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(form));
    const errors = [];

    form.querySelectorAll(".error-message").forEach(e => e.remove());
    form.querySelectorAll(".error").forEach(e => e.classList.remove("error"));

    const regex = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      telPortable: /^0[67]\d{8}$/,
      telFixe: /^0\d{9}$/,
      finess: /^(\d{9}|2[abAB]\d{7})$/,
      codePostal: /^\d{5}$/
    };

    const invalidate = (field, message) => {
      const el = form.querySelector(`[name="${field}"]`);
      if (el) {
        el.classList.add("error");
        const span = document.createElement("span");
        span.className = "error-message";
        span.textContent = message;
        el.parentElement.appendChild(span);
      }
      errors.push(message);
    };

    // Nettoyage
    formData["Mail du titulaire"] = formData["Mail du titulaire"]?.trim().toLowerCase();
    formData["Mail de la pharmacie"] = formData["Mail de la pharmacie"]?.trim().toLowerCase();

    // Validation
    if (!regex.email.test(formData["Mail du titulaire"])) {
      invalidate("Mail du titulaire", "Email du titulaire invalide");
    }
    if (!regex.email.test(formData["Mail de la pharmacie"])) {
      invalidate("Mail de la pharmacie", "Email de la pharmacie invalide");
    }
    if (!regex.telPortable.test(formData["Portable du titulaire"])) {
      invalidate("Portable du titulaire", "Portable invalide");
    }
    if (!regex.telFixe.test(formData["Téléphone de la pharmacie"])) {
      invalidate("Téléphone de la pharmacie", "Téléphone invalide");
    }

    
const cip = formData["CIP"]?.trim();
if (cip) {
  if (/^\d{7}$/.test(cip)) {
    const base = cip.slice(0, 6).split("").map(Number);
    const key = parseInt(cip[6], 10);
    const sum = base.reduce((acc, d, i) => acc + d * (6 - i), 0);
    const check = sum % 11;
    if (check === 10) {
      invalidate("CIP", "CIP invalide : la clé ne peut être 10");
    } else if (check !== key) {
      invalidate("CIP", `CIP invalide (clé attendue : ${check})`);
    }
  } else {
    invalidate("CIP", "Le CIP doit contenir 7 chiffres");
  }
}


    const finess = formData["FINESS"]?.trim();
    if (finess && !regex.finess.test(finess)) {
      invalidate("FINESS", "Numéro FINESS invalide");
    }

    const siren = formData["SIREN"]?.trim();
    if (siren && /^\d{9}$/.test(siren)) {
      const key = siren.split('').reverse().reduce((acc, d, i) => {
        let n = parseInt(d, 10);
        if (i % 2 === 1) n *= 2;
        if (n > 9) n -= 9;
        return acc + n;
      }, 0) % 10;
      if (key !== 0) {
        invalidate("SIREN", "SIREN invalide : clé de contrôle incorrecte");
      }
    } else {
      invalidate("SIREN", "Le SIREN doit comporter 9 chiffres");
    }

    if (!regex.codePostal.test(formData["Code postal"])) {
      invalidate("Code postal", "Code postal invalide");
    }

    if (errors.length > 0) {
      form.querySelector(".error")?.focus();
      return;
    }

    const saveRes = await fetch(`${window.config.SUPABASE_FUNCTION_BASE}/update-pharmacie`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: recordId, fields: formData })
    });

    if (saveRes.ok) {
      window.location.href = "contrat.html";
    } else {
      alert("❌ Une erreur est survenue lors de l'enregistrement.");
    }
  });
});
