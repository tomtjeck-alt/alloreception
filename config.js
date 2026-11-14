// Connexion au serveur Allo Réception (Supabase).
// Ces deux valeurs sont PUBLIQUES par conception : la sécurité vient des règles
// de la base de données. Ne jamais mettre ici la clé « service_role » ni une clé Stripe/Vapi.
window.ALLO_CONFIG = {
  supabaseUrl: "A_REMPLACER",        // ex. https://abcdefgh.supabase.co
  supabaseCleAnon: "A_REMPLACER"     // clé « anon » / « publishable »
};
