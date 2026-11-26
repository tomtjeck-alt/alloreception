// ===== Menu sur téléphone =====
var boutonMenu = document.querySelector(".menu-bouton");
var menu = document.getElementById("menu");
if (boutonMenu && menu) {
  boutonMenu.addEventListener("click", function () {
    var ouvert = menu.classList.toggle("ouvert");
    boutonMenu.setAttribute("aria-expanded", ouvert);
    boutonMenu.textContent = ouvert ? "✕" : "☰";
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

  formDevis.addEventListener("submit", function (e) {
    e.preventDefault();
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

    var cle = regle("web3formsCle");
    if (!cle) {
      location.href = "mailto:contact@alloreception.ca?subject=" +
        encodeURIComponent(sujet) + "&body=" + encodeURIComponent(corps);
      afficherDevis("Votre logiciel de courriel devrait s'ouvrir avec votre demande. S'il ne s'ouvre pas, écrivez-nous directement à contact@alloreception.ca.", "info");
      return;
    }

    var bouton = formDevis.querySelector("button[type=submit]");
    bouton.disabled = true;
    bouton.textContent = "Envoi en cours…";
    fetch("https://api.web3forms.com/submit", {
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
        message: d.get("message") || "—"
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (rep) {
        if (!rep.success) throw new Error(rep.message);
        if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: nomForfait });
        formDevis.hidden = true;
        afficherDevis("Merci ! Votre demande est bien envoyée. On vous répond en moins de 24 h (jours ouvrables).", "succes");
      })
      .catch(function () {
        afficherDevis("Oups, l'envoi n'a pas marché. Écrivez-nous directement à contact@alloreception.ca.", "erreur");
      })
      .finally(function () {
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
  sLang.src = "langues.js?v=1";
  document.body.appendChild(sLang);
}
