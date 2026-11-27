// ===== Capture des paramètres UTM et du fbclid (attribution publicitaire) =====
// Gardés seulement dans cet onglet (sessionStorage) ; rien n'est envoyé tant que le visiteur
// n'a pas rempli le formulaire. Le fbclid n'est joint à la demande que s'il a accepté les témoins.
(function () {
  try {
    var p = new URLSearchParams(window.location.search);
    var cles = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    var deja = JSON.parse(sessionStorage.getItem("allo_utm") || "{}") || {};
    var nouveaux = {};
    cles.forEach(function (k) {
      var v = (p.get(k) || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 160);
      if (v) nouveaux[k] = v;
    });
    if (Object.keys(nouveaux).length) {
      // Nouvelle campagne : on remplace tout, pour ne pas mélanger deux provenances.
      nouveaux.page_depart = (window.location.pathname || "/").slice(0, 300);
      deja = nouveaux;
    } else if (!deja.page_depart) {
      deja.page_depart = (window.location.pathname || "/").slice(0, 300);
    }
    sessionStorage.setItem("allo_utm", JSON.stringify(deja));

    var fbclid = (p.get("fbclid") || "").trim();
    if (/^[A-Za-z0-9_-]{1,500}$/.test(fbclid)) {
      sessionStorage.setItem("allo_fbclid", JSON.stringify({ v: fbclid, le: new Date().toISOString() }));
    }
  } catch (_) {}
})();

// ===== Menu sur téléphone =====
var boutonMenu = document.querySelector(".menu-bouton");
var menu = document.getElementById("menu");
if (boutonMenu && menu) {
  var svgMenu = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>';
  var svgFermer = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  boutonMenu.addEventListener("click", function () {
    var ouvert = menu.classList.toggle("ouvert");
    boutonMenu.setAttribute("aria-expanded", ouvert);
    boutonMenu.innerHTML = ouvert ? svgFermer : svgMenu;
  });
}

// ===== Bascule Mensuel / Annuel (page Forfaits) =====
function choisirPeriode(periode) {
  document.querySelectorAll(".bascule button").forEach(function (b) {
    b.setAttribute("aria-pressed", b.dataset.periode === periode);
  });
  document.querySelectorAll(".montant").forEach(function (el) {
    el.textContent = el.dataset[periode] + " $";
  });
  document.querySelectorAll(".prix-detail").forEach(function (el) {
    el.textContent = el.dataset[periode];
  });
  // La fenêtre de paiement (paiement.js) s'ouvre sur la même période
  window.periodeChoisie = periode;
}
var boutonsPeriode = document.querySelectorAll(".bascule button");
if (boutonsPeriode.length) {
  boutonsPeriode.forEach(function (b) {
    b.addEventListener("click", function () { choisirPeriode(b.dataset.periode); });
  });
  choisirPeriode("annuel");
}

// ===== Calculateur des appels manqués =====
var calcAppels = document.getElementById("calc-appels");
var calcValeur = document.getElementById("calc-valeur");
function nombre(n) { return Math.round(n).toLocaleString("fr-CA"); }
function calculer() {
  var appels = +calcAppels.value;
  var valeur = +calcValeur.value;
  var perdu = appels * 4.3 * (1 / 3) * valeur;
  document.getElementById("calc-appels-val").textContent = appels;
  document.getElementById("calc-valeur-val").textContent = nombre(valeur) + " $";
  document.getElementById("calc-perdu").textContent = nombre(perdu) + " $";
  var ratio = perdu / 399;
  document.getElementById("calc-ratio").textContent =
    ratio >= 1.5 ? nombre(ratio) + " fois moins" : "moins que vos pertes";
}
if (calcAppels && calcValeur) {
  calcAppels.addEventListener("input", calculer);
  calcValeur.addEventListener("input", calculer);
  calculer();
}

