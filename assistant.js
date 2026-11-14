// ===== Assistant virtuel : questions pour cerner le besoin du client =====
// Fonctionne entièrement dans le navigateur : aucune réponse n'est enregistrée ni envoyée,
// sauf si le visiteur choisit de nous écrire par courriel.
(function () {
  var QUESTIONS = [
    { id: "type", q: "Bonjour ! 👋 Je suis l'assistante d'Allo Réception. En 6 questions, je vous recommande le bon forfait. Quel type d'entreprise avez-vous ?",
      court: "Type d'entreprise",
      choix: ["Garage / mécanique", "Clinique / santé", "Salon / esthétique", "Autre PME"] },
    { id: "appels", q: "Environ combien d'appels manquez-vous par semaine ?",
      court: "Appels manqués par semaine",
      choix: ["Moins de 5", "5 à 15", "Plus de 15", "Je ne sais pas"] },
    { id: "rdv", q: "Voulez-vous que la réceptionniste prenne les rendez-vous dans votre calendrier ?",
      court: "Prise de rendez-vous",
      choix: ["Oui", "Non, juste répondre"] },
    { id: "langue", q: "Avez-vous des clients anglophones ?",
      court: "Clients anglophones",
      choix: ["Oui", "Non, surtout francophones"] },
    { id: "numeros", q: "Combien de numéros de téléphone (succursales, départements) avez-vous ?",
      court: "Numéros de téléphone",
      choix: ["Un seul", "2", "3 ou plus"] },
    { id: "extra", q: "Dernière question : les rapports mensuels et une voix personnalisée à votre image sont-ils importants pour vous ?",
      court: "Rapports et voix personnalisée",
      choix: ["Oui, important", "Pas nécessaire"] }
  ];
  var FORFAITS = {
    essentiel: { nom: "Essentiel", prix: 199, min: "200" },
    pro: { nom: "Pro", prix: 399, min: "500" },
    premium: { nom: "Premium", prix: 699, min: "1 000" }
  };

  function recommander(r) {
    var cle = "essentiel", raisons = [];
    if (r.rdv === "Oui") { cle = "pro"; raisons.push("la prise de rendez-vous"); }
    if (r.langue === "Oui") { cle = "pro"; raisons.push("le service bilingue"); }
    // Les numéros supplémentaires existent seulement en Pro et Premium
    if (r.numeros !== "Un seul") { if (cle === "essentiel") cle = "pro"; raisons.push("vos numéros supplémentaires"); }
    if (r.appels === "Plus de 15") { if (cle === "essentiel") cle = "pro"; raisons.push("votre volume d'appels"); }
    if (r.extra === "Oui, important") { cle = "premium"; raisons.push("les rapports et la voix personnalisée"); }
    var nbNumeros = r.numeros === "2" ? 1 : r.numeros === "3 ou plus" ? 2 : 0;
    return { cle: cle, raisons: raisons, nbNumeros: nbNumeros };
  }

  // Construction de la bulle et du panneau
  var racine = document.createElement("div");
  racine.className = "assistant";
  racine.innerHTML =
    '<div class="assistant-panneau" id="assistant-panneau" role="dialog" aria-label="Assistante Allo Réception" hidden>' +
      '<div class="assistant-entete">' +
        '<span class="assistant-avatar" aria-hidden="true">☎</span>' +
        '<div><p class="assistant-nom">Assistante Allo Réception</p><p class="assistant-statut">En ligne · répond tout de suite</p></div>' +
        '<button type="button" class="assistant-fermer" aria-label="Fermer">✕</button>' +
      '</div>' +
      '<div class="assistant-messages" aria-live="polite"></div>' +
      '<div class="assistant-choix"></div>' +
    '</div>' +
    '<button type="button" class="assistant-bulle" aria-controls="assistant-panneau" aria-expanded="false" aria-label="Ouvrir l’assistante">' +
      '<span class="assistant-bulle-icone" aria-hidden="true">💬</span><span class="assistant-pastille" aria-hidden="true">1</span>' +
    '</button>';
  document.body.appendChild(racine);

  var panneau = racine.querySelector(".assistant-panneau");
  var bulle = racine.querySelector(".assistant-bulle");
  var messages = racine.querySelector(".assistant-messages");
  var zoneChoix = racine.querySelector(".assistant-choix");
  var reponses = {}, etape = 0, demarre = false;

  function ajouter(texte, qui, html) {
    var m = document.createElement("div");
    m.className = "assistant-msg assistant-msg-" + qui;
    if (html) m.innerHTML = texte; else m.textContent = texte;
    messages.appendChild(m);
    messages.scrollTop = messages.scrollHeight;
  }
  // Affiche « … » quelques instants, comme si l'assistante écrivait
  function ecrire(texte, ensuite, html) {
    var t = document.createElement("div");
    t.className = "assistant-msg assistant-msg-ia assistant-ecrit";
    t.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(t);
    messages.scrollTop = messages.scrollHeight;
    setTimeout(function () { t.remove(); ajouter(texte, "ia", html); if (ensuite) ensuite(); }, 650);
  }
  function boutons(liste) {
    zoneChoix.innerHTML = "";
    liste.forEach(function (b) {
      var el = document.createElement(b.href ? "a" : "button");
      el.className = "assistant-option" + (b.principal ? " assistant-option-principale" : "");
      el.textContent = b.texte;
      if (b.href) el.href = b.href; else { el.type = "button"; el.addEventListener("click", b.action); }
      zoneChoix.appendChild(el);
    });
  }
  function poser() {
    var Q = QUESTIONS[etape];
    zoneChoix.innerHTML = "";
    ecrire(Q.q, function () {
      boutons(Q.choix.map(function (c) {
        return { texte: c, action: function () {
          reponses[Q.id] = c;
          ajouter(c, "client");
          etape++;
          if (etape < QUESTIONS.length) poser(); else conclure();
        } };
      }));
    });
  }
  function conclure() {
    zoneChoix.innerHTML = "";
    var r = recommander(reponses), f = FORFAITS[r.cle];
    var total = f.prix + r.nbNumeros * 49;
    var liste = r.raisons.length > 1 ? r.raisons.slice(0, -1).join(", ") + " et " + r.raisons[r.raisons.length - 1] : r.raisons[0];
    var pourquoi = r.raisons.length ? ", pour " + liste : "";
    var s = r.nbNumeros > 1 ? "s" : "";
    var texte = "Merci ! ✅ Je vous recommande le forfait <strong>" + f.nom + "</strong>" + pourquoi + ".<br><br>" +
      "• " + f.min + " minutes d'appel incluses par mois<br>" +
      (r.nbNumeros ? "• " + r.nbNumeros + " numéro" + s + " supplémentaire" + s + " (+49 $/mois chacun)<br>" : "") +
      "• Total : <strong>" + total + " $/mois</strong>, ou 2 mois gratuits en payant à l'année<br>" +
      "• 14 jours d'essai gratuit (jusqu'à 40 minutes d'appel)";
    var resume = "Bonjour,\n\nVoici mes réponses à l'assistante du site :\n" +
      QUESTIONS.map(function (q) { return "- " + q.court + " : " + reponses[q.id]; }).join("\n") +
      "\n\nForfait recommandé : " + f.nom + " (" + total + " $/mois)" +
      "\n\nNom de mon entreprise :\nMon numéro de téléphone :\n";
    ecrire(texte, function () {
      boutons([
        { texte: "Commencer l'essai gratuit", principal: true, href: "contact.html?forfait=" + r.cle },
        { texte: "Envoyer mes réponses par courriel", href: "mailto:contact@alloreception.ca?subject=" +
            encodeURIComponent("Essai Allo Réception — forfait " + f.nom) + "&body=" + encodeURIComponent(resume) },
        { texte: "Comparer les forfaits", href: "forfaits.html" },
        { texte: "↺ Recommencer", action: recommencer }
      ]);
    }, true);
  }
  function recommencer() { messages.innerHTML = ""; reponses = {}; etape = 0; poser(); }

  function ouvrir(v) {
    panneau.hidden = !v;
    bulle.setAttribute("aria-expanded", v);
    racine.classList.toggle("assistant-ouvert", v);
    var p = bulle.querySelector(".assistant-pastille"); if (p) p.remove();
    if (v && !demarre) { demarre = true; poser(); }
  }
  bulle.addEventListener("click", function () { ouvrir(panneau.hidden); });
  racine.querySelector(".assistant-fermer").addEventListener("click", function () { ouvrir(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panneau.hidden) ouvrir(false); });
})();
