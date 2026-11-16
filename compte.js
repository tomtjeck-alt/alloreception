// ===== Espace client Allo Réception : connexion, installation, tableau de bord =====
(function () {
  var C = window.ALLO_CONFIG || {};
  var page = document.body.dataset.page;
  var zoneMsg = document.getElementById("message");

  function message(texte, type) {
    if (!zoneMsg) return;
    zoneMsg.textContent = texte || "";
    zoneMsg.className = "message" + (type ? " message-" + type : "");
    zoneMsg.hidden = !texte;
  }
  // +18195550199 → +1 819 555-0199
  function tel(n) {
    var m = String(n || "").match(/^\+1(\d{3})(\d{3})(\d{4})$/);
    return m ? "+1 " + m[1] + " " + m[2] + "-" + m[3] : (n || "");
  }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  if (!window.supabase || !C.supabaseUrl || C.supabaseUrl === "A_REMPLACER") {
    message("L'espace client sera disponible très bientôt. Pour toute question : contact@alloreception.ca", "info");
    return;
  }
  // Lu AVANT la création du client Supabase (qui efface l'adresse après l'avoir lue)
  var hashDepart = location.hash || "";
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseCleAnon);

  // ---------- Liens reçus par courriel (invitation, connexion, nouveau mot de passe) ----------
  // Le lien mène à notre page avec ?token_hash=…&type=… ; le jeton n'est utilisé qu'au CLIC
  // sur le bouton : les robots qui inspectent les liens des courriels ne peuvent plus le « griller ».
  var paramsDepart = new URLSearchParams(location.search);
  var jetonLien = paramsDepart.get("token_hash");
  var typeLien = paramsDepart.get("type");
  if (!/^(invite|magiclink|recovery|email)$/.test(typeLien || "")) jetonLien = null;
  // Ancien format (jeton déjà utilisé par Supabase, résultat dans l'adresse après #)
  var hashParams = new URLSearchParams(hashDepart.replace(/^#/, ""));
  var erreurLien = hashParams.get("error_code") || hashParams.get("error");
  var typeHash = hashParams.get("type");
  var doitChoisirMdp = typeHash === "invite" || typeHash === "recovery";

  function messageLienInvalide() {
    message("Ce lien a déjà été utilisé ou a expiré. Allez sur la page Connexion et cliquez sur « Mot de passe oublié » pour en recevoir un nouveau, ou écrivez-nous : contact@alloreception.ca", "erreur");
  }

  // Affiche le bouton (ex. « Activer mon compte ») et attend le clic. Renvoie true si la session est ouverte.
  function activerLien(texteBouton) {
    return new Promise(function (resoudre) {
      var zone = document.createElement("div");
      zone.className = "activation-lien";
      var b = document.createElement("button");
      b.type = "button"; b.className = "bouton bouton-jaune"; b.textContent = texteBouton;
      zone.appendChild(b);
      zoneMsg.insertAdjacentElement("afterend", zone);
      message("Cliquez sur le bouton ci-dessous pour continuer.", "info");
      b.addEventListener("click", async function () {
        occupe(b, true, "Un instant…");
        await sb.auth.signOut({ scope: "local" });
        var r = await sb.auth.verifyOtp({ token_hash: jetonLien, type: typeLien });
        history.replaceState(null, "", location.pathname);
        zone.remove();
        if (r.error || !r.data.session) { messageLienInvalide(); return resoudre(false); }
        message("");
        doitChoisirMdp = typeLien === "invite" || typeLien === "recovery";
        resoudre(true);
      });
    });
  }

  // Appelle une fonction du serveur et renvoie un message d'erreur clair
  async function fonction(nom, corps) {
    // Loi 25 : traitement forcé au Canada (région ca-central-1 de Supabase)
    var r = await sb.functions.invoke(nom + "?forceFunctionRegion=ca-central-1", { body: corps || {} });
    if (r.error) {
      var detail = null;
      try { detail = await r.error.context.json(); } catch (e) {}
      throw new Error((detail && detail.erreur) || "Une erreur est survenue. Réessayez dans un instant.");
    }
    return r.data;
  }
  function occupe(bouton, oui, texte) {
    if (!bouton) return;
    if (oui) { bouton.dataset.texte = bouton.textContent; bouton.textContent = texte || "Un instant…"; }
    else if (bouton.dataset.texte) bouton.textContent = bouton.dataset.texte;
    bouton.disabled = oui;
  }
  async function sessionOuConnexion() {
    var s = (await sb.auth.getSession()).data.session;
    if (!s) { location.replace("connexion.html?retour=" + encodeURIComponent(location.pathname.split("/").pop())); return null; }
    return s;
  }
  async function monEntreprise() {
    var r = await sb.from("mon_tableau").select("*").maybeSingle();
    if (r.error) throw r.error;
    return r.data;
  }

  // ---------------- Page Connexion ----------------
  if (page === "connexion") {
    var params = new URLSearchParams(location.search);
    var retour = params.get("retour") || "espace-client.html";
    if (!/^[a-z-]+\.html$/.test(retour)) retour = "espace-client.html";
    var formC = document.getElementById("form-connexion");
    var formN = document.getElementById("form-nouveau");

    sb.auth.onAuthStateChange(function (evt) {
      if (evt === "PASSWORD_RECOVERY") { formC.hidden = true; formN.hidden = false; }
    });
    if (jetonLien) {
      // Lien « mot de passe oublié » ou « lien de connexion » reçu par courriel
      formC.hidden = true;
      activerLien(typeLien === "recovery" ? "Choisir mon nouveau mot de passe" : "Me connecter").then(function (ok) {
        if (!ok) { formC.hidden = false; return; }
        if (typeLien === "recovery") { formN.hidden = false; } else { location.replace(retour); }
      });
    } else if (erreurLien) {
      messageLienInvalide();
    } else {
      sb.auth.getSession().then(function (r) {
        if (r.data.session && typeHash !== "recovery") location.replace(retour);
      });
    }

    formC.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var b = formC.querySelector("button[type=submit]");
      occupe(b, true, "Connexion…"); message("");
      var r = await sb.auth.signInWithPassword({ email: formC.courriel.value.trim(), password: formC.motdepasse.value });
      occupe(b, false);
      if (r.error) return message("Courriel ou mot de passe incorrect.", "erreur");
      location.replace(retour);
    });
    document.getElementById("lien-magique").addEventListener("click", async function () {
      var courriel = formC.courriel.value.trim();
      if (!courriel) return message("Entrez d'abord votre courriel.", "erreur");
      occupe(this, true, "Envoi…");
      var r = await sb.auth.signInWithOtp({ email: courriel, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname.replace(/[^/]*$/, "") + retour } });
      occupe(this, false);
      message(r.error ? "Aucun compte trouvé pour ce courriel." : "Un lien de connexion vous a été envoyé par courriel.", r.error ? "erreur" : "succes");
    });
    document.getElementById("oubli").addEventListener("click", async function () {
      var courriel = formC.courriel.value.trim();
      if (!courriel) return message("Entrez d'abord votre courriel.", "erreur");
      occupe(this, true, "Envoi…");
      await sb.auth.resetPasswordForEmail(courriel, { redirectTo: location.origin + location.pathname });
      occupe(this, false);
      message("Si un compte existe, vous recevrez un courriel pour choisir un nouveau mot de passe.", "succes");
    });
    formN.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      if (formN.motdepasse.value.length < 8) return message("Le mot de passe doit avoir au moins 8 caractères.", "erreur");
      var r = await sb.auth.updateUser({ password: formN.motdepasse.value });
      if (r.error) return message("Le lien a expiré. Recommencez « Mot de passe oublié ».", "erreur");
      location.replace(retour);
    });
  }

  // ---------------- Page Installation ----------------
  if (page === "installation") {
    (async function () {
      if (jetonLien) {
        if (!(await activerLien(typeLien === "magiclink" ? "Ouvrir mon compte" : "Activer mon compte"))) return;
      } else if (erreurLien) {
        // Lien déjà utilisé ou expiré : on le dit clairement au lieu de renvoyer en silence à la connexion
        messageLienInvalide();
        return;
      }
      if (!(await sessionOuConnexion())) return;
      var e = await monEntreprise();
      var form = document.getElementById("form-installation");
      // Nouveau client (invitation) ou nouveau mot de passe : le mot de passe est obligatoire
      if (doitChoisirMdp) {
        form.motdepasse.required = true;
        form.motdepasse.placeholder = "8 caractères minimum";
        form.motdepasse.closest("label").firstChild.textContent = "Choisissez votre mot de passe * (pour vous reconnecter plus tard)";
      }
      if (!e) { message("Aucun abonnement n'est associé à ce compte. Écrivez-nous : contact@alloreception.ca", "erreur"); return; }
      ["nom", "secteur", "adresse", "telephone_entreprise", "heures", "services_prix", "consignes", "courriel_resumes"]
        .forEach(function (c) { if (form[c]) form[c].value = e[c] || ""; });
      document.getElementById("forfait-actuel").textContent = e.forfait_nom + (e.statut === "essai" ? " · essai gratuit" : "");
      form.hidden = false;
      if (e.installation_complete) document.getElementById("titre-installation").textContent = "Mes réglages";

      form.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        var b = form.querySelector("button[type=submit]");
        message("");
        if (form.motdepasse.value) {
          if (form.motdepasse.value.length < 8) return message("Le mot de passe doit avoir au moins 8 caractères.", "erreur");
          occupe(b, true, "Enregistrement du mot de passe…");
          var p = await sb.auth.updateUser({ password: form.motdepasse.value });
          occupe(b, false);
          if (p.error) return message("Votre mot de passe n'a PAS été enregistré (" + p.error.message + "). Réessayez avec un autre mot de passe, ou écrivez-nous : contact@alloreception.ca", "erreur");
          doitChoisirMdp = false;
          form.motdepasse.value = "";
          form.motdepasse.required = false;
          message("Mot de passe enregistré ✔", "succes");
        }
        occupe(b, true, "Enregistrement…");
        var maj = {};
        ["nom", "secteur", "adresse", "telephone_entreprise", "heures", "services_prix", "consignes", "courriel_resumes"]
          .forEach(function (c) { maj[c] = form[c].value.trim(); });
        var r = await sb.from("entreprises").update(maj).eq("id", e.id);
        if (r.error) { occupe(b, false); return message("Enregistrement impossible : " + r.error.message, "erreur"); }
        try {
          if (!e.numero_vapi) occupe(b, true, "Création de votre numéro…");
          var res = await fonction("installer");
          location.href = "espace-client.html?pret=" + encodeURIComponent(res.numero || "");
        } catch (err) { occupe(b, false); message(err.message, "erreur"); }
      });
    })().catch(function (err) { message(err.message, "erreur"); });
  }

  // ---------------- Page Espace client ----------------
  if (page === "espace") {
    (async function () {
      var s = await sessionOuConnexion();
      if (!s) return;
      var e = await monEntreprise();
      if (!e) { message("Aucun abonnement n'est associé à " + s.user.email + ". Écrivez-nous : contact@alloreception.ca", "erreur"); return; }
      if (!e.installation_complete) { location.replace("installation.html"); return; }

      var STATUTS = { essai: "Essai gratuit", actif: "Actif", suspendu: "Suspendu (paiement en attente)", annule: "Annulé" };
      var utilise = Number(e.minutes_utilisees), limite = Number(e.minutes_limite);
      var pct = Math.min(100, Math.round(utilise / limite * 100));
      var nom = function (id) { return document.getElementById(id); };
      nom("e-nom").textContent = e.nom;
      nom("e-forfait").textContent = e.forfait_nom;
      nom("e-statut").textContent = STATUTS[e.statut] || e.statut;
      nom("e-statut").className = "pastille-statut statut-" + e.statut;
      nom("e-numero").textContent = tel(e.numero_vapi) || "—";
      nom("e-minutes").textContent = utilise.toLocaleString("fr-CA") + " / " + limite.toLocaleString("fr-CA") + " min";
      nom("e-minutes-detail").textContent = e.statut === "essai"
        ? "Minutes d'essai gratuit" + (e.essai_fin ? " · jusqu'au " + new Date(e.essai_fin).toLocaleDateString("fr-CA", { day: "numeric", month: "long" }) : "")
        : "Ce mois-ci" + (utilise > limite && e.minutes_a_l_usage ? " · " + Math.ceil(utilise - limite) + " min supplémentaires à 0,35 $" : "");
      nom("e-jauge").style.width = pct + "%";
      if (pct >= 80) nom("e-jauge").classList.add("jauge-alerte");
      if (e.minutes_pack > 0) nom("e-minutes-detail").textContent += " · Pack : " + e.minutes_pack.toLocaleString("fr-CA") + " min en réserve";

      // Forfaits sans facturation à la minute (annuels) : packs de minutes et forfait supérieur
      if (e.statut === "actif" && !e.minutes_a_l_usage) {
        var epuise = utilise >= limite && e.minutes_pack < 1;
        var texte = epuise
          ? "Vos minutes du mois sont épuisées. Votre réceptionniste répond toujours, mais prend seulement les messages (nom, numéro, raison de l'appel). Ajoutez des minutes pour retrouver le service complet."
          : pct >= 80
            ? "Vous avez utilisé " + pct + " % de vos minutes ce mois-ci. Ajoutez un pack pour ne manquer aucun appel."
            : "Besoin de plus de minutes ? Ajoutez un pack de 100 minutes pour 35 $ (sans expiration) ou passez au forfait supérieur.";
        nom("alerte-texte").textContent = texte;
        nom("alerte-minutes").hidden = false;
        if (epuise || pct >= 80) nom("alerte-minutes").classList.add("alerte-forte");
        nom("bouton-pack").hidden = false;
        if (e.forfait !== "premium") nom("bouton-superieur").hidden = false;
      }
      if (new URLSearchParams(location.search).get("pack") === "merci") {
        message("Merci ! Vos minutes seront ajoutées dans quelques secondes. Actualisez la page pour les voir.", "succes");
      }
      nom("bouton-pack").addEventListener("click", async function () {
        occupe(this, true, "Ouverture…");
        try { location.href = (await fonction("acheter-minutes")).url; }
        catch (err) { occupe(this, false); message(err.message, "erreur"); }
      });
      nom("bouton-superieur").addEventListener("click", async function () {
        occupe(this, true, "Ouverture…");
        try { location.href = (await fonction("portail-stripe", { action: "changer-forfait" })).url; }
        catch (err) { occupe(this, false); message(err.message, "erreur"); }
      });

      var pret = new URLSearchParams(location.search).get("pret");
      if (pret) {
        nom("bienvenue").hidden = false;
        nom("numero-pret").textContent = tel(pret);
      }

      var appels = await sb.from("appels").select("debut, appelant, duree_secondes, resume")
        .order("debut", { ascending: false }).limit(50);
      var liste = nom("liste-appels");
      if (!appels.data || !appels.data.length) {
        liste.innerHTML = '<p class="vide">Aucun appel pour l\'instant. Ils apparaîtront ici dès que votre réceptionniste répondra.</p>';
      } else {
        liste.innerHTML = appels.data.map(function (a) {
          var d = a.debut ? new Date(a.debut) : null;
          var quand = d ? d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }) : "";
          var duree = Math.floor(a.duree_secondes / 60) + " min " + String(a.duree_secondes % 60).padStart(2, "0") + " s";
          return '<details class="appel"><summary><span class="mono">' + esc(quand) + "</span><strong>" + esc(tel(a.appelant) || "Numéro masqué") +
            '</strong><span class="duree">' + esc(duree) + "</span></summary><p>" + esc(a.resume || "Résumé non disponible.") + "</p></details>";
        }).join("");
      }

      nom("bouton-portail").addEventListener("click", async function () {
        occupe(this, true, "Ouverture…");
        try { location.href = (await fonction("portail-stripe")).url; }
        catch (err) { occupe(this, false); message(err.message, "erreur"); }
      });
      nom("bouton-deconnexion").addEventListener("click", async function () {
        await sb.auth.signOut(); location.replace("connexion.html");
      });
      nom("bouton-suppression").addEventListener("click", function () { nom("zone-suppression").hidden = false; this.hidden = true; });
      nom("zone-suppression").addEventListener("submit", async function (ev) {
        ev.preventDefault();
        if (this.confirmation.value.trim() !== "SUPPRIMER") return message("Tapez SUPPRIMER en majuscules pour confirmer.", "erreur");
        var b = this.querySelector("button[type=submit]");
        occupe(b, true, "Suppression…");
        try {
          await fonction("supprimer-compte", { confirmation: "SUPPRIMER" });
          await sb.auth.signOut();
          location.replace("index.html");
        } catch (err) { occupe(b, false); message(err.message, "erreur"); }
      });
      nom("tableau").hidden = false;
    })().catch(function (err) { message(err.message, "erreur"); });
  }
})();
