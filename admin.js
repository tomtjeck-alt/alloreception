// ===== Page d'administration Allo Réception (admin.html) =====
// Les données viennent de la fonction serveur « admin-clients », qui vérifie que le compte
// connecté est bien l'administrateur. Tout autre visiteur est renvoyé vers la page de connexion.
(function () {
  var C = window.ALLO_CONFIG || {};
  var zoneMsg = document.getElementById("message");
  function message(texte, type) {
    zoneMsg.textContent = texte || "";
    zoneMsg.className = "message" + (type ? " message-" + type : "");
    zoneMsg.hidden = !texte;
  }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function tel(n) {
    var m = String(n || "").match(/^\+1(\d{3})(\d{3})(\d{4})$/);
    return m ? "+1 " + m[1] + " " + m[2] + "-" + m[3] : (n || "—");
  }
  function versConnexion() { location.replace("connexion.html?retour=admin.html"); }

  if (!window.supabase || !C.supabaseUrl) { versConnexion(); return; }
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseCleAnon);

  async function charger() {
    var s = (await sb.auth.getSession()).data.session;
    if (!s) return versConnexion();
    var aal = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!aal.data || aal.data.currentLevel !== "aal2") return versConnexion();
    // Loi 25 : traitement forcé au Canada
    var r = await sb.functions.invoke("admin-clients?forceFunctionRegion=ca-central-1", { body: {} });
    if (r.error) {
      var statut = r.error.context && r.error.context.status;
      if (statut === 401 || statut === 403) { await sb.auth.signOut(); return versConnexion(); }
      return message("Impossible de charger les clients. Réessayez dans un instant.", "erreur");
    }
    afficher(r.data);
  }

  function afficher(d) {
    var liste = d.clients || [];
    var nb = function (code) { return liste.filter(function (c) { return c.statut_code === code; }).length; };
    document.getElementById("a-total").textContent = liste.length;
    document.getElementById("a-actifs").textContent = nb("actif");
    document.getElementById("a-essais").textContent = nb("essai");
    document.getElementById("a-appels").textContent = liste.reduce(function (t, c) { return t + c.appels_ce_mois; }, 0);
    var corps = document.getElementById("liste-clients");
    corps.innerHTML = liste.length ? liste.map(function (c) {
      var date = c.inscrit_le ? new Date(c.inscrit_le).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" }) : "—";
      return "<tr>" +
        '<th scope="row">' + esc(c.nom) + "</th>" +
        "<td>" + esc(c.courriel) + "</td>" +
        "<td>" + esc(c.forfait) + "</td>" +
        '<td><span class="pastille-statut statut-' + esc(c.statut_code) + '">' + esc(c.statut) + "</span></td>" +
        "<td>" + esc(date) + "</td>" +
        (c.numero ? '<td class="mono">' + esc(tel(c.numero)) + "</td>"
          : c.en_attente ? '<td><span class="etat-pastille pastille-attention">En attente</span>' +
              '<span class="attente-raison">' + esc(c.attente_raison || "") + "</span>" +
              '<button type="button" class="bouton bouton-contour-clair bouton-petit bouton-numero" data-id="' + esc(c.id) + '">Créer le numéro</button></td>'
          : '<td class="mono">' + esc(c.installation_complete ? "—" : "à installer") + "</td>") +
        "<td>" + esc(c.appels_ce_mois) + "</td>" +
        "<td>" + (c.stripe_url ? '<button type="button" class="bouton bouton-contour-clair bouton-petit bouton-stripe" data-idx="' + esc(liste.indexOf(c)) + '">Ouvrir</button>' : "—") + "</td>" +
        "</tr>";
    }).join("") : '<tr><td colspan="8" class="vide-admin">Aucun client pour l\'instant.</td></tr>';
    var dlgStripe = document.getElementById("dialog-stripe");
    if (dlgStripe) {
      var btnFermer = document.getElementById("fermer-stripe");
      if (btnFermer && !btnFermer.dataset.ok) {
        btnFermer.dataset.ok = "1";
        btnFermer.addEventListener("click", function () { dlgStripe.close(); });
      }
      corps.querySelectorAll(".bouton-stripe").forEach(function (b) {
        b.addEventListener("click", function () {
          var c = liste[Number(b.getAttribute("data-idx"))];
          if (!c) return;
          document.getElementById("stripe-titre").textContent = c.nom || "Client";
          var cid = (c.stripe_url || "").split("/customers/")[1] || "—";
          document.getElementById("stripe-details").innerHTML =
            "<div><strong>Courriel :</strong> " + esc(c.courriel) + "</div>" +
            "<div><strong>Forfait :</strong> " + esc(c.forfait) + "</div>" +
            "<div><strong>Statut :</strong> " + esc(c.statut) + "</div>" +
            "<div><strong>Numéro :</strong> " + esc(tel(c.numero)) + "</div>" +
            "<div><strong>Appels ce mois :</strong> " + esc(c.appels_ce_mois) + "</div>" +
            '<div><strong>ID client Stripe :</strong> <span class="mono">' + esc(cid) + "</span></div>";
          document.getElementById("stripe-lien-zone").innerHTML =
            c.stripe_url ? 'Note : Stripe bloque l\'affichage intégré ; <a href="' + esc(c.stripe_url) + '" target="_blank" rel="noopener">ouvrir quand même dans Stripe ↗</a>' : "";
          dlgStripe.showModal();
        });
      });
    }
    // Bouton « Créer le numéro » d'un client en attente (un seul envoi à la fois)
    corps.querySelectorAll(".bouton-numero").forEach(function (b) {
      b.addEventListener("click", async function () {
        if (b.disabled) return;
        b.disabled = true; b.textContent = "Création…";
        var resultat;
        try {
          var r = await sb.functions.invoke("admin-installer?forceFunctionRegion=ca-central-1", { body: { entreprise_id: b.getAttribute("data-id") } });
          var d2 = r.data || {};
          resultat = (r.error || !d2.ok)
            ? ["Le numéro n'a pas pu être créé : " + (d2.raison || "erreur du serveur") + " Réglez la cause, puis réessayez.", "erreur"]
            : ["Numéro créé : " + tel(d2.numero) + ". Le client a reçu le courriel « Votre réceptionniste est prête ».", "succes"];
        } catch (e) {
          resultat = ["Le numéro n'a pas pu être créé. Réessayez dans un instant.", "erreur"];
        }
        await charger().catch(function () {});
        message(resultat[0], resultat[1]);
        chargerEtat();
      });
    });
    document.getElementById("a-maj").textContent = "Mis à jour le " + new Date(d.genere_le).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
    message("");
    document.getElementById("admin").hidden = false;
  }

  // ----- État du système en direct (fonction serveur « etat-systeme », lecture seule) -----
  var ETATS = { ok: "OK", attention: "À surveiller", panne: "En panne", inconnu: "À vérifier" };
  var ORDRE = { panne: 0, attention: 1, inconnu: 2, ok: 3 };
  var enCoursEtat = false;
  async function chargerEtat() {
    if (enCoursEtat) return;
    enCoursEtat = true;
    var liste = document.getElementById("etat-liste");
    var maj = document.getElementById("etat-maj");
    maj.textContent = "Vérification en cours…";
    liste.setAttribute("aria-busy", "true");
    try {
      var r = await sb.functions.invoke("etat-systeme?forceFunctionRegion=ca-central-1", { body: {} });
      if (r.error) {
        var statut = r.error.context && r.error.context.status;
        if (statut === 401 || statut === 403) { await sb.auth.signOut(); return versConnexion(); }
        maj.textContent = "Impossible de vérifier l'état du système pour l'instant. Réessayez avec « Actualiser ».";
        return;
      }
      var v = ((r.data && r.data.verifications) || []).slice();
      v.sort(function (a, b) { return (a.etat in ORDRE ? ORDRE[a.etat] : 4) - (b.etat in ORDRE ? ORDRE[b.etat] : 4); });
      liste.innerHTML = v.map(function (x) {
        return '<li class="etat-ligne etat-' + esc(x.etat) + '">' +
          '<span class="etat-pastille">' + esc(ETATS[x.etat] || x.etat) + "</span>" +
          '<div class="etat-texte"><strong>' + esc(x.service) + "</strong><span>" + esc(x.resume) + "</span>" +
          (x.action ? "<em>À faire : " + esc(x.action) + "</em>" : "") + "</div></li>";
      }).join("");
      var pannes = v.filter(function (x) { return x.etat === "panne"; }).length;
      maj.textContent = (pannes ? pannes + " service(s) en panne · " : "Aucune panne · ") +
        "vérifié le " + new Date(r.data.genere_le).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      maj.textContent = "Impossible de vérifier l'état du système pour l'instant. Réessayez avec « Actualiser ».";
    } finally {
      enCoursEtat = false;
      liste.removeAttribute("aria-busy");
    }
  }

  // ----- Tableau de bord : travaux, tâches, comptes à payer, évolution (fonction « admin-tableau ») -----
  var TB = { travaux: [], taches: [], couts: [], historique: [] };
  var MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  function jour(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? (+m[3]) + " " + MOIS[+m[2] - 1] + " " + m[1] : (iso || "");
  }
  function pastille(texte, classe) { return '<span class="etat-pastille ' + classe + '">' + esc(texte) + "</span>"; }
  function ligneVide(n, texte) { return '<tr><td colspan="' + n + '" class="vide-admin">' + esc(texte) + "</td></tr>"; }
  var COLONNES = [["Réalisé", "realise"], ["En cours", "en-cours"], ["À faire", "a-faire"], ["Non réalisé", "non-realise"]];

  function afficherTravaux() {
    var t = TB.travaux, domaine = document.getElementById("tb-domaine").value;
    var compte = function (s) { return t.filter(function (r) { return r.statut === s; }).length; };
    var total = t.length || 1, r = compte("Réalisé");
    document.getElementById("tb-avancement").textContent = Math.round(r / total * 100) + " % des travaux sont réalisés : " +
      r + " réalisés, " + compte("En cours") + " en cours, " + compte("À faire") + " à faire et " + compte("Non réalisé") + " non réalisés (refusés, abandonnés ou remplacés).";
    document.getElementById("tb-barre").innerHTML = COLONNES.map(function (c) {
      return '<span class="barre-' + c[1] + '" style="width:' + (compte(c[0]) / total * 100) + '%"></span>';
    }).join("");
    COLONNES.forEach(function (c) {
      var rows = t.filter(function (x) { return x.statut === c[0] && (!domaine || x.domaine === domaine); });
      if (c[0] === "Réalisé" || c[0] === "Non réalisé") rows.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      document.getElementById("tb-n-" + c[1]).textContent = compte(c[0]);
      document.getElementById("tb-col-" + c[1]).innerHTML = rows.length ? rows.map(function (x) {
        return '<li class="admin-carte"><strong>' + esc(x.travail) + "</strong><span>" +
          esc([x.domaine, x.date ? jour(x.date) : "", x.qui].filter(Boolean).join(" · ")) + "</span>" +
          (x.note ? "<em>" + esc(x.note) + "</em>" : "") + "</li>";
      }).join("") : '<li class="admin-carte"><span>Rien dans ce domaine.</span></li>';
    });
  }

  function afficherTaches() {
    var p = document.getElementById("tb-priorite").value, q = document.getElementById("tb-qui").value;
    var ordre = { "Urgent": 0, "Important": 1, "Plus tard": 2 };
    var classe = { "Urgent": "pastille-panne", "Important": "pastille-attention", "Plus tard": "pastille-inconnu" };
    var rows = TB.taches.filter(function (r) { return (!p || r.priorite === p) && (!q || String(r.qui).indexOf(q) !== -1); })
      .sort(function (a, b) { return (a.priorite in ordre ? ordre[a.priorite] : 3) - (b.priorite in ordre ? ordre[b.priorite] : 3); });
    document.getElementById("tb-taches").innerHTML = rows.length ? rows.map(function (r) {
      return "<tr><td>" + pastille(r.priorite, classe[r.priorite] || "pastille-inconnu") + '</td><th scope="row">' + esc(r.tache) + "</th><td>" +
        esc(r.pourquoi || "—") + "</td><td>" + esc(r.qui || "—") + "</td><td>" + esc(/^\d{4}-\d{2}-\d{2}$/.test(r.echeance || "") ? jour(r.echeance) : (r.echeance || "—")) +
        "</td><td>" + esc(r.etat || "—") + "</td></tr>";
    }).join("") : ligneVide(6, "Aucune tâche pour ce choix.");
  }

  function afficherCouts() {
    var prix = function (v) {
      if (v === null || v === undefined || v === "") return "À vérifier";
      v = +v; return v === 0 ? "0 $" : v.toLocaleString("fr-CA", { maximumFractionDigits: v < 1 ? 4 : 2, minimumFractionDigits: v < 1 ? 0 : 2 }) + " $";
    };
    var classe = function (s) { return /^Gratuit/.test(s) ? "pastille-ok" : s === "À activer" ? "pastille-attention" : "pastille-inconnu"; };
    document.getElementById("tb-couts").innerHTML = TB.couts.length ? TB.couts.map(function (r) {
      return '<tr><th scope="row">' + esc(r.service) + "</th><td>" + esc(r.poste) + "</td><td>" + esc(r.base) + '</td><td class="mono">' +
        esc(prix(r.prix_usd)) + "</td><td>" + pastille(r.statut, classe(r.statut)) + "</td><td>" + esc(r.note || "—") + "</td></tr>";
    }).join("") : ligneVide(6, "Aucune donnée.");
  }

  function afficherEvolution() {
    var h = TB.historique, parJour = {};
    h.forEach(function (r) { (parJour[r.date] = parJour[r.date] || { Site: 0, Serveur: 0 })[r.partie] = (parJour[r.date][r.partie] || 0) + 1; });
    var jours = Object.keys(parJour).sort(), max = 1;
    jours.forEach(function (d) { max = Math.max(max, parJour[d].Site + parJour[d].Serveur); });
    var L = 640, H = 220, b = 28, g = 8, larg = (L - g) / Math.max(jours.length, 1);
    var svg = '<svg viewBox="0 0 ' + L + " " + H + '" width="100%" role="img" aria-label="Changements publiés par jour, site et serveur">';
    jours.forEach(function (d, i) {
      var x = g + i * larg + larg * 0.18, w = larg * 0.64, s = parJour[d].Site, v = parJour[d].Serveur;
      var hs = s / max * (H - b - 24), hv = v / max * (H - b - 24), y0 = H - b;
      svg += '<rect class="barre-serveur" x="' + x + '" y="' + (y0 - hv) + '" width="' + w + '" height="' + hv + '"><title>' + esc(jour(d)) + " : " + v + " serveur</title></rect>";
      svg += '<rect class="barre-site" x="' + x + '" y="' + (y0 - hv - hs) + '" width="' + w + '" height="' + hs + '"><title>' + esc(jour(d)) + " : " + s + " site</title></rect>";
      svg += '<text class="graphe-total" x="' + (x + w / 2) + '" y="' + (y0 - hv - hs - 6) + '">' + (s + v) + "</text>";
      svg += '<text class="graphe-axe" x="' + (x + w / 2) + '" y="' + (H - 8) + '">' + esc(jour(d).replace(/ \d{4}$/, "")) + "</text>";
    });
    document.getElementById("tb-graphe").innerHTML = jours.length ? svg + "</svg>" : '<p class="vide-admin">Aucune publication.</p>';
    document.getElementById("tb-historique").innerHTML = h.length ? h.map(function (r) {
      return '<tr><td class="nowrap">' + esc(jour(r.date)) + '</td><td class="nowrap">' + esc(r.heure) + "</td><td>" + esc(r.partie) + "</td><td>" + esc(r.changement) + "</td></tr>";
    }).join("") : ligneVide(4, "Aucune publication.");
  }

  var enCoursTb = false;
  async function chargerTableau() {
    if (enCoursTb) return;
    enCoursTb = true;
    var err = document.getElementById("tb-erreur");
    try {
      var r = await sb.functions.invoke("admin-tableau?forceFunctionRegion=ca-central-1", { body: {} });
      if (r.error) {
        var statut = r.error.context && r.error.context.status;
        if (statut === 401 || statut === 403) { await sb.auth.signOut(); return versConnexion(); }
        err.textContent = "Impossible de charger les travaux, tâches et comptes à payer. Réessayez avec « Actualiser »."; err.hidden = false;
        return;
      }
      err.hidden = true;
      var d = (r.data && r.data.documents) || {};
      ["travaux", "taches", "couts", "historique"].forEach(function (k) { TB[k] = (d[k] && d[k].rows) || []; });
      TB.historique.sort(function (a, b) { return (b.date + b.heure).localeCompare(a.date + a.heure); });
      var sel = document.getElementById("tb-domaine"), choix = sel.value;
      var domaines = TB.travaux.map(function (x) { return x.domaine; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort(function (a, b) { return a.localeCompare(b, "fr"); });
      sel.innerHTML = '<option value="">Tous</option>' + domaines.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("");
      sel.value = domaines.indexOf(choix) !== -1 ? choix : "";
      afficherTravaux(); afficherTaches(); afficherCouts(); afficherEvolution();
      var dates = Object.keys(d).map(function (k) { return d[k].maj_le; }).filter(Boolean).sort();
      document.getElementById("tb-maj").textContent = dates.length ?
        "Travaux, tâches et comptes mis à jour par Claude le " + new Date(dates[dates.length - 1]).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" }) + "." : "";
    } catch (e) {
      err.textContent = "Impossible de charger les travaux, tâches et comptes à payer. Réessayez avec « Actualiser »."; err.hidden = false;
    } finally {
      enCoursTb = false;
    }
  }
  document.getElementById("tb-domaine").addEventListener("change", afficherTravaux);
  document.getElementById("tb-priorite").addEventListener("change", afficherTaches);
  document.getElementById("tb-qui").addEventListener("change", afficherTaches);

  // ----- Visiteurs du site (GoatCounter) -----
  async function chargerVisiteurs() {
    var totalEl = document.getElementById("v-total");
    var corps = document.getElementById("liste-visiteurs");
    var info = document.getElementById("v-info");
    if (!totalEl || !corps || !C.goatcounterCode || C.goatcounterCode === "A_REMPLACER") return;
    info.hidden = true;
    var base = "https://" + encodeURIComponent(C.goatcounterCode) + ".goatcounter.com/counter/";
    var pages = [
      { chemin: "/", nom: "Accueil (/)" },
      { chemin: "/index.html", nom: "Accueil (/index.html)" },
      { chemin: "/solution.html", nom: "Solution" },
      { chemin: "/forfaits.html", nom: "Forfaits" },
      { chemin: "/videos.html", nom: "Vidéos" },
      { chemin: "/faq.html", nom: "FAQ" },
      { chemin: "/contact.html", nom: "Contact" }
    ];
    async function lireCompteur(c) {
      var r = await fetch(base + encodeURIComponent(c) + ".json");
      if (!r.ok) throw new Error(String(r.status));
      var d = await r.json();
      return d && d.count ? String(d.count) : "0";
    }
    try {
      totalEl.textContent = await lireCompteur("TOTAL");
      var lignes = await Promise.all(pages.map(async function (p) {
        try { return { nom: p.nom, count: await lireCompteur(p.chemin) }; }
        catch (e) { return { nom: p.nom, count: "0" }; }
      }));
      corps.innerHTML = lignes.map(function (l) {
        return "<tr><td>" + esc(l.nom) + "</td><td><strong>" + esc(l.count) + "</strong></td></tr>";
      }).join("");
    } catch (e) {
      totalEl.textContent = "—";
      corps.innerHTML = "";
      info.textContent = "Activez « Allow adding visitor counts on your website » dans GoatCounter → Settings → Main pour afficher les chiffres ici.";
      info.hidden = false;
    }
  }

  // ----- Une page par titre : le menu montre une seule section à la fois (rien n'est supprimé) -----
  var PAGES = ["systeme", "clients", "visiteurs", "travaux", "a-realiser", "comptes", "evolution"];
  function montrerPage(nom, garderPosition) {
    if (PAGES.indexOf(nom) === -1) nom = "systeme";
    document.querySelectorAll(".admin-page").forEach(function (el) { el.hidden = el.getAttribute("data-page") !== nom; });
    document.querySelectorAll(".admin-nav a").forEach(function (a) {
      if (a.getAttribute("data-vers") === nom) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (location.hash !== "#" + nom) history.replaceState(null, "", "#" + nom);
    if (!garderPosition) {
      var nav = document.querySelector(".admin-nav");
      if (nav && nav.getBoundingClientRect().top < 0) window.scrollTo(0, nav.getBoundingClientRect().top + window.scrollY - 90);
    }
  }
  document.querySelectorAll(".admin-nav a").forEach(function (a) {
    a.addEventListener("click", function (ev) { ev.preventDefault(); montrerPage(a.getAttribute("data-vers")); });
  });
  window.addEventListener("hashchange", function () { montrerPage(location.hash.slice(1)); });
  montrerPage(location.hash.slice(1), true);

  var PROSPECTS = [];
  function messageProspect(p) {
    return "Bonjour l'équipe de " + p.nom + ",\n\n"
      + "Vous manquez parfois des appels quand vous êtes occupés avec un client ? "
      + "Allo Réception répond à vos appels et SMS 24/7, prend les rendez-vous directement dans Google Agenda et envoie les confirmations par texto.\n\n"
      + "Testez notre réceptionniste en direct au +1 782 223-3839 ou essayez 14 jours gratuitement sur https://alloreception.ca.\n\n"
      + "Allo Réception · Ottawa-Gatineau · contact@alloreception.ca (répondez « non » pour ne plus être contacté).";
  }
  function afficherProspects() {
    var corps = document.getElementById("tb-prospects");
    if (!corps) return;
    var filtre = (document.getElementById("pr-statut") || {}).value || "";
    var rows = PROSPECTS.filter(function (p) { return !filtre || p.statut === filtre; });
    if (!rows.length) { corps.innerHTML = ligneVide(5, "Aucun prospect. Lancez une recherche ci-dessus."); return; }
    corps.innerHTML = rows.map(function (p) {
      var contact = [
        p.telephone ? esc(p.telephone) : "",
        p.courriel ? '<a href="mailto:' + esc(p.courriel) + '">' + esc(p.courriel) + "</a>" : "",
        p.site_web && /^https?:\/\//i.test(p.site_web) ? '<a href="' + esc(p.site_web) + '" target="_blank" rel="noopener">Site</a>' : ""
      ].filter(Boolean).join("<br>") || "—";
      var sel = '<select data-pr-id="' + esc(p.id) + '">'
        + [["nouveau", "Nouveau"], ["contacte", "Contacté"], ["repondu", "Répondu"], ["ignore", "Ignoré"]].map(function (o) {
          return '<option value="' + o[0] + '"' + (p.statut === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
        }).join("") + "</select>";
      var btnEnvoi = p.courriel
        ? '<button type="button" class="bouton bouton-jaune bouton-petit" data-envoyer="' + esc(p.id) + '">Envoyer courriel</button> '
        : "";
      return "<tr><td><strong>" + esc(p.nom) + "</strong></td><td>" + esc(p.secteur) + "<br><span class=\"note-compte\">" + esc(p.ville) + "</span></td><td>" + contact + "</td><td>" + sel + "</td><td>" + btnEnvoi + "<button type=\"button\" class=\"bouton bouton-contour-clair bouton-petit\" data-copier=\"" + esc(p.id) + "\">Copier message</button></td></tr>";
    }).join("");
  }
  async function chargerProspects(action, extra) {
    var info = document.getElementById("pr-info");
    if (info && action === "rechercher") info.textContent = "Recherche en cours sur OpenStreetMap…";
    try {
      var r = await sb.functions.invoke("prospection?forceFunctionRegion=ca-central-1", { body: Object.assign({ action: action || "lister" }, extra || {}) });
      if (r.error) { if (info) info.textContent = "Erreur lors du chargement des prospects."; return; }
      PROSPECTS = (r.data && r.data.prospects) || [];
      afficherProspects();
      if (info) info.textContent = action === "rechercher"
        ? ((r.data.ajoutes || 0) + " nouvelle(s) entreprise(s) ajoutée(s) · " + PROSPECTS.length + " au total.")
        : (PROSPECTS.length + " prospect(s) enregistré(s).");
    } catch (_) { if (info) info.textContent = "Prospection indisponible pour l'instant."; }
  }
  var btnRech = document.getElementById("pr-rechercher");
  if (btnRech) btnRech.addEventListener("click", function () {
    chargerProspects("rechercher", {
      ville: (document.getElementById("pr-ville") || {}).value,
      secteur: (document.getElementById("pr-secteur") || {}).value,
    });
  });
  var selStatut = document.getElementById("pr-statut");
  if (selStatut) selStatut.addEventListener("change", afficherProspects);
  var tbPr = document.getElementById("tb-prospects");
  if (tbPr) {
    tbPr.addEventListener("change", async function (ev) {
      var el = ev.target;
      var id = el && el.getAttribute && el.getAttribute("data-pr-id");
      if (!id) return;
      await sb.functions.invoke("prospection?forceFunctionRegion=ca-central-1", { body: { action: "statut", id: id, statut: el.value } });
      var p = PROSPECTS.find(function (x) { return x.id === id; });
      if (p) p.statut = el.value;
    });
    tbPr.addEventListener("click", async function (ev) {
      var btnEnv = ev.target.closest && ev.target.closest("[data-envoyer]");
      if (btnEnv) {
        var pEnv = PROSPECTS.find(function (x) { return x.id === btnEnv.getAttribute("data-envoyer"); });
        if (!pEnv) return;
        btnEnv.disabled = true;
        btnEnv.textContent = "Envoi…";
        var res = await sb.functions.invoke("prospection?forceFunctionRegion=ca-central-1", {
          body: {
            action: "envoyer",
            id: pEnv.id,
            sujet: "Ne manquez plus aucun appel chez " + pEnv.nom,
            texte: messageProspect(pEnv),
          },
        });
        if (res.error || !res.data || !res.data.ok) {
          btnEnv.disabled = false;
          btnEnv.textContent = "Erreur";
          return;
        }
        pEnv.statut = "contacte";
        afficherProspects();
        return;
      }
      var btn = ev.target.closest && ev.target.closest("[data-copier]");
      if (!btn) return;
      var p = PROSPECTS.find(function (x) { return x.id === btn.getAttribute("data-copier"); });
      if (!p || !navigator.clipboard) return;
      navigator.clipboard.writeText(messageProspect(p));
      btn.textContent = "Copié !";
      setTimeout(function () { btn.textContent = "Copier message"; }, 1500);
    });
  }

  document.getElementById("bouton-actualiser").addEventListener("click", function () { charger().catch(function () {}); chargerEtat(); chargerTableau(); chargerVisiteurs(); chargerProspects(); });
  document.getElementById("bouton-deconnexion").addEventListener("click", async function () {
    await sb.auth.signOut(); location.replace("connexion.html");
  });
  message("Chargement…", "info");
  charger().then(function () { if (!document.getElementById("admin").hidden) { chargerEtat(); chargerTableau(); chargerVisiteurs(); chargerProspects(); } })
    .catch(function () { message("Impossible de charger les clients.", "erreur"); });
})();
