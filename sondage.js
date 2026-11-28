// ===== Sondage en ligne PME (Alloreception.ca) =====
(function () {
  var form = document.getElementById("form-sondage");
  var msg = document.getElementById("sondage-message");
  var merci = document.getElementById("sondage-merci");
  var btnCopier = document.getElementById("btn-copier-sondage");
  if (!form) return;

  var params = new URLSearchParams(location.search);
  var source = (params.get("src") || params.get("utm_source") || "direct").slice(0, 40);

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
      afficherMessage("Merci de choisir une réponse pour chacune des 4 questions rapides.", "erreur");
      return;
    }

    var cfg = window.ALLO_CONFIG || {};
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    afficherMessage("Enregistrement de votre avis…", "info");

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
      if (msg) msg.hidden = true;
      if (merci) {
        merci.hidden = false;
        merci.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch (_) {
      afficherMessage("L'envoi n'a pas fonctionné. Réessayez dans un instant ou écrivez-nous à contact@alloreception.ca.", "erreur");
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
