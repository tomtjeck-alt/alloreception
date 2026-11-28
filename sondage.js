// ===== Sondage interactif PME + résultats communautaires en direct (Alloreception.ca) =====
(function () {
  var form = document.getElementById("form-sondage");
  var msg = document.getElementById("sondage-message");
  var merci = document.getElementById("sondage-merci");
  var progresBarre = document.getElementById("sondage-progres-fill");
  var progresTexte = document.getElementById("sondage-progres-texte");
  var apercu = document.getElementById("sondage-apercu");
  var blocRes = document.getElementById("sondage-resultats");
  var resBudgets = document.getElementById("res-budgets");
  var resSecteurs = document.getElementById("res-secteurs");
  var resTotal = document.getElementById("res-total");
  var btnCopier = document.getElementById("btn-copier-sondage");
  if (!form) return;

  var params = new URLSearchParams(location.search);
  var source = (params.get("src") || params.get("utm_source") || "direct").slice(0, 40);

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function afficherMessage(texte, type) {
    if (!msg) return;
    msg.textContent = texte;
    msg.className = "message message-" + (type || "info");
    msg.hidden = false;
  }

  function valeurRadio(nom) {
    var el = form.querySelector('input[name="' + nom + '"]:checked');
    return el ? el.value : "";
  }

  function majProgression() {
    var champs = ["secteur", "appels_manques", "fonction_prioritaire", "budget_mensuel"];
    var faits = champs.filter(function (c) { return !!valeurRadio(c); }).length;
    var pct = Math.round((faits / champs.length) * 100);
    if (progresBarre) progresBarre.style.width = pct + "%";
    if (progresTexte) progresTexte.textContent = faits + " / 4 · " + pct + " %";

    var secteur = valeurRadio("secteur");
    var appels = valeurRadio("appels_manques");
    if (apercu && secteur && appels) {
      var estimation = {
        "1 à 5 appels": "environ 1 000 $ à 2 000 $ par mois",
        "6 à 15 appels": "environ 2 500 $ à 6 000 $ par mois",
        "Plus de 15 appels": "souvent plus de 6 000 $ par mois",
        "Je ne sais pas": "souvent plusieurs clients perdus chaque semaine"
      }[appels] || "plusieurs clients potentiels par mois";
      apercu.innerHTML = "<strong>Aperçu pour votre secteur (" + esc(secteur) + ") :</strong> " + appels.toLowerCase() + " manqués par semaine représentent " + estimation + " qui risquent d'aller chez un concurrent.";
      apercu.hidden = false;
    }
  }

  form.addEventListener("change", majProgression);
  majProgression();

  function afficherBarres(cible, liste, total) {
    if (!cible || !Array.isArray(liste) || !liste.length) return;
    var denom = Math.max(1, total);
    cible.innerHTML = liste.slice(0, 5).map(function (item) {
      var pct = Math.round((Number(item.votes || 0) / denom) * 100);
      return '<div class="sondage-res-ligne">' +
        '<div class="sondage-res-meta"><span>' + esc(item.label) + '</span><b>' + pct + ' %</b></div>' +
        '<div class="sondage-res-barre"><i style="width:' + Math.max(4, pct) + '%"></i></div>' +
        '</div>';
    }).join("");
  }

  async function chargerResultats(cfg) {
    try {
      var r = await fetch(cfg.supabaseUrl + "/rest/v1/rpc/stats_sondages_prix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": cfg.supabaseCleAnon,
          "Authorization": "Bearer " + cfg.supabaseCleAnon
        },
        body: "{}"
      });
      if (!r.ok) return;
      var data = await r.json();
      if (!data || !Number(data.total)) return;
      if (resTotal) resTotal.textContent = data.total + (data.total > 1 ? " votes enregistrés" : " vote enregistré");
      afficherBarres(resBudgets, data.budgets, data.total);
      afficherBarres(resSecteurs, data.secteurs, data.total);
      if (blocRes) blocRes.hidden = false;
    } catch (_) {}
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (form.botcheck && form.botcheck.checked) return;

    var secteur = valeurRadio("secteur");
    var appels = valeurRadio("appels_manques");
    var budget = valeurRadio("budget_mensuel");
    var priorite = valeurRadio("fonction_prioritaire");
    var commentaire = (form.commentaire ? form.commentaire.value : "").trim().slice(0, 600);
    var courriel = (form.courriel ? form.courriel.value : "").trim().slice(0, 180);

    if (!secteur || !appels || !budget || !priorite) {
      afficherMessage("Choisissez une option aux 4 questions rapides (cela prend 20 secondes).", "erreur");
      return;
    }

    var cfg = window.ALLO_CONFIG || {};
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    afficherMessage("Enregistrement de votre vote et calcul des tendances…", "info");

    try {
      var res = await fetch(cfg.supabaseUrl + "/rest/v1/sondages_prix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": cfg.supabaseCleAnon,
          "Authorization": "Bearer " + cfg.supabaseCleAnon,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          secteur: secteur,
          appels_manques: appels,
          budget_mensuel: budget,
          fonction_prioritaire: priorite,
          commentaire: commentaire || null,
          courriel: courriel || null,
          source: source
        })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);

      form.hidden = true;
      var barre = document.querySelector(".sondage-progres");
      if (barre) barre.hidden = true;
      if (msg) msg.hidden = true;
      if (merci) {
        merci.hidden = false;
        merci.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      await chargerResultats(cfg);
    } catch (_) {
      afficherMessage("L'envoi n'a pas fonctionné. Réessayez dans un instant ou écrivez à contact@alloreception.ca.", "erreur");
      if (btn) btn.disabled = false;
    }
  });

  if (btnCopier) {
    btnCopier.addEventListener("click", function () {
      var lien = "https://alloreception.ca/sondage.html";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lien).then(function () {
          btnCopier.textContent = "Lien copié !";
          setTimeout(function () { btnCopier.textContent = "Copier le lien du sondage"; }, 2500);
        });
      }
    });
  }
})();
