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
        '<td class="mono">' + esc(c.numero ? tel(c.numero) : (c.installation_complete ? "—" : "à installer")) + "</td>" +
        "<td>" + esc(c.appels_ce_mois) + "</td>" +
        "<td>" + (c.stripe_url ? '<a href="' + esc(c.stripe_url) + '" target="_blank" rel="noopener">Ouvrir ↗</a>' : "—") + "</td>" +
        "</tr>";
    }).join("") : '<tr><td colspan="8" class="vide-admin">Aucun client pour l\'instant.</td></tr>';
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

  document.getElementById("bouton-actualiser").addEventListener("click", function () { charger().catch(function () {}); chargerEtat(); chargerTableau(); });
  document.getElementById("bouton-deconnexion").addEventListener("click", async function () {
    await sb.auth.signOut(); location.replace("connexion.html");
  });
  message("Chargement…", "info");
  charger().then(function () { if (!document.getElementById("admin").hidden) { chargerEtat(); chargerTableau(); } })
    .catch(function () { message("Impossible de charger les clients.", "erreur"); });
})();
