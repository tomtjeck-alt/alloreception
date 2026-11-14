// Réglages du site Allo Réception.
// Toutes ces valeurs sont PUBLIQUES par conception (visibles dans le navigateur).
// Ne jamais mettre ici la clé « service_role » de Supabase ni une clé Stripe/Vapi secrète.
window.ALLO_CONFIG = {
  // --- Espace client (Supabase) ---
  supabaseUrl: "https://gippffybbnhbnrxqwlla.supabase.co",
  supabaseCleAnon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpcHBmZnliYm5oYm5yeHF3bGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1ODU3MjEsImV4cCI6MjExMDE2MTcyMX0.lyqQI2B70m6LC1c0DLShbMZCs0EP7JvrePkhGLSnmno",   // clé publique « anon » (rôle vérifié : anon)

  // --- Formulaire de devis (page Contact) ---
  // Clé gratuite : https://web3forms.com → entrer contact@alloreception.ca → la clé arrive par courriel.
  // Tant que c'est "A_REMPLACER", le formulaire ouvre le logiciel de courriel du visiteur à la place.
  web3formsCle: "A_REMPLACER",

  // --- Bouton « Réserver un appel » (page Contact) ---
  // Lien de votre page Cal.com, ex. https://cal.com/alloreception/15min
  // Tant que c'est "A_REMPLACER", le bouton est caché.
  calLien: "A_REMPLACER",

  // --- Mesure d'audience (GoatCounter, gratuit, sans pub) ---
  // Créez un compte sur https://www.goatcounter.com, ex. code « alloreception ».
  // Lancée SEULEMENT si le visiteur accepte les témoins.
  goatcounterCode: "A_REMPLACER"
};