// ===== Page Contact : afficher le forfait choisi =====
var noms = {
  "essentiel": "Essentiel (mensuel)", "pro": "Pro (mensuel)", "premium": "Premium (mensuel)",
  "essentiel-annuel": "Essentiel (annuel)", "pro-annuel": "Pro (annuel)", "premium-annuel": "Premium (annuel)"
};
var forfait = new URLSearchParams(location.search).get("forfait");
var etiquette = document.getElementById("forfait-choisi");
if (etiquette && noms[forfait]) {
  etiquette.textContent = "Forfait choisi : " + noms[forfait];
  etiquette.hidden = false;
  var courriel = document.getElementById("lien-courriel");
  if (courriel) {
    courriel.href = "mailto:contact@alloreception.ca?subject=" +
      encodeURIComponent("Essai gratuit Allo Réception — forfait " + noms[forfait]);
  }
}

// ===== Réglages publics (config.js) =====
var CONFIG = window.ALLO_CONFIG || {};
function regle(nom) {
  var v = CONFIG[nom];
  return v && v !== "A_REMPLACER" ? v : "";
}

// ===== Page Contact : bouton « Réserver un appel » (Cal.com) =====
var carteRdv = document.getElementById("carte-rdv");
if (carteRdv && regle("calLien")) {
  document.getElementById("lien-rdv").href = regle("calLien");
  carteRdv.hidden = false;
}

