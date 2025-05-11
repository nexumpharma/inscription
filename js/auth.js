const SUPABASE_URL = 'https://nywocoxkfdrsscvnvjas.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55d29jb3hrZmRyc3Njdm52amFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTA1MDgsImV4cCI6MjA2MjQ2NjUwOH0.Gj2TOFLghSlztKgZiUzrdnntH5oNPKs8RALG8fGvSm4';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAndRestoreSessionFromURL() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
