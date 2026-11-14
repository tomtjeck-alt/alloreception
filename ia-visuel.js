// ===== Visuels IA animés (dessinés en direct, sans image ni bibliothèque) =====
// 1. Réseau de neurones en fond des en-têtes
// 2. Orbe IA en particules 3D dans la carte d'appel
(function () {
  var calme = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  // Lance une boucle d'animation seulement quand l'élément est visible (économise la batterie)
  function boucleVisible(el, dessiner) {
    var actif = false, id = null;
    function tour(t) { dessiner(t); if (actif) id = requestAnimationFrame(tour); }
    function demarrer() { if (!actif) { actif = true; id = requestAnimationFrame(tour); } }
    function arreter() { actif = false; if (id) cancelAnimationFrame(id); }
    dessiner(performance.now());            // première image tout de suite
    if (calme) return;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? demarrer() : arreter(); }).observe(el);
    } else demarrer();
    document.addEventListener("visibilitychange", function () { document.hidden ? arreter() : demarrer(); });
  }

  // ---------- 1. Réseau de neurones ----------
  document.querySelectorAll(".hero").forEach(function (hero) {
    var c = document.createElement("canvas");
    c.className = "reseau-ia";
    c.setAttribute("aria-hidden", "true");
    hero.insertBefore(c, hero.firstChild);
    var ctx = c.getContext("2d"), W = 0, H = 0, points = [], souris = { x: -999, y: -999 };

    function taille() {
      W = hero.clientWidth; H = hero.clientHeight;
      c.width = W * DPR; c.height = H * DPR;
      c.style.width = W + "px"; c.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = Math.round(Math.min(90, W * H / 14000));
      points = [];
      for (var i = 0; i < n; i++) {
        points.push({ x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.6, jaune: Math.random() < 0.18 });
      }
    }
    taille();
    window.addEventListener("resize", taille);
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect(); souris.x = e.clientX - r.left; souris.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", function () { souris.x = souris.y = -999; });

    var LIEN = 130;
    boucleVisible(hero, function () {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        if (!calme) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
          // Les points s'écartent doucement de la souris
          var dx = p.x - souris.x, dy = p.y - souris.y, d2 = dx * dx + dy * dy;
          if (d2 < 14400) { var f = (14400 - d2) / 14400 * 0.6; p.x += dx / 120 * f; p.y += dy / 120 * f; }
        }
        for (var j = i + 1; j < points.length; j++) {
          var q = points[j], ex = p.x - q.x, ey = p.y - q.y, d = Math.sqrt(ex * ex + ey * ey);
          if (d < LIEN) {
            var a = (1 - d / LIEN) * 0.35;
            ctx.strokeStyle = (p.jaune || q.jaune) ? "rgba(250,204,21," + a + ")" : "rgba(110,139,255," + a + ")";
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < points.length; k++) {
        var s = points[k];
        ctx.fillStyle = s.jaune ? "rgba(250,204,21,0.9)" : "rgba(170,190,255,0.75)";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
    });
  });

  // ---------- 2. Orbe IA en particules 3D ----------
  document.querySelectorAll(".orbe-ia").forEach(function (zone) {
    var c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    zone.appendChild(c);
    var ctx = c.getContext("2d"), T = 0;
    function taille() {
      T = zone.clientWidth;
      c.width = T * DPR; c.height = T * DPR;
      c.style.width = T + "px"; c.style.height = T + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    taille();
    window.addEventListener("resize", taille);

    // Points répartis uniformément sur une sphère (spirale de Fibonacci)
    var N = 560, pts = [], or = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = or * i;
      pts.push([Math.cos(th) * rr, y, Math.sin(th) * rr]);
    }

    boucleVisible(zone, function (t) {
      var s = t / 1000;
      ctx.clearRect(0, 0, T, T);
      var cx = T / 2, cy = T / 2;
      // « Voix » : l'orbe gonfle comme s'il parlait
      var voix = calme ? 0 : (Math.sin(s * 5.3) * 0.5 + Math.sin(s * 8.7) * 0.3 + Math.sin(s * 2.1) * 0.2) * 0.5 + 0.5;
      var R = T * (0.36 + voix * 0.04);

      // Halo
      var g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.6);
      g.addColorStop(0, "rgba(250,204,21," + (0.20 + voix * 0.15) + ")");
      g.addColorStop(0.5, "rgba(110,139,255,0.10)");
      g.addColorStop(1, "rgba(7,11,26,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2); ctx.fill();

      var ay = s * 0.5, ax = 0.35 + Math.sin(s * 0.3) * 0.15;
      var cyA = Math.cos(ay), syA = Math.sin(ay), cxA = Math.cos(ax), sxA = Math.sin(ax);
      for (var i = 0; i < N; i++) {
        var p = pts[i];
        // Petites vagues à la surface
        var onde = 1 + (calme ? 0 : Math.sin(p[1] * 6 + s * 4) * 0.04 * (0.4 + voix));
        var x = p[0] * onde, y = p[1] * onde, z = p[2] * onde;
        var x1 = x * cyA + z * syA, z1 = -x * syA + z * cyA;
        var y1 = y * cxA - z1 * sxA, z2 = y * sxA + z1 * cxA;
        var prof = (z2 + 1) / 2;                 // 0 = derrière, 1 = devant
        var px = cx + x1 * R, py = cy + y1 * R;
        var taillePt = 0.6 + prof * 1.7;
        var jaune = p[1] > -0.1 + Math.sin(s) * 0.2;
        ctx.fillStyle = jaune
          ? "rgba(250," + Math.round(190 + prof * 30) + ",40," + (0.15 + prof * 0.85) + ")"
          : "rgba(130,155,255," + (0.12 + prof * 0.75) + ")";
        ctx.beginPath(); ctx.arc(px, py, taillePt, 0, Math.PI * 2); ctx.fill();
      }
    });
  });
})();
