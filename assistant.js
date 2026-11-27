// ===== Assistante Allo Réception : discussion IA sur tout le site + guide d'installation sur mesure =====
(function () {
  var QUESTIONS = [
    { id: "type", q: "Quel type d'entreprise ou de partenariat avez-vous ?",
      court: "Type d'entreprise",
      choix: ["Garage / mécanique", "Clinique / santé", "Salon / esthétique", "Autre PME"] },
    { id: "appels", q: "Environ combien d'appels manquez-vous par semaine ?",
      court: "Appels manqués par semaine",
      choix: ["Moins de 5", "5 à 15", "Plus de 15", "Je ne sais pas"] },
    { id: "rdv", q: "Voulez-vous que la réceptionniste note ou réserve les rendez-vous ?",
      court: "Demandes de rendez-vous",
      choix: ["Oui", "Non, juste répondre"] },
    { id: "langue", q: "Avez-vous des clients anglophones ?",
      court: "Clients anglophones",
      choix: ["Oui", "Non, surtout francophones"] },
    { id: "numeros", q: "Combien de succursales ou de numéros de téléphone avez-vous ?",
      court: "Succursales ou numéros",
      choix: ["Un seul", "2", "3 ou plus"] },
    { id: "extra", q: "Dernière question : combien d'appels recevez-vous au total par jour ?",
      court: "Appels par jour",
      choix: ["Moins de 10", "10 à 25", "Plus de 25"] }
  ];
  var FORFAITS = {
    essentiel: { nom: "Essentiel", prix: 199, min: "200" },
    pro: { nom: "Pro", prix: 399, min: "500" },
    premium: { nom: "Premium", prix: 699, min: "1 000" }
  };

  var page = (document.body && document.body.dataset && document.body.dataset.page) || "";
  var estInstallation = page === "installation";

  function recommander(r) {
    var cle = "essentiel", raisons = [];
    if (r.rdv === "Oui") { cle = "pro"; raisons.push("les demandes de rendez-vous"); }
    if (r.langue === "Oui") { cle = "pro"; raisons.push("le service bilingue"); }
    if (r.appels === "Plus de 15") { if (cle === "essentiel") cle = "pro"; raisons.push("votre volume d'appels"); }
    if (r.extra === "Plus de 25") { cle = "premium"; raisons.push("votre grand volume d'appels (1 000 minutes par mois, au meilleur prix)"); }
    return { cle: cle, raisons: raisons, succursales: r.numeros !== "Un seul" };
  }

  var racine = document.createElement("div");
  racine.className = "assistant";
  racine.innerHTML =
    '<div class="assistant-panneau" id="assistant-panneau" role="dialog" aria-label="Équipe Allo Réception" hidden>' +
      '<div class="assistant-entete">' +
        '<span class="assistant-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h4v1h-7v2h6c1.66 0 3-1.34 3-3V10c0-4.97-4.03-9-9-9z"/></svg></span>' +
        '<div><p class="assistant-nom">Accueil Allo Réception</p><p class="assistant-statut">En ligne · Ottawa</p></div>' +
        '<button type="button" class="assistant-fermer" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>' +
      '</div>' +
      '<div class="assistant-messages" aria-live="polite"></div>' +
      '<div class="assistant-choix"></div>' +
      '<form class="assistant-saisie">' +
        '<input type="text" placeholder="' + (estInstallation ? "Décrivez votre entreprise ou posez une question…" : "Écrivez-nous votre question…") + '" maxlength="1000" autocomplete="off" aria-label="Votre message">' +
        '<button type="submit">Envoyer</button>' +
      '</form>' +
    '</div>' +
    '<button type="button" class="assistant-bulle" aria-controls="assistant-panneau" aria-expanded="false" aria-label="Discuter avec Allo Réception">' +
      '<span class="assistant-bulle-icone" aria-hidden="true"><svg class="icone-ouvrir" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/></svg><svg class="icone-fermer" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></span><span class="assistant-pastille" aria-hidden="true">1</span>' +
    '</button>';
  document.body.appendChild(racine);

  var panneau = racine.querySelector(".assistant-panneau");
  var bulle = racine.querySelector(".assistant-bulle");
  var messages = racine.querySelector(".assistant-messages");
  var zoneChoix = racine.querySelector(".assistant-choix");
  var formSaisie = racine.querySelector(".assistant-saisie");
  var champ = formSaisie.querySelector("input");
  var btnEnvoi = formSaisie.querySelector("button");
  var reponses = {}, etape = 0, demarre = false;
  var historiqueIA = [];

  function ajouter(texte, qui, html) {
    var m = document.createElement("div");
    m.className = "assistant-msg assistant-msg-" + qui;
    if (html) m.innerHTML = texte; else m.textContent = texte;
    messages.appendChild(m);
    messages.scrollTop = messages.scrollHeight;
  }

  function ecrire(texte, ensuite, html) {
    var t = document.createElement("div");
    t.className = "assistant-msg assistant-msg-ia assistant-ecrit";
    t.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(t);
    messages.scrollTop = messages.scrollHeight;
    setTimeout(function () { t.remove(); ajouter(texte, "ia", html); if (ensuite) ensuite(); }, 350);
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

  function remplirFormulaire(donnees) {
    var form = document.getElementById("form-installation");
    if (!form || !donnees || typeof donnees !== "object") return false;
    var champs = ["nom", "secteur", "adresse", "telephone_entreprise", "heures", "services_prix", "consignes"];
    var remplis = 0;
    champs.forEach(function (k) {
      if (typeof donnees[k] === "string" && donnees[k].trim() && form[k]) {
        form[k].value = donnees[k].trim();
        remplis++;
      }
    });
    return remplis > 0;
  }

  function reponseLocaleSecours(texte) {
    var t = texte.toLowerCase();
    if (/prix|tarif|forfait|co[uû]t|essai|combien/.test(t)) {
      return "Nos forfaits démarrent à 199 $/mois (Essentiel, 200 min), 399 $/mois (Pro, 500 min, bilingue + Google Agenda + SMS) et 699 $/mois (Premium, 1 000 min), avec 14 jours d'essai gratuit (0 $ aujourd'hui).";
    }
    if (/d[eé]mo|tester|appeler|num[eé]ro/.test(t)) {
      return "Vous pouvez appeler notre réceptionniste de démonstration 24/7 au +1 782 223-3839.";
    }
    return "Pour toute demande précise ou offre partenaire sur mesure, écrivez-nous à contact@alloreception.ca ou cliquez sur « Choisir mon forfait » ci-dessous.";
  }

  async function envoyerIA(texte) {
    ajouter(texte, "client");
    historiqueIA.push({ role: "user", texte: texte });
    zoneChoix.innerHTML = "";
    champ.disabled = true;
    btnEnvoi.disabled = true;

    var t = document.createElement("div");
    t.className = "assistant-msg assistant-msg-ia assistant-ecrit";
    t.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(t);
    messages.scrollTop = messages.scrollHeight;

    var reponseTexte = "";
    var installationData = null;
    try {
      var cfg = window.ALLO_CONFIG;
      if (!cfg || !cfg.supabaseUrl) throw new Error("config");
      var rep = await fetch(cfg.supabaseUrl + "/functions/v1/assistant-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: page, messages: historiqueIA }),
      });
      var d = await rep.json();
      if (!rep.ok || !d.reponse) throw new Error(d.erreur || "erreur");
      reponseTexte = String(d.reponse);
      var m = reponseTexte.match(/\[INSTALLATION\]([\s\S]*?)\[\/INSTALLATION\]/);
      if (m) {
        reponseTexte = reponseTexte.replace(m[0], "").trim();
        try { installationData = JSON.parse(m[1].trim()); } catch (_) {}
      }
    } catch (_) {
      reponseTexte = reponseLocaleSecours(texte);
    } finally {
      t.remove();
      champ.disabled = false;
      btnEnvoi.disabled = false;
      champ.focus();
    }

    historiqueIA.push({ role: "assistant", texte: reponseTexte });
    ajouter(reponseTexte, "ia");

    if (installationData && estInstallation) {
      boutons([
        { texte: "Remplir le formulaire automatiquement", principal: true, action: function () {
          if (remplirFormulaire(installationData)) {
            ajouter("C'est fait ! J'ai pré-rempli votre fiche d'installation avec ces informations. Si vous voulez changer quelque chose, corrigez-le ici ou cliquez sur « Recommencer ma fiche ».", "ia");
          }
        } },
        { texte: "Corriger un détail", action: function () { champ.focus(); } },
        { texte: "Recommencer ma fiche", action: function () {
          historiqueIA = [];
          var form = document.getElementById("form-installation");
          if (form) {
            ["nom", "secteur", "adresse", "telephone_entreprise", "heures", "services_prix", "consignes"].forEach(function (k) {
              if (form[k]) form[k].value = "";
            });
          }
          envoyerIA("Je veux recommencer ma fiche d'installation à zéro : pose-moi les questions étape par étape.");
        } }
      ]);
    } else if (!estInstallation) {
      boutons([
        { texte: "Choisir mon forfait (6 questions)", action: function () { etape = 0; reponses = {}; poser(); } },
        { texte: "Voir les forfaits", href: "forfaits.html" }
      ]);
    }
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
    var total = f.prix;
    var liste = r.raisons.length > 1 ? r.raisons.slice(0, -1).join(", ") + " et " + r.raisons[r.raisons.length - 1] : r.raisons[0];
    var pourquoi = r.raisons.length ? ", pour " + liste : "";
    var texte = "Merci ! Je vous recommande le forfait <strong>" + f.nom + "</strong>" + pourquoi + ".<br><br>" +
      "• " + f.min + " minutes d'appel incluses par mois<br>" +
      "• <strong>" + total + " $/mois</strong>, ou 2 mois gratuits en payant à l'année<br>" +
      (r.succursales ? "• Plusieurs succursales ? <a href=\"contact.html\">Écrivez-nous</a> : on prépare une offre sur mesure.<br>" : "") +
      "• 14 jours d'essai gratuit (jusqu'à 40 minutes d'appel)";
    var resume = "Bonjour,\n\nVoici mes réponses à l'assistante du site :\n" +
      QUESTIONS.map(function (q) { return "- " + q.court + " : " + reponses[q.id]; }).join("\n") +
      "\n\nForfait recommandé : " + f.nom + " (" + total + " $/mois)" +
      (r.succursales ? "\nPlusieurs succursales : j'aimerais une offre sur mesure." : "") +
      "\n\nMerci de me recontacter.";
    try { sessionStorage.setItem("allo_resume", resume); } catch (_) {}
    ecrire(texte, function () {
      boutons([
        { texte: "Essayer 14 jours gratuit →", href: "forfaits.html", principal: true },
        { texte: "Demander un devis / partenaire", href: "contact.html" },
        { texte: "Recommencer", action: function () { etape = 0; reponses = {}; poser(); } }
      ]);
    }, true);
  }

  function accueil() {
    if (estInstallation) {
      ecrire("Bonjour ! Je vous aide à configurer votre réceptionniste virtuelle sur mesure. Décrivez-moi votre entreprise (secteur, heures d'ouverture, services, consignes) ou cliquez ci-dessous pour que je vous guide question par question.", function () {
        boutons([
          { texte: "Me guider pas à pas", principal: true, action: function () {
            envoyerIA("Aide-moi à configurer ma réceptionniste virtuelle étape par étape.");
          } }
        ]);
      });
    } else {
      ecrire("Bonjour ! Je suis l'assistante d'Allo Réception. Posez-moi n'importe quelle question sur le site, nos forfaits ou un partenariat, ou lancez le questionnaire rapide.", function () {
        boutons([
          { texte: "Choisir mon forfait (6 questions)", principal: true, action: function () { etape = 0; reponses = {}; poser(); } },
          { texte: "Devis partenaire / multi-sites", action: function () {
            envoyerIA("Nous sommes un partenaire / avons plusieurs besoins sur mesure. Comment fonctionne votre offre ?");
          } },
          { texte: "Voir les forfaits", href: "forfaits.html" }
        ]);
      });
    }
  }

  formSaisie.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var txt = champ.value.trim();
    if (!txt || champ.disabled) return;
    champ.value = "";
    envoyerIA(txt);
  });

  function basculer(ouvrir) {
    panneau.hidden = !ouvrir;
    racine.classList.toggle("assistant-ouvert", ouvrir);
    bulle.setAttribute("aria-expanded", String(ouvrir));
    var pastille = racine.querySelector(".assistant-pastille");
    if (ouvrir && pastille) pastille.remove();
    if (ouvrir && !demarre) { demarre = true; accueil(); }
  }
  bulle.addEventListener("click", function () { basculer(panneau.hidden); });
  racine.querySelector(".assistant-fermer").addEventListener("click", function () { basculer(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panneau.hidden) basculer(false); });
})();
