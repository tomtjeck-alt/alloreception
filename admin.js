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

  document.getElementById("bouton-actualiser").addEventListener("click", function () { charger().catch(function () {}); chargerEtat(); });
  document.getElementById("bouton-deconnexion").addEventListener("click", async function () {
    await sb.auth.signOut(); location.replace("connexion.html");
  });
  message("Chargement…", "info");
  charger().then(function () { if (!document.getElementById("admin").hidden) chargerEtat(); })
    .catch(function () { message("Impossible de charger les clients.", "erreur"); });
})();
