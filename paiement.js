// ===== Fenêtre de paiement « style Canva » (page Forfaits) =====
// Le client choisit Mensuel/Annuel, voit la ligne du temps de son essai,
// puis entre sa carte. 0 $ aujourd'hui, premier paiement au 15e jour.
//
// Deux modes :
//  - Paiement intégré (Stripe Embedded Checkout) : si config.js contient
//    stripeClePublique ; la fonction Supabase « creer-paiement » prépare la session.
//  - Secours : sinon (ou en cas d'erreur), bouton vers le lien de paiement Stripe.
(function () {
  var dialog = document.getElementById("paiement");
  if (!dialog || typeof dialog.showModal !== "function") return; // vieux navigateur : les liens de secours restent

  var FORFAITS = {
    essentiel: { nom: "Essentiel", mensuel: 199, annuel: 1990 },
    pro:       { nom: "Pro",       mensuel: 399, annuel: 3990 },
    premium:   { nom: "Premium",   mensuel: 699, annuel: 6990 }
  };
  var JOURS_ESSAI = 14, JOURS_RAPPEL = 7;

  var C = window.ALLO_CONFIG || {};
  var cleStripe = C.stripeClePublique && C.stripeClePublique !== "A_REMPLACER" ? C.stripeClePublique : "";

  var etat = { forfait: "pro", periode: "annuel", bouton: null };
  var checkoutActif = null;   // instance Stripe en cours (à détruire avant d'en créer une autre)
  var demande = 0;            // ignore les réponses d'une ancienne demande

  function $(id) { return document.getElementById(id); }
  function argent(n) { return n.toLocaleString("fr-CA") + " $"; }
  function dans(jours) {
    var d = new Date(); d.setDate(d.getDate() + jours);
    return d.toLocaleDateString("fr-CA", { day: "numeric", month: "long" });
  }

  function afficher() {
    var f = FORFAITS[etat.forfait];
    $("p-nom").textContent = f.nom;
    $("p-prix-annuel").textContent = argent(f.annuel) + " par an · " + argent(Math.round(f.annuel / 12)) + "/mois";
    $("p-prix-mensuel").textContent = argent(f.mensuel) + " par mois";
    dialog.querySelector('input[value="' + etat.periode + '"]').checked = true;
    $("p-date-rappel").textContent = "Le " + dans(JOURS_RAPPEL) + " · rappel";
    $("p-date-paiement").textContent = "Le " + dans(JOURS_ESSAI) + " · fin de l'essai";
    $("p-montant").textContent = etat.periode === "annuel"
      ? argent(f.annuel) + " pour l'année"
      : argent(f.mensuel) + " par mois";
    // Lien de secours : le lien de paiement Stripe correspondant
    if (etat.bouton) $("p-lien-stripe").href = etat.bouton.dataset[etat.periode + "Href"];
    preparerPaiement();
  }

  // ---------- Paiement intégré Stripe ----------
  var stripePromesse = null;
  function chargerStripe() {
    if (!stripePromesse) {
      stripePromesse = new Promise(function (ok, echec) {
        var s = document.createElement("script");
        s.src = "https://js.stripe.com/v3/";
        s.onload = function () { ok(window.Stripe(cleStripe, { locale: "fr-CA" })); };
        s.onerror = echec;
        document.head.appendChild(s);
      });
    }
    return stripePromesse;
  }

  function modeSecours() {
    dialog.classList.remove("integre");
  }

  function preparerPaiement() {
    if (checkoutActif) { checkoutActif.destroy(); checkoutActif = null; }
    if (!cleStripe) return modeSecours();
    dialog.classList.add("integre");
    $("checkout").innerHTML = '<p class="checkout-chargement">Chargement du paiement sécurisé…</p>';
    var numero = ++demande;
    var choix = { forfait: etat.forfait, periode: etat.periode };

    chargerStripe().then(function (stripe) {
      return stripe.initEmbeddedCheckout({
        fetchClientSecret: function () {
          return fetch(C.supabaseUrl + "/functions/v1/creer-paiement", {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: C.supabaseCleAnon },
            body: JSON.stringify(choix)
          }).then(function (r) {
            if (!r.ok) throw new Error("creer-paiement " + r.status);
            return r.json();
          }).then(function (d) { return d.clientSecret; });
        }
      });
    }).then(function (checkout) {
      if (numero !== demande || !dialog.open) { checkout.destroy(); return; }
      $("checkout").innerHTML = "";
      checkout.mount("#checkout");
      checkoutActif = checkout;
    }).catch(function () {
      if (numero === demande) modeSecours();
    });
  }

  // ---------- Ouverture / fermeture ----------
  document.querySelectorAll(".ouvrir-paiement").forEach(function (b) {
    b.addEventListener("click", function () {
      etat.forfait = b.dataset.forfait;
      etat.periode = window.periodeChoisie || "annuel";
      etat.bouton = b;
      dialog.showModal();
      afficher();
    });
  });

  dialog.querySelectorAll('input[name="p-periode"]').forEach(function (r) {
    r.addEventListener("change", function () { etat.periode = r.value; afficher(); });
  });

  function fermer() { dialog.close(); }
  dialog.querySelector(".paiement-fermer").addEventListener("click", fermer);
  dialog.addEventListener("click", function (e) { if (e.target === dialog) fermer(); }); // clic sur le fond
  dialog.addEventListener("close", function () {
    demande++;
    if (checkoutActif) { checkoutActif.destroy(); checkoutActif = null; }
  });
})();
