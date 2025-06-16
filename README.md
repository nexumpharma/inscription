# Inscription

## Configuration locale

Le fichier `assets/js/config.template.js` fournit un exemple de configuration Supabase.
Pour faire fonctionner l'application en local, copiez ce fichier vers `assets/js/config.js`
(en dehors du contrôle de version) et renseignez les valeurs suivantes :

```javascript
const config = {
  SUPABASE_URL: '<votre url Supabase>',
  SUPABASE_KEY: '<votre clef Supabase>',
  SUPABASE_FUNCTION_BASE: '<url de base des fonctions Supabase>'
};
```

Ce fichier est ignoré par Git (voir `.gitignore`).

