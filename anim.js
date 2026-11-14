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

  // 3. Mot qui s'écrit et s'efface comme à la machine à écrire (style Ainora)
  var rotatif = document.querySelector(".mot-rotatif");
  if (rotatif && !calme) {
    var mots = rotatif.dataset.mots.split("|"), i = 0, n = mots[0].length, efface = true;
    rotatif.classList.add("machine");
    (function taper() {
      var mot = mots[i];
      if (efface) {
        n--;
        rotatif.textContent = mot.slice(0, n);
        if (n <= 0) { efface = false; i = (i + 1) % mots.length; return setTimeout(taper, 250); }
        return setTimeout(taper, 35);
      }
      mot = mots[i];
      n++;
      rotatif.textContent = mot.slice(0, n);
      if (n >= mot.length) { efface = true; return setTimeout(taper, 2200); }
      setTimeout(taper, 70);
    })();
  }

  // 3b. Chronomètre « En direct » qui avance (style Ainora « LIVE 00:42 »)
  var chrono = document.querySelector(".chrono");
  if (chrono) {
    var sec = 0;
    setInterval(function () {
      sec = (sec + 1) % 600;
      chrono.textContent = String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
    }, 1000);
  }

  // 3c. Lueur qui suit la souris sur les cartes (style Dasha / Ainora)
  if (!calme && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".carte, .fonctions li, .etapes li, .forfait, .apercu, .contact-carte, .panneau-comparaison, .demo-fenetre").forEach(function (el) {
      el.classList.add("projecteur");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  // 3d. Titres qui apparaissent mot par mot (style Techsy)
  if (!calme && "IntersectionObserver" in window) {
    document.querySelectorAll(".section h2, .cta-final h2, .hero-court h1").forEach(function (h) {
      if (h.querySelector("*")) return;
      var mots = h.textContent.trim().split(/\s+/);
      h.innerHTML = mots.map(function (m, k) {
        return '<span class="mot" style="--k:' + k + '">' + m.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>";
      }).join(" ");
      h.classList.add("titre-mots");
      h.classList.remove("revele");
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { h.classList.add("montre"); o.disconnect(); } });
      }, { threshold: 0.4 });
      o.observe(h);
    });
  }

  // 3e. Démonstration à onglets qui défilent seuls (style Ainora)
  var demo = document.querySelector(".section-demo");
  if (demo) {
    var SCENES = [
      { lignes: [["00:02", "Client", "Bonjour, je voudrais un changement d'huile cette semaine."],
                 ["00:05", "Allo", "Bien sûr ! J'ai jeudi à 9 h 30 ou vendredi à 14 h. Lequel vous convient ?"],
                 ["00:09", "Client", "Jeudi 9 h 30."],
                 ["00:11", "Allo", "C'est réservé. Vous recevrez une confirmation."]],
        cartes: [["Calendrier", "Jeudi 9 h 30 · Changement d'huile"], ["Résumé envoyé", "Nouveau client · RDV confirmé"]],
        resume: "Rendez-vous pris sans que personne ne décroche." },
      { lignes: [["00:02", "Client", "Vous fermez à quelle heure le samedi ? Et c'est combien, une pose de pneus ?"],
                 ["00:06", "Allo", "Le samedi, nous fermons à 15 h. La pose de 4 pneus est à partir de 80 $."],
                 ["00:10", "Client", "Parfait, merci !"]],
        cartes: [["Information donnée", "Heures du samedi · prix de la pose"], ["Résumé envoyé", "Question sur les pneus"]],
        resume: "Le client a eu sa réponse tout de suite, sans vous déranger." },
      { lignes: [["00:02", "Caller", "Hi, do you do brake inspections?"],
                 ["00:04", "Allo", "Yes, we do! Would you like to book one? I have tomorrow at 10 a.m."],
                 ["00:08", "Caller", "Tomorrow at 10 works."],
                 ["00:10", "Allo", "Great, you're booked."]],
        cartes: [["Calendrier", "Demain 10 h · Inspection des freins"], ["Résumé envoyé (en français)", "Client anglophone · RDV confirmé"]],
        resume: "Un client anglophone servi dans sa langue. Vous recevez le résumé en français." },
      { lignes: [["21:47", "Client", "Bonsoir, ma voiture fait un bruit bizarre. Vous pouvez la voir demain ?"],
                 ["21:47", "Allo", "Bonsoir ! Oui, je peux vous inscrire demain à 8 h. Quel est votre modèle ?"],
                 ["21:48", "Client", "Une Toyota RAV4. 8 h, c'est parfait."]],
        cartes: [["Calendrier", "Demain 8 h · Diagnostic bruit · RAV4"], ["Résumé envoyé", "Appel reçu à 21 h 47"]],
        resume: "Un client gagné à 21 h 47, au lieu d'une boîte vocale." }
    ];
    var boutonsO = demo.querySelectorAll("[data-onglet]");
    var zoneL = demo.querySelector(".demo-lignes"), zoneC = demo.querySelector(".demo-cartes"), zoneR = demo.querySelector(".demo-resume");
    var courant = 0, minuteur = null, attentes = [];
    var DUREE = 7000;
    function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
    function montrer(k, auto) {
      courant = k;
      attentes.forEach(clearTimeout); attentes = [];
      boutonsO.forEach(function (b, j) {
        b.setAttribute("aria-selected", j === k);
        b.classList.remove("progresse");
        if (j === k && auto && !calme) { void b.offsetWidth; b.classList.add("progresse"); }
      });
      var sc = SCENES[k];
      zoneL.innerHTML = sc.lignes.map(function (l) {
        return '<p class="demo-ligne' + (l[1] === "Allo" ? " ia" : "") + '"><span class="mono">' + l[0] + "</span><strong>" + esc(l[1]) + "</strong>" + esc(l[2]) + "</p>";
      }).join("");
      zoneC.innerHTML = sc.cartes.map(function (c) {
        return '<div class="demo-carte"><p class="mono">' + esc(c[0]) + "</p><p>" + esc(c[1]) + '</p><span class="coche">✓</span></div>';
      }).join("");
      zoneR.textContent = sc.resume;
      var elems = zoneL.querySelectorAll(".demo-ligne").length ? [].slice.call(zoneL.children).concat([].slice.call(zoneC.children)) : [];
      elems.forEach(function (el, n) {
        if (calme) { el.classList.add("montre"); return; }
        attentes.push(setTimeout(function () { el.classList.add("montre"); }, 150 + n * 550));
      });
    }
    function suivant() { montrer((courant + 1) % SCENES.length, true); }
    function lancer() { clearInterval(minuteur); if (!calme) minuteur = setInterval(suivant, DUREE); }
    boutonsO.forEach(function (b, j) {
      b.addEventListener("click", function () { montrer(j, false); clearInterval(minuteur); });
    });
    montrer(0, true);
    lancer();
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
