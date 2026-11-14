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
  // Abonnement direct : lien Stripe en mensuel, contact en annuel
  document.querySelectorAll(".lien-abonner").forEach(function (el) {
    el.href = el.dataset[periode + "Href"];
    if (periode === "annuel") el.removeAttribute("target");
    else el.setAttribute("target", "_blank");
  });
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
