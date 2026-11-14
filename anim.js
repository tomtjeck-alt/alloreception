// ===== Animations du site =====
(function () {
  var calme = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-anim");

  // 1. Apparition des éléments quand on fait défiler la page
  var cibles = document.querySelectorAll(
    ".section h2, .surtitre, .carte, .fonctions li, .etapes li, .apercu, .forfait, .calculateur, " +
    ".tableau-conteneur, details, .contact-carte, .grille-videos video, .chiffres > div, .cta-final .boutons-centre, .panneau-comparaison"
  );
  // Décalage pour que les éléments d'une même grille arrivent l'un après l'autre
  cibles.forEach(function (el) {
    var freres = el.parentElement ? [].filter.call(el.parentElement.children, function (x) { return x.tagName === el.tagName; }) : [];
    var rang = Math.max(0, freres.indexOf(el));
    el.style.setProperty("--delai", Math.min(rang, 6) * 90 + "ms");
    el.classList.add("revele");
  });
  if (calme || !("IntersectionObserver" in window)) {
    cibles.forEach(function (el) { el.classList.add("visible"); });
  } else {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    cibles.forEach(function (el) { obs.observe(el); });
  }

  // 2. Compteurs qui défilent jusqu'à leur valeur
  function compter(el) {
    var fin = +el.dataset.fin, debut = null, duree = 1200;
    if (calme) { el.textContent = fin; return; }
    function pas(t) {
      if (!debut) debut = t;
      var p = Math.min((t - debut) / duree, 1);
      el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(pas);
    }
    requestAnimationFrame(pas);
  }
  var compteurs = document.querySelectorAll(".compteur");
  if ("IntersectionObserver" in window) {
    var obsC = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { if (e.isIntersecting) { compter(e.target); obsC.unobserve(e.target); } });
    }, { threshold: 0.5 });
    compteurs.forEach(function (el) { obsC.observe(el); });
  } else {
    compteurs.forEach(function (el) { el.textContent = el.dataset.fin; });
  }

  // 3. Mot qui change dans le titre de l'accueil
  var rotatif = document.querySelector(".mot-rotatif");
  if (rotatif && !calme) {
    var mots = rotatif.dataset.mots.split("|"), i = 0;
    setInterval(function () {
      rotatif.classList.add("sortie");
      setTimeout(function () {
        i = (i + 1) % mots.length;
        rotatif.textContent = mots[i];
        rotatif.classList.remove("sortie");
      }, 350);
    }, 2600);
  }

  // 4. La conversation de l'accueil s'écrit message par message, en boucle
  var maquette = document.querySelector(".maquette-animee");
  if (maquette && !calme) {
    var etapes = maquette.querySelectorAll(".bulle, .maquette-resume");
    function jouer() {
      etapes.forEach(function (el) { el.classList.remove("montre"); });
      etapes.forEach(function (el, n) {
        setTimeout(function () { el.classList.add("montre"); }, 500 + n * 1100);
      });
      setTimeout(jouer, 500 + etapes.length * 1100 + 4500);
    }
    maquette.classList.add("en-lecture");
    jouer();
  }

  // 5. Le montant du calculateur glisse vers sa nouvelle valeur
  var perdu = document.getElementById("calc-perdu");
  if (perdu && !calme && "MutationObserver" in window) {
    var actuel = 0, anime = false;
    var lire = function (t) { return +t.replace(/[^\d]/g, "") || 0; };
    actuel = lire(perdu.textContent);
    new MutationObserver(function () {
      if (anime) return;
      var cible = lire(perdu.textContent), depart = actuel, t0 = null;
      if (cible === depart) return;
      function pas(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 400, 1);
        actuel = Math.round(depart + (cible - depart) * p);
        anime = true;
        perdu.textContent = actuel.toLocaleString("fr-CA") + " $";
        anime = false;
        if (p < 1) requestAnimationFrame(pas);
      }
      requestAnimationFrame(pas);
    }).observe(perdu, { childList: true, characterData: true, subtree: true });
  }
})();
