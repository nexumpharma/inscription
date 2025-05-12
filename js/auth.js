// js/auth.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function checkAndRestoreSessionFromURL() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  return params;
}

export async function logout() {
  await supabase.auth.signOut();
  alert("Déconnecté.");
  window.location.href = "infos.html";
}