// ===== Page Contact : formulaire de devis =====
// Envoyé par Web3Forms vers contact@alloreception.ca.
// Sans clé Web3Forms : ouvre le logiciel de courriel du visiteur avec le message prérempli.
var formDevis = document.getElementById("form-devis");
if (formDevis) {
  var champForfait = document.getElementById("champ-forfait");
  if (champForfait && noms[forfait]) champForfait.value = forfait;

  var msgDevis = document.getElementById("devis-message");
  function afficherDevis(texte, type) {
    msgDevis.textContent = texte;
    msgDevis.className = "message message-" + type;
    msgDevis.hidden = false;
  }

  // Identifiant unique de la demande, choisi dans le navigateur : si la même demande est
  // renvoyée (double clic, nouvel essai après une panne), la base ne l'enregistre qu'une fois.
  function nouvelIdDemande() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var o = new Uint8Array(16);
    crypto.getRandomValues(o);
    o[6] = (o[6] & 0x0f) | 0x40; o[8] = (o[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(o, function (x) { return (x + 256).toString(16).slice(1); }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }

  // Enregistre la demande dans la base (Supabase). Résultat : "ok", "limite", "echec" ou "absent".
  // Les erreurs ne sont jamais avalées : elles sont renvoyées et notées (sans données personnelles).
  function enregistrerDemande(d, nomForfait, id) {
    var cfg = window.ALLO_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseCleAnon || cfg.supabaseCleAnon === "A_REMPLACER") {
      return Promise.resolve({ etat: "absent" });
    }
    var utm = {};
    try { utm = JSON.parse(sessionStorage.getItem("allo_utm") || "{}") || {}; } catch (_) {}
    // fbclid : joint SEULEMENT si le visiteur a accepté les témoins.
    var clic = {};
    if (lireChoix() === "accepte") {
      try { clic = JSON.parse(sessionStorage.getItem("allo_fbclid") || "{}") || {}; } catch (_) {}
    }
    var fbclid = /^[A-Za-z0-9_-]{1,500}$/.test(String(clic.v || "")) ? String(clic.v) : "";
    var texte = function (k, max) { return String(d.get(k) || "").trim().slice(0, max); };
    return fetch(cfg.supabaseUrl + "/rest/v1/demandes_contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": cfg.supabaseCleAnon,
        "Authorization": "Bearer " + cfg.supabaseCleAnon,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        id: id,
        nom: texte("nom", 160),
        entreprise: texte("entreprise", 160),
        courriel: texte("courriel", 200),
        telephone: texte("telephone", 40),
        forfait: String(nomForfait || "").slice(0, 80),
        infolettre: Boolean(d.get("consentement_infolettre")),
        message: texte("message", 3000),
        utm_source: String(utm.utm_source || "").slice(0, 120),
        utm_medium: String(utm.utm_medium || "").slice(0, 120),
        utm_campaign: String(utm.utm_campaign || "").slice(0, 160),
        utm_content: String(utm.utm_content || "").slice(0, 160),
        utm_term: String(utm.utm_term || "").slice(0, 160),
        page_depart: String(utm.page_depart || "").slice(0, 300),
        fbclid: fbclid,
        fbclid_le: fbclid && clic.le ? String(clic.le).slice(0, 40) : null
      })
    }).then(function (r) {
      // 201 = enregistrée ; 409 = déjà enregistrée (même identifiant, renvoi de la même demande)
      if (r.status === 201 || r.status === 409) return { etat: "ok" };
      return r.json().catch(function () { return {}; }).then(function (j) {
        var limite = j && j.message === "trop_de_demandes";
        console.warn("[Allo] Demande non enregistrée dans la base (code " + r.status + (limite ? ", limite atteinte" : "") + ").");
        return { etat: limite ? "limite" : "echec", code: r.status };
      });
    }, function () {
      console.warn("[Allo] Demande non enregistrée dans la base (réseau).");
      return { etat: "echec", code: "reseau" };
    });
  }

  // Avis par courriel au propriétaire (Web3Forms). Résultat : true si le courriel est parti.
  function envoyerCourrielDevis(cle, d, sujet, nomForfait, base) {
    return fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: cle,
        subject: sujet,
        from_name: "Site Allo Réception",
        replyto: d.get("courriel"),
        nom: d.get("nom"),
        entreprise: d.get("entreprise"),
        courriel: d.get("courriel"),
        telephone: d.get("telephone") || "—",
        forfait: nomForfait,
        infolettre: d.get("consentement_infolettre") ? "Oui (consentement explicite)" : "Non",
        message: d.get("message") || "—",
        enregistrement_base: base.etat === "ok" ? "Oui" : "NON — demande absente de la base (code " + (base.code || base.etat) + ")"
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (rep) {
        if (!rep || !rep.success) { console.warn("[Allo] Courriel de la demande refusé par Web3Forms."); return false; }
        return true;
      }, function () { console.warn("[Allo] Courriel de la demande impossible (réseau)."); return false; });
  }

  var envoiEnCours = false;
  formDevis.addEventListener("submit", function (e) {
    e.preventDefault();
    if (envoiEnCours) return; // double clic : un seul envoi
    if (!formDevis.checkValidity()) {
      formDevis.reportValidity();
      return;
    }
    var d = new FormData(formDevis);
    if (d.get("botcheck")) return; // robot
    var nomForfait = noms[d.get("forfait")] || d.get("forfait");
    var sujet = "Demande de devis — " + d.get("entreprise") + " (" + nomForfait + ")";
    var corps =
      "Nom : " + d.get("nom") + "\n" +
      "Entreprise : " + d.get("entreprise") + "\n" +
      "Courriel : " + d.get("courriel") + "\n" +
      "Téléphone : " + (d.get("telephone") || "—") + "\n" +
      "Forfait : " + nomForfait + "\n" +
      "Offres par courriel : " + (d.get("consentement_infolettre") ? "Oui" : "Non") + "\n\n" +
      (d.get("message") || "");

    envoiEnCours = true;
    var bouton = formDevis.querySelector("button[type=submit]");
    bouton.disabled = true;
    bouton.textContent = "Envoi en cours…";
    if (!formDevis.dataset.idDemande) formDevis.dataset.idDemande = nouvelIdDemande();
    var cle = regle("web3formsCle");

    enregistrerDemande(d, nomForfait, formDevis.dataset.idDemande)
      .then(function (base) {
        if (base.etat === "limite") return { base: base, courriel: "non" };
        if (!cle) return { base: base, courriel: "absent" };
        return envoyerCourrielDevis(cle, d, sujet, nomForfait, base)
          .then(function (parti) { return { base: base, courriel: parti ? "ok" : "echec" }; });
      })
      .then(function (res) {
        if (res.base.etat === "limite") {
          afficherDevis("Vous avez déjà envoyé plusieurs demandes. Merci de patienter quelques minutes, ou écrivez-nous à contact@alloreception.ca.", "erreur");
          return;
        }
        // Succès seulement si la demande a VRAIMENT été reçue : enregistrée dans la base ou partie par courriel.
        if (res.base.etat === "ok" || res.courriel === "ok") {
          if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: nomForfait });
          delete formDevis.dataset.idDemande;
          formDevis.hidden = true;
          afficherDevis("Merci ! Votre demande est bien envoyée. On vous répond en moins de 24 h (jours ouvrables).", "succes");
          return;
        }
        if (res.courriel === "absent") {
          // Ni base ni courriel automatique : on ouvre le logiciel de courriel du visiteur.
          location.href = "mailto:contact@alloreception.ca?subject=" +
            encodeURIComponent(sujet) + "&body=" + encodeURIComponent(corps);
          afficherDevis("Votre logiciel de courriel devrait s'ouvrir avec votre demande. S'il ne s'ouvre pas, écrivez-nous directement à contact@alloreception.ca.", "info");
          return;
        }
        afficherDevis("Oups, votre demande n'a pas pu être envoyée. Réessayez dans un instant, ou écrivez-nous directement à contact@alloreception.ca.", "erreur");
      })
      .catch(function () {
        afficherDevis("Oups, votre demande n'a pas pu être envoyée. Réessayez dans un instant, ou écrivez-nous directement à contact@alloreception.ca.", "erreur");
      })
      .finally(function () {
        envoiEnCours = false;
        bouton.disabled = false;
        bouton.textContent = "Envoyer ma demande";
      });
  });
}

