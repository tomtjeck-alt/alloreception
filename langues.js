// ===== Sélecteur de langue : Français, Anglais (traduction soignée) + Toutes les langues =====
// Aucun appel externe n'est fait tant que le visiteur reste en FR ou en EN (Loi 25).
(function () {
  var CLE_LANGUE = "allo-langue";
  var LANGUES_AUTRES = [
    ["es", "Español"],
    ["ar", "العربية"],
    ["zh-CN", "中文 (简体)"],
    ["zh-TW", "中文 (繁體)"],
    ["pt", "Português"],
    ["it", "Italiano"],
    ["de", "Deutsch"],
    ["hi", "हिन्दी"],
    ["pa", "ਪੰਜਾਬੀ"],
    ["ur", "اردو"],
    ["bn", "বাংলা"],
    ["ta", "தமிழ்"],
    ["ru", "Русский"],
    ["uk", "Українська"],
    ["pl", "Polski"],
    ["ro", "Română"],
    ["nl", "Nederlands"],
    ["tr", "Türkçe"],
    ["fa", "فارسی"],
    ["ja", "日本語"],
    ["ko", "한국어"],
    ["vi", "Tiếng Việt"],
    ["tl", "Tagalog"],
    ["ht", "Kreyòl ayisyen"],
    ["el", "Ελληνικά"],
    ["sv", "Svenska"]
  ];

  // Dictionnaire exact FR -> EN pour toutes les pages publiques et l'espace client
  var EN = {
    // Navigation & commun
    "Ouvrir le menu": "Open menu",
    "Toutes les langues": "All languages",
    "Accueil": "Home",
    "Solution": "Solution",
    "Vidéos": "Videos",
    "Forfaits": "Pricing",
    "FAQ": "FAQ",
    "Contact": "Contact",
    "Espace client": "Client Portal",
    "Essai gratuit": "Free Trial",
    "Produit": "Product",
    "Aide": "Help",
    "Confidentialité": "Privacy",
    "Gérer les témoins": "Manage cookies",
    "Conditions d'utilisation": "Terms of Service",
    "Politique de confidentialité": "Privacy Policy",
    "La réceptionniste IA des garages et PME de partout au Canada. Bilingue avec les forfaits Pro et Premium.": "The AI receptionist for auto shops and small businesses across Canada. Bilingual with Pro and Premium plans.",
    "© 2026 Allo Réception — Canada ·": "© 2026 Allo Réception — Canada ·",
    "Allo Réception, Ottawa-Gatineau ·": "Allo Réception, Ottawa-Gatineau ·",

    // Bandeau témoins
    "🍪 Témoins (cookies)": "🍪 Cookies",
    "Ce site n'utilise que ce qui est nécessaire à son fonctionnement. Avec votre accord, nous pourrions mesurer les visites de façon anonyme pour améliorer le site.": "This site only uses cookies essential to its operation. With your consent, we may measure visits anonymously to improve the site.",
    "En savoir plus": "Learn more",
    "Refuser": "Decline",
    "Accepter": "Accept",

    // Titres des pages
    "Allo Réception — Réceptionniste IA partout au Canada": "Allo Réception — AI Receptionist Across Canada",
    "La solution — Allo Réception": "The Solution — Allo Réception",
    "Vidéos — Allo Réception": "Videos — Allo Réception",
    "Forfaits — Allo Réception": "Pricing — Allo Réception",
    "Questions fréquentes — Allo Réception": "FAQ — Allo Réception",
    "Contact — Allo Réception": "Contact — Allo Réception",
    "Merci ! — Allo Réception": "Thank You! — Allo Réception",
    "Connexion — Allo Réception": "Sign In — Allo Réception",
    "Installation — Allo Réception": "Setup — Allo Réception",
    "Mon espace — Allo Réception": "My Account — Allo Réception",
    "Conditions d'utilisation — Allo Réception": "Terms of Service — Allo Réception",
    "Politique de confidentialité — Allo Réception": "Privacy Policy — Allo Réception",

    // Page d'accueil (index.html)
    "Réceptionniste IA · Partout au Canada": "AI Receptionist · Across Canada",
    "Ne perdez plus jamais": "Never miss",
    "un appel.": "a call again.",
    "Votre réceptionniste répond": "Your receptionist answers",
    "le soir|la fin de semaine|quand vous êtes sous une voiture|en français et en anglais (Pro et Premium)|les jours fériés": "in the evening|on weekends|while you're under a car|in French and English (Pro & Premium)|on holidays",
    "le soir": "in the evening",
    "Elle répond à vos clients 24 h sur 24, note leurs demandes de rendez-vous et vous envoie un résumé par courriel.": "She answers your customers 24/7, takes down appointment requests, and emails you a summary after every call.",
    "Essai gratuit de 14 jours": "14-day free trial",
    "Voir une démo ▶": "Watch a demo ▶",
    "14 jours ou 40 minutes gratuits · Sans contrat · Installation faite pour vous": "14 days or 40 minutes free · No contract · Done-for-you setup",
    "Exemple d'appel répondu par Allo Réception": "Sample call answered by Allo Réception",
    "Exemple d'appel": "Sample call",
    "En direct ·": "Live ·",
    "Allo · Français": "Allo · Bilingual",
    "Client": "Caller",
    "Bonjour, j'ai une crevaison. Vous êtes ouverts demain ?": "Hi, I have a flat tire. Are you open tomorrow?",
    "Oui, dès 8 h. Je note votre demande pour 8 h 30, le garage vous confirme rapidement.": "Yes, starting at 8 AM. I've noted your request for 8:30 AM—the shop will confirm shortly.",
    "Parfait, merci !": "Great, thank you!",
    "Résultat": "Result",
    "✓ Demande de RDV demain 8 h 30 notée · résumé envoyé par courriel": "✓ Appointment request for tomorrow 8:30 AM noted · summary emailed",
    "24 h/24": "24/7",
    "7 jours sur 7, fériés aussi": "7 days a week, holidays too",
    "FR + EN": "FR + EN",
    "Bilingue avec les forfaits Pro et Premium": "Bilingual with Pro and Premium plans",
    "Résumé": "Summary",
    "Après chaque appel": "After every call",
    "Pour qui": "Who it's for",
    "Garages": "Auto shops",
    "Mécanique": "Mechanics",
    "Pneus": "Tire shops",
    "Carrosserie": "Body shops",
    "Cliniques": "Clinics",
    "Dentistes": "Dentists",
    "Salons": "Salons",
    "Esthétique": "Aesthetics",
    "Plombiers": "Plumbers",
    "Électriciens": "Electricians",
    "Entrepreneurs": "Contractors",
    "PME": "Small Businesses",
    "Coût par mois · Ce que vous payez pour ne rater aucun appel": "Monthly cost · What you pay to never miss a call",
    "Réceptionniste à temps plein": "Full-time receptionist",
    "3 000 $ et plus (salaire)": "$3,000+ (salary)",
    "Allo Réception Premium": "Allo Réception Premium",
    "Allo Réception Pro": "Allo Réception Pro",
    "Allo Réception Essentiel": "Allo Réception Essential",
    "Jusqu'à 15 fois moins cher": "Up to 15x less expensive",
    "qu'une réceptionniste, et disponible la nuit et la fin de semaine.": "than a full-time receptionist, and available nights and weekends.",
    "Le problème": "The problem",
    "Vos problèmes, on les connaît": "We know your daily challenges",
    "Vous êtes sous une voiture quand le téléphone sonne.": "You're under a car when the phone rings.",
    "Le client tombe sur la boîte vocale… et appelle un autre garage.": "The caller hits voicemail… and calls another shop.",
    "Vos clients appellent le soir et la fin de semaine.": "Your customers call in the evening and on weekends.",
    "Une crevaison n'attend pas lundi matin.": "A flat tire doesn't wait until Monday morning.",
    "Vous êtes dérangé toute la journée.": "You get interrupted all day long.",
    "Chaque appel coupe votre travail.": "Every phone call breaks your focus.",
    "Vous perdez des clients anglophones.": "You lose English-speaking customers.",
    "Ou des francophones, selon qui répond.": "Or French-speaking ones, depending on who answers.",
    "Démonstration": "Live demo",
    "Chaque appel se termine avec le travail déjà fait.": "Every call ends with the work already done.",
    "Exemples d'appels": "Call examples",
    "Rendez-vous": "Appointments",
    "Heures et prix": "Hours & pricing",
    "En anglais": "In English",
    "Le soir": "Evening",
    "Exemple": "Example",
    "Appel entrant": "Incoming call",
    "En direct": "Live",
    "Fait automatiquement": "Done automatically",
    "Comment ça marche": "How it works",
    "Prêt en 3 étapes": "Ready in 3 steps",
    "On discute": "We chat",
    "Vous nous donnez vos heures, vos prix et vos services. 15 minutes suffisent.": "You share your hours, prices, and services. 15 minutes is all it takes.",
    "On configure": "We configure",
    "Nous préparons votre réceptionniste pour vous.": "We set up your AI receptionist for you.",
    "Elle répond": "She answers",
    "Vous recevez un résumé de chaque appel.": "You receive a summary after every call.",
    "Calculateur": "Calculator",
    "Combien vous coûtent vos appels manqués ?": "How much are missed calls costing you?",
    "Appels manqués par semaine": "Missed calls per week",
    "Valeur moyenne d'un client ($)": "Average customer value ($)",
    "Hypothèse : 1 appel manqué sur 3 aurait donné un client. Un mois compte 4,3 semaines.": "Assumption: 1 in 3 missed calls would have become a customer. One month = 4.3 weeks.",
    "Revenus perdus chaque mois": "Revenue lost every month",
    "Forfait Pro :": "Pro Plan:",
    "399 $/mois": "$399/mo",
    ", soit environ": ", which is about",
    "11 fois moins": "11x less",
    "Récupérer ces appels": "Recover those calls",
    "Moins cher qu'une seule journée de réceptionniste par semaine": "Costs less than a single day of a receptionist per week",
    "dès 166 $/mois": "from $166/mo",
    "dès 333 $/mois": "from $333/mo",
    "dès 583 $/mois": "from $583/mo",
    "Prix en facturation annuelle : 2 mois gratuits, installation incluse.": "Annual billing pricing: 2 months free, setup included.",
    "Comparer les forfaits →": "Compare plans →",

    // Solution & Vidéos
    "Une réceptionniste qui ne prend jamais de pause": "A receptionist who never takes a break",
    "Allo Réception répond à votre place, avec une voix naturelle. Bilingue avec les forfaits Pro et Premium.": "Allo Réception answers for you with a natural voice. Bilingual with Pro and Premium plans.",
    "Répond à tous les appels": "Answers every call",
    "Jour, nuit, fins de semaine et jours fériés.": "Day, night, weekends, and statutory holidays.",
    "Renseigne vos clients": "Informs your callers",
    "Heures, adresse, prix, services : elle connaît votre entreprise par cœur.": "Hours, address, prices, services: she knows your business by heart.",
    "Note les demandes de rendez-vous": "Notes appointment requests",
    "Le service, le jour et l'heure souhaités vous sont envoyés par courriel. Vous confirmez au client.": "The requested service, day, and time are emailed to you. You confirm with the customer.",
    "Vous envoie un résumé": "Emails you a summary",
    "Qui a appelé, pourquoi, et ce qui a été fait. Par courriel.": "Who called, why, and what was handled—sent straight to your inbox.",
    "Elle répond dans la langue du client, en français ou en anglais.": "She answers in the caller's language, in French or English.",
    "Historique de vos appels": "Call history",
    "Dans votre espace client : chaque appel, sa durée, son résumé et vos minutes du mois.": "In your client portal: every call, its duration, its summary, and your monthly minutes.",
    "Voyez ce que ça change.": "See the difference it makes.",
    "Des appels répondus, des demandes de rendez-vous notées, et un garagiste qui travaille en paix.": "Calls answered, appointment requests noted, and a shop owner working in peace.",

    // Forfaits (forfaits.html)
    "Des prix simples, sans surprise": "Simple, transparent pricing",
    "Tous les forfaits : 14 jours d'essai gratuit (jusqu'à 40 minutes d'appel) et installation incluse, en mensuel comme en annuel.": "Every plan includes a 14-day free trial (up to 40 call minutes) and done-for-you setup, monthly or annual.",
    "Période de facturation": "Billing cycle",
    "Mensuel": "Monthly",
    "Annuel": "Annual",
    "2 mois gratuits": "2 months free",
    "Essentiel": "Essential",
    "Pour ne plus rater d'appel.": "Never miss a call again.",
    "/mois": "/mo",
    "Facturé chaque mois": "Billed monthly",
    "Facturé 1 990 $ par an · 2 mois gratuits": "Billed $1,990/year · 2 months free",
    "200 minutes": "200 minutes",
    "d'appel incluses par mois": "of calls included per month",
    "Carte demandée · 0 $ aujourd'hui": "Card required · $0 today",
    "Une question avant ? Écrivez-nous →": "Have a question first? Write to us →",
    "Réponse aux appels 24/7": "24/7 call answering",
    "Infos sur votre entreprise": "Answers about your business",
    "Résumé des appels par courriel": "Call summaries by email",
    "Le plus populaire": "Most popular",
    "Pro": "Pro",
    "Pour ne manquer aucune demande de rendez-vous.": "Never miss an appointment request.",
    "Facturé 3 990 $ par an · 2 mois gratuits": "Billed $3,990/year · 2 months free",
    "500 minutes": "500 minutes",
    "Tout l'Essentiel": "Everything in Essential",
    "Demandes de rendez-vous notées et envoyées par courriel": "Appointment requests noted and emailed",
    "Bilingue français-anglais": "Bilingual French & English",
    "Premium": "Premium",
    "Pour les entreprises occupées.": "Built for busy businesses.",
    "Facturé 6 990 $ par an · 2 mois gratuits": "Billed $6,990/year · 2 months free",
    "1 000 minutes": "1,000 minutes",
    "Tout le Pro": "Everything in Pro",
    "Le meilleur prix par minute (0,70 $)": "Lowest cost per minute ($0.70)",
    "En vous abonnant, vous acceptez nos": "By subscribing, you agree to our",
    "conditions d'utilisation": "Terms of Service",
    "et notre": "and our",
    "politique de confidentialité": "Privacy Policy",
    "Prix en dollars canadiens, taxes en sus. Sans contrat en mensuel, annulable en tout temps.": "Prices in Canadian dollars, plus applicable taxes. Monthly plans have no contract—cancel anytime.",
    "Options": "Add-ons",
    "Ajoutez seulement ce dont vous avez besoin": "Add only what you need",
    "Minutes supplémentaires": "Extra minutes",
    "Mensuel : 0,35 $ la minute en plus. Annuel : pack de 100 minutes pour 35 $. Votre réceptionniste ne s'arrête jamais de répondre.": "Monthly: $0.35 per extra minute. Annual: 100-minute pack for $35. Your receptionist never stops answering.",
    "Comment ça marche ?": "How does it work?",
    "Mensuel :": "Monthly:",
    "les minutes en plus sont ajoutées à votre prochaine facture.": "extra minutes are added to your next invoice.",
    "Annuel :": "Annual:",
    "un courriel vous prévient à 80 % de vos minutes. Vous ajoutez un pack en un clic, et il n'expire jamais.": "you get an email alert at 80% usage. Add a 100-minute pack in one click—unused pack minutes never expire.",
    "Toutes les minutes épuisées :": "When all minutes are used:",
    "votre réceptionniste prend les messages (nom, numéro, raison de l'appel) jusqu'au mois suivant ou jusqu'à l'ajout d'un pack.": "your receptionist still takes messages (name, number, reason for calling) until next month or until you add a pack.",
    "Vous dépassez souvent ? Le forfait supérieur devient plus avantageux.": "Going over often? Upgrading to the next plan saves you more.",
    "Plusieurs succursales ?": "Multiple locations?",
    "Écrivez-nous": "Write to us",
    ": on prépare une offre sur mesure.": ": we'll put together a custom quote.",
    "Comparer les forfaits en détail": "Compare plans in detail",
    "Fonction": "Feature",
    "Minutes d'appel incluses par mois": "Call minutes included per month",
    "Informations sur votre entreprise (heures, prix, adresse)": "Your business info (hours, pricing, address)",
    "Résumé de chaque appel par courriel": "Email summary after every call",
    "Service bilingue français-anglais": "Bilingual French & English service",
    "Prix par minute incluse": "Cost per included minute",
    "1,00 $": "$1.00",
    "0,80 $": "$0.80",
    "0,70 $": "$0.70",
    "199 $": "$199",
    "399 $": "$399",
    "699 $": "$699",
    "166 $": "$166",
    "333 $": "$333",
    "583 $": "$583",
    "300 $": "$300",
    "4 300 $": "$4,300",
    "11 fois moins": "11x less",
    "moins que vos pertes": "less than your losses",
    "Réponses adaptées à vos consignes": "Answers tailored to your instructions",
    "Minutes en plus et succursales : voir": "Extra minutes & locations: see",
    ". Installation incluse partout.": ". Setup included on all plans.",
    "Questions sur la facturation": "Billing questions",
    "Allo Réception répond gratuitement pendant 14 jours, jusqu'à 40 minutes d'appel (environ 20 appels). L'essai finit à la première de ces deux limites. Pas convaincu ? Vous arrêtez et ne payez rien.": "Allo Réception answers for free for 14 days, up to 40 call minutes (about 20 calls), whichever comes first. Not convinced? Cancel before it ends and pay nothing.",
    "Puis-je changer de forfait ?": "Can I switch plans?",
    "Oui, à tout moment. La différence de prix est facturée tout de suite, au prorata.": "Yes, anytime. The price difference is prorated right away.",
    "Mensuel ou annuel ? Puis-je annuler ?": "Monthly or annual? Can I cancel?",
    "sans contrat, annulable en tout temps et sans frais.": "no contract, cancel anytime at no fee.",
    "vous payez 10 mois et profitez de 12 (2 mois gratuits). L'abonnement est payé d'avance pour 12 mois. Annulé dans les 30 jours suivant le premier paiement, il est remboursé au prorata des jours non utilisés.": "pay for 10 months and get 12 (2 months free). Annual plans are billed upfront for 12 months. Cancelled within 30 days of first payment, unused days are refunded prorata.",
    "Un seul essai gratuit par entreprise.": "One free trial per business.",
    "Que se passe-t-il si je dépasse mes minutes ?": "What happens if I go over my minutes?",
    "Votre réceptionniste continue de répondre. Prix et détails :": "Your receptionist keeps answering. Pricing and details:",
    "Calculer mes appels manqués": "Calculate my missed calls",
    "Fermer": "Close",
    "Aujourd'hui · 0 $": "Today · $0",
    "Votre réceptionniste est installée et répond à vos clients (jusqu'à 40 minutes d'appel).": "Your receptionist is set up and answers your customers (up to 40 call minutes).",
    "Jour 7": "Day 7",
    "On vous envoie un rappel par courriel. Annulez en 1 clic si ça ne vous convient pas.": "We email you a reminder. Cancel in 1 click if it's not for you.",
    "Jour 15": "Day 15",
    "Premier paiement :": "First payment:",
    "(taxes en sus).": "(plus taxes).",
    "J'accepte les": "I accept the",
    "et la": "and the",
    "Cochez la case ci-dessus pour afficher le paiement sécurisé.": "Check the box above to load the secure checkout.",
    "Paiement sécurisé": "Secure checkout",
    "Entrez votre carte, payez 0 $ aujourd'hui": "Enter your card, pay $0 today",
    "Vous serez redirigé vers la page sécurisée de Stripe pour entrer votre carte. Aucun montant n'est prélevé avant la fin de l'essai.": "You will be redirected to Stripe's secure checkout to enter your card. Nothing is charged before your trial ends.",
    "Continuer vers le paiement sécurisé": "Continue to secure checkout",

    // FAQ
    "Questions fréquentes": "Frequently Asked Questions",
    "Vous ne trouvez pas votre réponse ?": "Can't find your answer?",
    "Écrivez-nous.": "Write to us.",
    "Est-ce que mes clients sauront que c'est une IA ?": "Will my customers know it's an AI?",
    "La réceptionniste se présente comme l'assistante virtuelle de votre entreprise. Elle est polie, claire et naturelle.": "The receptionist introduces herself as your business's virtual assistant. She is polite, clear, and natural.",
    "Combien de temps pour l'installer ?": "How long does setup take?",
    "Quelques jours. Nous configurons tout pour vous.": "Just a few days—and for online signups, it's ready in minutes. We handle the setup for you.",
    "Et les données de mes clients ?": "What about my customers' data?",
    "Elles sont traitées avec soin, selon les lois canadiennes : la LPRPDE et, au Québec, la Loi 25.": "Data is handled with care under Canadian privacy laws: PIPEDA and, in Quebec, Law 25.",
    "Notre politique": "Our policy",
    "Comment fonctionne l'essai gratuit ?": "How does the free trial work?",
    "14 jours gratuits, jusqu'à 40 minutes d'appel.": "14 days free, up to 40 call minutes.",
    "Tous les détails": "Full details",
    "Puis-je annuler ?": "Can I cancel?",
    "En mensuel, oui, en tout temps et sans frais. L'annuel est payé d'avance pour 12 mois, remboursable au prorata dans les 30 jours suivant le premier paiement.": "On monthly plans, yes—anytime with no fee. Annual plans are paid upfront for 12 months and prorated-refundable within 30 days of the first payment.",
    "Prêt à ne plus manquer d'appels ?": "Ready to stop missing calls?",
    "14 jours gratuits (jusqu'à 40 minutes d'appel), sans contrat.": "14 days free (up to 40 call minutes), no contract.",
    "Commencer l'essai gratuit": "Start free trial",

    // Contact & Merci
    "Commencez votre essai gratuit": "Start your free trial",
    "14 jours gratuits (jusqu'à 40 minutes d'appel), sans contrat. On s'occupe de toute l'installation.": "14 days free (up to 40 call minutes), no contract. We handle the whole setup.",
    "Demander un devis ou un essai": "Request a quote or trial",
    "Remplissez ce formulaire : on vous répond en moins de 24 h (jours ouvrables).": "Fill out this form: we reply within 24 business hours.",
    "Votre nom": "Your name",
    "Nom de l'entreprise": "Business name",
    "Téléphone (facultatif)": "Phone (optional)",
    "Forfait qui vous intéresse": "Plan you're interested in",
    "Je ne sais pas encore": "Not sure yet",
    "Essentiel (mensuel)": "Essential (monthly)",
    "Pro (mensuel)": "Pro (monthly)",
    "Premium (mensuel)": "Premium (monthly)",
    "Essentiel (annuel)": "Essential (annual)",
    "Pro (annuel)": "Pro (annual)",
    "Premium (annuel)": "Premium (annual)",
    "Votre message (facultatif)": "Your message (optional)",
    "Ex. : garage de 4 baies, on manque environ 10 appels par semaine.": "E.g. 4-bay auto shop, we miss around 10 calls a week.",
    "Envoyer ma demande": "Send my request",
    "Envoi en cours…": "Sending…",
    "En envoyant ce formulaire, vous acceptez qu'on utilise ces renseignements pour vous répondre.": "By submitting this form, you agree that we may use this information to reply to you.",
    "Sur Facebook": "On Facebook",
    "Le plus rapide. Écrivez-nous pour une démonstration gratuite.": "Fastest option. Message us for a free demo.",
    "Nous écrire sur Facebook": "Message us on Facebook",
    "Par courriel": "By email",
    "Dites-nous le nom de votre entreprise et le forfait qui vous intéresse.": "Tell us your business name and the plan you're interested in.",
    "Réserver un appel": "Book a call",
    "Choisissez un moment pour un appel de 15 minutes avec nous.": "Pick a time for a 15-minute call with us.",
    "Voir les disponibilités": "See availability",
    "Vous nous écrivez": "You write to us",
    "Formulaire, Facebook ou courriel.": "Form, Facebook, or email.",
    "Appel de 15 minutes": "15-minute call",
    "On apprend à connaître votre entreprise.": "We get to know your business.",
    "Votre essai commence": "Your trial begins",
    "Votre réceptionniste répond à vos clients.": "Your receptionist answers your callers.",
    "Bienvenue chez Allo Réception !": "Welcome to Allo Réception!",
    "Votre essai gratuit de 14 jours est commencé. Aucun montant n'a été prélevé aujourd'hui.": "Your 14-day free trial has started. Nothing was charged today.",
    "Ouvrez votre courriel": "Check your email",
    "Vous recevez une invitation pour créer votre mot de passe (vérifiez aussi les indésirables).": "You'll receive an invitation to set your password (check spam just in case).",
    "Décrivez votre entreprise": "Describe your business",
    "Heures, services, prix : 5 minutes suffisent.": "Hours, services, prices: 5 minutes is all it takes.",
    "On vous donne votre numéro et elle commence tout de suite.": "We give you your phone number and she starts answering right away.",
    "Pas de courriel après 10 minutes ? Écrivez à": "No email after 10 minutes? Write to",

    // Connexion, Installation, Espace client
    "Connexion": "Sign In",
    "Courriel": "Email",
    "Mot de passe": "Password",
    "Se connecter": "Sign in",
    "Recevoir un lien de connexion par courriel": "Email me a sign-in link",
    "Mot de passe oublié ?": "Forgot password?",
    "Nouveau mot de passe (8 caractères minimum)": "New password (8 characters minimum)",
    "Enregistrer": "Save",
    "Pas encore client ?": "Not a customer yet?",
    "Voir les forfaits": "View plans",
    "Installons votre réceptionniste": "Let's set up your receptionist",
    "Ces informations servent à votre réceptionniste pour répondre à vos clients. Vous pourrez les modifier à tout moment.": "This information helps your receptionist answer your callers. You can update it anytime.",
    "Nom de l'entreprise *": "Business name *",
    "Secteur": "Industry",
    "Garage, mécanique générale": "Auto repair, general mechanics",
    "Adresse": "Address",
    "123 rue Principale, Gatineau": "123 Main Street, Ottawa",
    "Votre numéro de téléphone actuel": "Your current business phone number",
    "Heures d'ouverture *": "Business hours *",
    "Lundi au vendredi 8 h à 17 h, samedi 9 h à 13 h, fermé le dimanche": "Monday to Friday 8 AM–5 PM, Saturday 9 AM–1 PM, closed Sunday",
    "Services et prix": "Services and pricing",
    "Consignes pour la réceptionniste": "Instructions for your receptionist",
    "Ex. : on ne fait pas de carrosserie. Pour une urgence, dire de laisser son numéro.": "E.g. We don't do bodywork. For emergencies, ask them to leave their number.",
    "Courriel pour recevoir les résumés d'appels": "Email for call summaries",
    "Permettre le transfert d'appel vers un humain": "Allow live call transfer to a person",
    "Numéro de transfert (si activé)": "Transfer phone number (if enabled)",
    "Google Agenda (prise de rendez-vous)": "Google Calendar (appointment booking)",
    "Durée d'un rendez-vous": "Appointment duration",
    "Connecter mon Google Agenda": "Connect my Google Calendar",
    "Déconnecter": "Disconnect",
    "Non connecté": "Not connected",
    "Bientôt disponible": "Coming soon",
    "Inscriptions en ligne ouvertes sous peu": "Online sign-ups opening soon",
    "Coût par minute incluse dans le forfait": "Cost per included minute in the plan",
    "Annuel — toutes les minutes épuisées :": "Annual — all minutes used:",
    "Sécurité du compte (double authentification 2FA)": "Account security (Two-Factor Authentication 2FA)",
    "Activer la double authentification (2FA)": "Enable Two-Factor Authentication (2FA)",
    "Désactiver la double authentification": "Disable Two-Factor Authentication",
    "Code de vérification à 6 chiffres": "6-digit verification code",
    "Vérifier": "Verify",
    "Confirmer et activer": "Confirm and enable",
    "Activer et continuer": "Enable and continue",
    "Choisir un mot de passe (pour vous reconnecter plus tard)": "Choose a password (to sign in later)",
    "Laisser vide pour ne pas le changer": "Leave blank to keep current password",
    "Enregistrer et activer ma réceptionniste": "Save & activate my receptionist",
    "Mes réglages": "My settings",
    "Abonnement et factures": "Billing & invoices",
    "Se déconnecter": "Sign out",
    "Votre réceptionniste est prête ✓": "Your receptionist is ready ✓",
    "Votre numéro Allo Réception :": "Your Allo Réception number:",
    "Dernière étape :": "Last step:",
    "renvoyez vos appels vers ce numéro": "forward your calls to this number",
    "Votre réceptionniste est en préparation": "Your receptionist is being prepared",
    "Forfait": "Plan",
    "Numéro de la réceptionniste": "Receptionist number",
    "Minutes utilisées": "Minutes used",
    "Ajouter 100 minutes · 35 $": "Add 100 minutes · $35",
    "Passer au forfait supérieur": "Upgrade plan",
    "Derniers appels": "Recent calls",
    "Supprimer mon compte": "Delete my account",
    "Tapez SUPPRIMER pour confirmer": "Type SUPPRIMER to confirm",
    "Supprimer définitivement": "Delete permanently",

    // Assistant widget & démo animée (anim.js)
    "Assistante Allo Réception": "Allo Réception Assistant",
    "En ligne · répond tout de suite": "Online · replies right away",
    "Ouvrir l’assistante": "Open assistant",
    "Bonjour, je voudrais un changement d'huile cette semaine.": "Hi, I'd like an oil change this week.",
    "Bien sûr ! Quel jour et quelle heure vous conviendraient ?": "Of course! What day and time work best for you?",
    "Jeudi 9 h 30.": "Thursday at 9:30 AM.",
    "C'est noté pour jeudi 9 h 30. Le garage vous confirme rapidement.": "Noted for Thursday at 9:30 AM. The shop will confirm shortly.",
    "Demande de RDV": "Appointment Request",
    "Jeudi 9 h 30 · Changement d'huile": "Thursday 9:30 AM · Oil change",
    "Résumé envoyé par courriel": "Summary emailed",
    "Nouveau client · à confirmer": "New customer · to confirm",
    "Demande de rendez-vous notée sans que personne ne décroche.": "Appointment request noted without anyone picking up.",
    "Vous fermez à quelle heure le samedi ? Et c'est combien, une pose de pneus ?": "What time do you close on Saturday? And how much is a tire installation?",
    "Le samedi, nous fermons à 15 h. La pose de 4 pneus est à partir de 80 $.": "On Saturdays we close at 3 PM. Installing 4 tires starts at $80.",
    "Information donnée": "Info provided",
    "Heures du samedi · prix de la pose": "Saturday hours · installation price",
    "Résumé envoyé": "Summary sent",
    "Question sur les pneus": "Tire inquiry",
    "Le client a eu sa réponse tout de suite, sans vous déranger.": "The caller got their answer right away without interrupting you.",
    "Demain 10 h · Inspection des freins": "Tomorrow 10 AM · Brake inspection",
    "Client anglophone · à confirmer": "English caller · to confirm",
    "Un client anglophone servi dans sa langue. Vous recevez le résumé par courriel.": "An English-speaking customer served in their language. You get the summary by email.",
    "Bonsoir, ma voiture fait un bruit bizarre. Vous pouvez la voir demain ?": "Good evening, my car is making a strange noise. Can you see it tomorrow?",
    "Bonsoir ! Je note votre demande pour demain à 8 h. Quel est votre modèle ?": "Good evening! I'll note your request for tomorrow at 8 AM. What's your car model?",
    "Une Toyota RAV4. 8 h, c'est parfait.": "A Toyota RAV4. 8 AM is perfect.",
    "Demain 8 h · Diagnostic bruit · RAV4": "Tomorrow 8 AM · Noise diagnostic · RAV4",
    "Appel reçu à 21 h 47": "Call received at 9:47 PM",
    "Un client gagné à 21 h 47, au lieu d'une boîte vocale.": "A customer won at 9:47 PM instead of hitting voicemail."
  };

  var noeudsOriginaux = [];
  var attrsOriginaux = [];
  var enCours = false;
  var minuterie = null;

  function lireLangue() {
    try { return localStorage.getItem(CLE_LANGUE) || "fr"; } catch (e) { return "fr"; }
  }
  function garderLangue(l) {
    try { localStorage.setItem(CLE_LANGUE, l); } catch (e) {}
  }
  function effacerCookieGoogtrans() {
    var exp = "Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "googtrans=; expires=" + exp + "; path=/";
    document.cookie = "googtrans=; expires=" + exp + "; path=/; domain=" + location.hostname;
    document.cookie = "googtrans=; expires=" + exp + "; path=/; domain=." + location.hostname;
  }
  function definirCookieGoogtrans(lang) {
    var val = "/fr/" + lang;
    document.cookie = "googtrans=" + val + "; path=/";
    document.cookie = "googtrans=" + val + "; path=/; domain=" + location.hostname;
  }

  function traduireTexteFRversEN(txt) {
    var trim = txt.replace(/\s+/g, " ").trim();
    if (!trim) return null;
    if (EN[trim]) {
      var debut = txt.match(/^\s*/)[0];
      var fin = txt.match(/\s*$/)[0];
      return debut + EN[trim] + fin;
    }
    return null;
  }

  function appliquerAnglais() {
    enCours = true;
    try {
      document.documentElement.lang = "en-CA";
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      var n;
      while ((n = walker.nextNode())) {
        var p = n.parentElement;
        if (!p || p.closest("#allo-langues") || p.closest("#google_translate_element") || p.tagName === "SCRIPT" || p.tagName === "STYLE") continue;
        if (n.__alloFr === undefined) {
          n.__alloFr = n.nodeValue;
          noeudsOriginaux.push(n);
        }
        var tr = traduireTexteFRversEN(n.__alloFr);
        if (tr !== null && n.nodeValue !== tr) n.nodeValue = tr;
      }

      document.querySelectorAll("[placeholder], [aria-label], [data-mots]").forEach(function (el) {
        if (el.closest("#allo-langues")) return;
        ["placeholder", "aria-label", "data-mots"].forEach(function (attr) {
          var v = el.getAttribute(attr);
          if (!v) return;
          var cle = "__allo_" + attr;
          if (el[cle] === undefined) {
            el[cle] = v;
            attrsOriginaux.push([el, attr, v]);
          }
          var tr = EN[el[cle]];
          if (tr && el.getAttribute(attr) !== tr) el.setAttribute(attr, tr);
        });
      });

      if (document.__alloTitleFr === undefined) document.__alloTitleFr = document.title;
      if (EN[document.__alloTitleFr]) document.title = EN[document.__alloTitleFr];
    } finally {
      enCours = false;
    }
  }

  function restaurerFrancais() {
    enCours = true;
    try {
      document.documentElement.lang = "fr-CA";
      noeudsOriginaux.forEach(function (n) {
        if (n.__alloFr !== undefined && n.nodeValue !== n.__alloFr) n.nodeValue = n.__alloFr;
      });
      attrsOriginaux.forEach(function (item) {
        if (item[0].getAttribute(item[1]) !== item[2]) item[0].setAttribute(item[1], item[2]);
      });
      if (document.__alloTitleFr) document.title = document.__alloTitleFr;
    } finally {
      enCours = false;
    }
  }

  function chargerGoogleTranslate() {
    if (document.getElementById("allo-gt-script")) return;
    var cont = document.getElementById("google_translate_element");
    if (!cont) {
      cont = document.createElement("div");
      cont.id = "google_translate_element";
      cont.hidden = true;
      document.body.appendChild(cont);
    }
    window.alloGoogleTranslateInit = function () {
      if (!window.google || !window.google.translate) return;
      new window.google.translate.TranslateElement({
        pageLanguage: "fr",
        autoDisplay: false
      }, "google_translate_element");
    };
    var s = document.createElement("script");
    s.id = "allo-gt-script";
    s.async = true;
    s.src = "https://translate.google.com/translate_a/element.js?cb=alloGoogleTranslateInit";
    document.head.appendChild(s);
  }

  function majBoutons(lang) {
    var sel = document.getElementById("allo-sel-lang");
    if (sel) sel.value = lang || "fr";
  }

  function choisirLangue(lang) {
    var precedent = lireLangue();
    garderLangue(lang);
    majBoutons(lang);

    if (lang === "fr" || lang === "en") {
      if (precedent !== "fr" && precedent !== "en") {
        effacerCookieGoogtrans();
        location.reload();
        return;
      }
      effacerCookieGoogtrans();
      if (lang === "en") appliquerAnglais();
      else restaurerFrancais();
      return;
    }

    if (lang === "__plus__") {
      var cont = document.getElementById("google_translate_element");
      if (cont) cont.hidden = false;
      chargerGoogleTranslate();
      return;
    }

    if (precedent === "en") restaurerFrancais();
    definirCookieGoogtrans(lang);
    chargerGoogleTranslate();
    // Si Google Translate est déjà chargé, changer le select caché ou recharger pour appliquer
    var gtSel = document.querySelector(".goog-te-combo");
    if (gtSel) {
      gtSel.value = lang;
      gtSel.dispatchEvent(new Event("change"));
    } else if (precedent !== lang) {
      location.reload();
    }
  }

  function injecterSelecteur() {
    var menu = document.getElementById("menu");
    if (!menu || document.getElementById("allo-langues")) return;

    var bloc = document.createElement("div");
    bloc.id = "allo-langues";
    bloc.className = "langues-barre notranslate";
    bloc.setAttribute("translate", "no");

    var icone = document.createElement("span");
    icone.className = "langue-globe";
    icone.setAttribute("aria-hidden", "true");
    icone.textContent = "🌐";

    var sel = document.createElement("select");
    sel.id = "allo-sel-lang";
    sel.className = "langue-select";
    sel.setAttribute("aria-label", "Choisir la langue");

    [["fr", "Français"], ["en", "English"]].forEach(function (pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      sel.appendChild(o);
    });

    LANGUES_AUTRES.forEach(function (pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      sel.appendChild(o);
    });

    sel.addEventListener("change", function () {
      if (sel.value) choisirLangue(sel.value);
    });

    bloc.appendChild(icone);
    bloc.appendChild(sel);
    menu.appendChild(bloc);
  }

  function demarrer() {
    injecterSelecteur();
    var lang = lireLangue();
    majBoutons(lang);
    if (lang === "en") {
      appliquerAnglais();
      var obs = new MutationObserver(function () {
        if (enCours || lireLangue() !== "en") return;
        clearTimeout(minuterie);
        minuterie = setTimeout(appliquerAnglais, 80);
      });
      obs.observe(document.body, { childList: true, subtree: true });
    } else if (lang !== "fr") {
      definirCookieGoogtrans(lang);
      chargerGoogleTranslate();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrer);
  } else {
    demarrer();
  }
})();
