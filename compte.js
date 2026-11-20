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

  // Traduit en français les erreurs de Supabase (aucun mot anglais ne doit s'afficher au client)
  var ERREURS = {
    same_password: "Ce mot de passe est déjà le vôtre.",
    weak_password: "Ce mot de passe est trop faible. Choisissez-en un plus long, avec des lettres et des chiffres.",
    invalid_credentials: "Courriel ou mot de passe incorrect.",
    email_not_confirmed: "Votre compte n'est pas encore activé. Cliquez sur le lien reçu par courriel.",
    otp_expired: "Ce lien a déjà été utilisé ou a expiré.",
    session_not_found: "Votre session a expiré. Reconnectez-vous.",
    session_expired: "Votre session a expiré. Reconnectez-vous.",
    refresh_token_not_found: "Votre session a expiré. Reconnectez-vous.",
    reauthentication_needed: "Pour des raisons de sécurité, reconnectez-vous avant de changer votre mot de passe.",
    over_request_rate_limit: "Trop d'essais. Attendez quelques minutes, puis réessayez.",
    over_email_send_rate_limit: "Trop de courriels envoyés. Attendez quelques minutes, puis réessayez.",
    user_not_found: "Aucun compte trouvé pour ce courriel.",
    validation_failed: "Une information est invalide. Vérifiez le formulaire.",
    "23514": "Un des champs est trop long. Raccourcissez-le, puis réessayez.",
  };
  var MESSAGES = [
    [/should be different from the old password/i, "same_password"],
    [/password should be|password is too weak|weak password/i, "weak_password"],
    [/invalid login credentials/i, "invalid_credentials"],
    [/email not confirmed/i, "email_not_confirmed"],
    [/expired|invalid or has expired/i, "otp_expired"],
    [/auth session missing|session.*not found/i, "session_not_found"],
    [/rate limit|too many requests/i, "over_request_rate_limit"],
  ];
  function codeErreur(err) {
    if (!err) return "";
    if (err.code && ERREURS[err.code]) return err.code;
    var t = String(err.message || err);
    for (var i = 0; i < MESSAGES.length; i++) if (MESSAGES[i][0].test(t)) return MESSAGES[i][1];
    return "";
  }
  function enFrancais(err) {
    if (err && err.francais) return err.message;
    var c = codeErreur(err);
    if (c) return ERREURS[c];
    if (/fetch|network|load failed/i.test(String(err && err.message))) return "Connexion Internet impossible. Vérifiez votre connexion, puis réessayez.";
    return "Une erreur est survenue. Réessayez dans un instant, ou écrivez-nous : contact@alloreception.ca";
  }

  // Appelle une fonction du serveur et renvoie un message d'erreur clair (déjà en français)
  async function fonction(nom, corps) {
    // Loi 25 : traitement forcé au Canada (région ca-central-1 de Supabase)
    var r = await sb.functions.invoke(nom + "?forceFunctionRegion=ca-central-1", { body: corps || {} });
    if (r.error) {
      var detail = null;
      try { detail = await r.error.context.json(); } catch (e) {}
      var err = new Error((detail && detail.erreur) || "Une erreur est survenue. Réessayez dans un instant.");
      err.francais = true;
      throw err;
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
    var form2fa = document.getElementById("form-2fa");
    async function continuerApresMotDePasse() {
      var aal = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.data && aal.data.nextLevel === "aal2" && aal.data.currentLevel !== "aal2") {
        formC.hidden = true;
        if (form2fa) form2fa.hidden = false;
        message("Entrez le code à 6 chiffres de votre application d'authentification.", "info");
        return;
      }
      location.replace(retour);
    }

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
        if (r.data.session && typeHash !== "recovery") continuerApresMotDePasse();
      });
    }

    formC.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var b = formC.querySelector("button[type=submit]");
      occupe(b, true, "Connexion…"); message("");
      var r = await sb.auth.signInWithPassword({ email: formC.courriel.value.trim(), password: formC.motdepasse.value });
      occupe(b, false);
      if (r.error) return message("Courriel ou mot de passe incorrect.", "erreur");
      await continuerApresMotDePasse();
    });
    if (form2fa) {
      form2fa.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        var b = form2fa.querySelector("button[type=submit]");
        occupe(b, true, "Vérification…"); message("");
        var f = await sb.auth.mfa.listFactors();
        var totp = f.data && f.data.totp && f.data.totp.find(function (x) { return x.status === "verified"; });
        if (!totp) { occupe(b, false); return message("Facteur 2FA introuvable.", "erreur"); }
        var v = await sb.auth.mfa.challengeAndVerify({ factorId: totp.id, code: form2fa.code.value.trim() });
        occupe(b, false);
        if (v.error) return message("Code invalide ou expiré. Réessayez.", "erreur");
        location.replace(retour);
      });
    }
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
      var b = formN.querySelector("button[type=submit]");
      if (b && b.disabled) return;
      occupe(b, true, "Enregistrement…");
      var r = await sb.auth.updateUser({ password: formN.motdepasse.value });
      // « déjà votre mot de passe » = succès
      if (r.error && codeErreur(r.error) !== "same_password") {
        occupe(b, false);
        var c = codeErreur(r.error);
        return message(c === "session_not_found" || c === "otp_expired" ? "Le lien a expiré. Recommencez « Mot de passe oublié »." : "Votre mot de passe n'a PAS été enregistré : " + enFrancais(r.error), "erreur");
      }
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
      ["nom", "secteur", "adresse", "telephone_entreprise", "heures", "services_prix", "consignes", "courriel_resumes", "telephone_transfert"]
        .forEach(function (c) { if (form[c]) form[c].value = e[c] || ""; });
      if (form.transfert_actif) form.transfert_actif.checked = !!e.transfert_actif;
      var blocAgenda = document.getElementById("bloc-agenda");
      var etatAgenda = document.getElementById("etat-agenda");
      var btnAgenda = document.getElementById("btn-agenda");
      function rafraichirAgenda() {
        if (!blocAgenda) return;
        blocAgenda.hidden = !e.rendez_vous;
        if (!e.rendez_vous) return;
        if (form.agenda_duree_minutes) form.agenda_duree_minutes.value = String(e.agenda_duree_minutes || 30);
        if (etatAgenda) etatAgenda.textContent = e.agenda_connecte ? "Connecté (" + (e.agenda_courriel || "Google Agenda") + ")" : "Non connecté";
        if (btnAgenda) btnAgenda.textContent = e.agenda_connecte ? "Déconnecter" : "Connecter mon Google Agenda";
      }
      rafraichirAgenda();
      var retourAgenda = new URLSearchParams(location.search).get("agenda");
      if (retourAgenda === "ok") message("Google Agenda connecté avec succès !", "succes");
      else if (retourAgenda === "annule") message("Connexion à Google Agenda annulée.", "info");
      else if (retourAgenda === "erreur") message("Impossible de connecter Google Agenda. Réessayez.", "erreur");
      if (btnAgenda) {
        btnAgenda.addEventListener("click", async function () {
          occupe(btnAgenda, true, e.agenda_connecte ? "Déconnexion…" : "Redirection…");
          try {
            var rep = await appelServeur("google-agenda", { action: e.agenda_connecte ? "deconnecter" : "connecter" });
            if (rep && rep.url) { location.href = rep.url; return; }
            e.agenda_connecte = false; e.agenda_courriel = "";
            rafraichirAgenda();
            message("Google Agenda déconnecté.", "info");
          } catch (err) {
            message(err.message || "Erreur Google Agenda.", "erreur");
          } finally {
            occupe(btnAgenda, false);
          }
        });
      }
      document.getElementById("forfait-actuel").textContent = e.forfait_nom + (e.statut === "essai" ? " · essai gratuit" : "");
      // Brouillon gardé si la session a expiré pendant le remplissage (jamais le mot de passe)
      var CHAMPS = ["nom", "secteur", "adresse", "telephone_entreprise", "heures", "services_prix", "consignes", "courriel_resumes", "telephone_transfert"];
      try {
        var brouillon = JSON.parse(sessionStorage.getItem("allo-brouillon-installation") || "null");
        if (brouillon) {
          CHAMPS.forEach(function (c) { if (form[c] && brouillon[c] != null) form[c].value = brouillon[c]; });
          if (form.transfert_actif && brouillon.transfert_actif != null) form.transfert_actif.checked = !!brouillon.transfert_actif;
          sessionStorage.removeItem("allo-brouillon-installation");
          message("Vos informations ont été gardées. Vérifiez-les, puis cliquez sur le bouton.", "info");
        }
      } catch (x) {}
      form.hidden = false;
      if (e.installation_complete) document.getElementById("titre-installation").textContent = "Mes réglages";

      var envoiEnCours = false;      // empêche tout double envoi (double clic, touche Entrée…)
      var mdpEnregistre = null;      // mot de passe déjà enregistré pendant cette visite
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        if (envoiEnCours) return;
        var b = form.querySelector("button[type=submit]");
        var mdp = form.motdepasse.value;
        if (mdp && mdp.length < 8) return message("Le mot de passe doit avoir au moins 8 caractères.", "erreur");
        envoiEnCours = true;
        occupe(b, true, "Enregistrement…");   // bouton désactivé jusqu'à la fin, quoi qu'il arrive
        message("");
        var etapes = [];
        try {
          // 0) La session est-elle toujours valide ? (getSession la renouvelle si besoin)
          var s = (await sb.auth.getSession()).data.session;
          if (!s) {
            try {
              var d = {}; CHAMPS.forEach(function (c) { d[c] = form[c].value; });
              if (form.transfert_actif) d.transfert_actif = form.transfert_actif.checked;
              sessionStorage.setItem("allo-brouillon-installation", JSON.stringify(d));
            } catch (x) {}
            return message("Votre session a expiré : rien n'a été enregistré. Vos informations sont gardées. Reconnectez-vous sur la page Connexion (ou cliquez sur « Mot de passe oublié »), puis revenez ici.", "erreur");
          }
          // 1) Mot de passe (sauf s'il vient déjà d'être enregistré pendant cette visite)
          if (mdp && mdp !== mdpEnregistre) {
            b.textContent = "Enregistrement du mot de passe…";
            var p = await sb.auth.updateUser({ password: mdp });
            // « Ce mot de passe est déjà le vôtre » = le bon mot de passe est déjà enregistré : c'est un succès
            if (p.error && codeErreur(p.error) !== "same_password") {
              return message("Votre mot de passe n'a PAS été enregistré : " + enFrancais(p.error) + " Vos autres informations n'ont pas encore été envoyées.", "erreur");
            }
            mdpEnregistre = mdp;
            doitChoisirMdp = false;
            form.motdepasse.required = false;
            form.motdepasse.value = "";   // vidé : il ne sera pas renvoyé au prochain clic
            form.motdepasse.placeholder = "Mot de passe enregistré ✔ (laisser vide)";
          }
          if (mdpEnregistre) etapes.push("votre mot de passe");

          // 2) Informations de l'entreprise
          b.textContent = "Enregistrement de vos informations…";
          var maj = {};
          CHAMPS.forEach(function (c) { maj[c] = form[c].value.trim(); });
          if (form.transfert_actif) maj.transfert_actif = form.transfert_actif.checked;
          if (e.rendez_vous && form.agenda_duree_minutes) maj.agenda_duree_minutes = Number(form.agenda_duree_minutes.value) || 30;
          var r = await sb.from("entreprises").update(maj).eq("id", e.id).select("id");
          // Aucune ligne modifiée = refus silencieux de la base (session perdue) : c'est une erreur
          if (!r.error && (!r.data || !r.data.length)) r.error = { code: "session_not_found" };
          if (r.error) {
            return message((etapes.length ? "Votre mot de passe est enregistré ✔, mais vos informations n'ont pas pu l'être : " : "Vos informations n'ont pas pu être enregistrées : ") + enFrancais(r.error), "erreur");
          }
          etapes.push("les informations de votre entreprise");

          // 3) Numéro de téléphone de la réceptionniste
          if (!e.numero_vapi) b.textContent = "Création de votre numéro…";
          try {
            var res = await fonction("installer");
            // Numéro pas encore possible : l'installation est quand même terminée (« en préparation »)
            if (res && res.en_attente) { location.href = "espace-client.html?attente=1"; return; }
            location.href = "espace-client.html?pret=" + encodeURIComponent(res.numero || "");
          } catch (err) {
            message("C'est enregistré ✔ (" + etapes.join(" et ") + "). Mais la création du numéro de téléphone de votre réceptionniste n'a pas fonctionné (" + enFrancais(err).replace(/\.$/, "")
              + "). Inutile de retaper votre mot de passe : vous pouvez vous connecter avec. Réessayez plus tard en cliquant de nouveau sur le bouton, ou écrivez-nous : contact@alloreception.ca", "erreur");
          }
        } catch (err) {
          message(enFrancais(err), "erreur");
        } finally {
          envoiEnCours = false;
          occupe(b, false);
        }
      });
    })().catch(function (err) { message(enFrancais(err), "erreur"); });
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
      nom("e-numero").textContent = tel(e.numero_vapi) || (e.numero_en_attente ? "En préparation" : "—");
      if (e.numero_en_attente && !e.numero_vapi) nom("en-preparation").hidden = false;
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
        catch (err) { occupe(this, false); message(enFrancais(err), "erreur"); }
      });
      nom("bouton-superieur").addEventListener("click", async function () {
        occupe(this, true, "Ouverture…");
        try { location.href = (await fonction("portail-stripe", { action: "changer-forfait" })).url; }
        catch (err) { occupe(this, false); message(enFrancais(err), "erreur"); }
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
        catch (err) { occupe(this, false); message(enFrancais(err), "erreur"); }
      });
      nom("bouton-deconnexion").addEventListener("click", async function () {
        await sb.auth.signOut(); location.replace("connexion.html");
      });
      nom("bouton-suppression").addEventListener("click", function () { nom("zone-suppression").hidden = false; this.hidden = true; });
      // Double authentification (2FA)
      var facteur2fa = null, enrolementId = null;
      async function rafraichir2fa() {
        var etat = nom("etat-2fa"), btnA = nom("bouton-2fa-activer"), btnD = nom("bouton-2fa-desactiver"), fAjout = nom("form-2fa-ajout");
        if (!etat) return;
        var f = await sb.auth.mfa.listFactors();
        facteur2fa = (f.data && f.data.totp && f.data.totp.find(function (x) { return x.status === "verified"; })) || null;
        etat.textContent = facteur2fa ? "Double authentification activée ✔" : "Désactivée (recommandé pour protéger votre compte).";
        btnA.hidden = !!facteur2fa;
        btnD.hidden = !facteur2fa;
        if (facteur2fa && fAjout) fAjout.hidden = true;
      }
      if (nom("zone-2fa")) {
        rafraichir2fa();
        nom("bouton-2fa-activer").addEventListener("click", async function () {
          occupe(this, true, "Préparation…");
          var r = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "Allo Réception" });
          occupe(this, false);
          if (r.error) return message(enFrancais(r.error), "erreur");
          enrolementId = r.data.id;
          nom("qr-2fa").src = r.data.totp.qr_code;
          nom("secret-2fa").textContent = r.data.totp.secret;
          nom("form-2fa-ajout").hidden = false;
          this.hidden = true;
        });
        nom("form-2fa-ajout").addEventListener("submit", async function (ev) {
          ev.preventDefault();
          var b = this.querySelector("button[type=submit]");
          occupe(b, true, "Activation…");
          var v = await sb.auth.mfa.challengeAndVerify({ factorId: enrolementId, code: this.code.value.trim() });
          occupe(b, false);
          if (v.error) return message("Code invalide. Vérifiez l'heure de votre téléphone et réessayez.", "erreur");
          this.reset();
          await rafraichir2fa();
          message("Double authentification activée avec succès !", "succes");
        });
        nom("bouton-2fa-desactiver").addEventListener("click", async function () {
          if (!facteur2fa) return;
          occupe(this, true, "Désactivation…");
          var r = await sb.auth.mfa.unenroll({ factorId: facteur2fa.id });
          occupe(this, false);
          if (r.error) return message(enFrancais(r.error), "erreur");
          await rafraichir2fa();
          message("Double authentification désactivée.", "info");
        });
      }
      nom("zone-suppression").addEventListener("submit", async function (ev) {
        ev.preventDefault();
        if (this.confirmation.value.trim() !== "SUPPRIMER") return message("Tapez SUPPRIMER en majuscules pour confirmer.", "erreur");
        var b = this.querySelector("button[type=submit]");
        occupe(b, true, "Suppression…");
        try {
          await fonction("supprimer-compte", { confirmation: "SUPPRIMER" });
          await sb.auth.signOut();
          location.replace("index.html");
        } catch (err) { occupe(b, false); message(enFrancais(err), "erreur"); }
      });
      nom("tableau").hidden = false;
    })().catch(function (err) { message(enFrancais(err), "erreur"); });
  }
})();