// ===== Témoins (cookies) : consentement des visiteurs =====
// Choix gardé dans le navigateur : "accepte" ou "refuse".
// Si vous ajoutez un jour une mesure d'audience, mettez-la dans chargerMesureAudience() :
// elle ne sera lancée que si le visiteur a accepté.
var CLE_TEMOINS = "allo-temoins";
function lireChoix() { try { return localStorage.getItem(CLE_TEMOINS); } catch (e) { return null; } }
function garderChoix(c) { try { localStorage.setItem(CLE_TEMOINS, c); } catch (e) {} }
// GoatCounter + pixels publicitaires : lancés SEULEMENT si le visiteur a accepté les témoins.
function chargerMesureAudience() {
  var code = regle("goatcounterCode");
  if (code && !document.getElementById("goatcounter")) {
    var s = document.createElement("script");
    s.id = "goatcounter";
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = "https://" + code + ".goatcounter.com/count";
    document.head.appendChild(s);
  }
  var pixel = regle("metaPixelId");
  if (pixel && !document.getElementById("allo-meta-pixel")) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.id = "allo-meta-pixel"; t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", pixel);
    window.fbq("track", "PageView");
  }
  var gads = regle("googleAdsId");
  if (gads && !document.getElementById("allo-gads")) {
    var sg = document.createElement("script");
    sg.id = "allo-gads";
    sg.async = true;
    sg.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gads);
    document.head.appendChild(sg);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", gads);
  }
}

var bandeau = document.getElementById("temoins");
if (bandeau) {
  var choix = lireChoix();
  if (choix === "accepte") chargerMesureAudience();
  if (!choix) bandeau.hidden = false;
  bandeau.querySelectorAll("[data-choix]").forEach(function (b) {
    b.addEventListener("click", function () {
      garderChoix(b.dataset.choix);
      bandeau.hidden = true;
      if (b.dataset.choix === "accepte") chargerMesureAudience();
    });
  });
  document.querySelectorAll(".gerer-temoins").forEach(function (lien) {
    lien.addEventListener("click", function (e) { e.preventDefault(); bandeau.hidden = false; });
  });
}

// ===== Sélecteur de langue (FR / EN / toutes les langues) =====
if (!document.getElementById("allo-langues-script")) {
  var sLang = document.createElement("script");
  sLang.id = "allo-langues-script";
  sLang.src = "langues.js?v=3";
  document.body.appendChild(sLang);
}
