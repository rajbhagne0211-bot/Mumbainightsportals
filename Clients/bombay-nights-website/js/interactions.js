(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var A = function () { return window.BN_AUDIO || { beat: 0, level: 0, bins: [] }; };

  /* Scroll progress + mobile dock */
  var bar = document.getElementById('progress'), dock = document.getElementById('dock'), tick = false;
  function onScroll() {
    tick = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    if (dock) dock.classList.toggle('show', window.scrollY > window.innerHeight * 0.55);
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Button ripple (all pointers) */
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('.btn, .so-link'); if (!b || reduce) return;
    var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
    var s = document.createElement('span'); s.className = 'ripple';
    s.style.width = s.style.height = d + 'px'; s.style.left = e.clientX - r.left - d / 2 + 'px'; s.style.top = e.clientY - r.top - d / 2 + 'px';
    b.appendChild(s); setTimeout(function () { s.remove(); }, 750);
  });

  /* Count-up numbers */
  $('[data-count]').forEach(function (el) {
    var target = Number(el.dataset.count); if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      var t0 = performance.now(), dur = 1600;
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * e); if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* Beat variable on visible sections (cheap: only visible targets, one rAF loop) */
  var beatEls = $('[data-beat], .hero, .countdown, .final'), vis = new Set();
  if ('IntersectionObserver' in window) {
    var bio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? vis.add(e.target) : vis.delete(e.target); }); });
    beatEls.forEach(function (el) { bio.observe(el); });
  }
  (function beatLoop() {
    var v = A().beat.toFixed(2);
    vis.forEach(function (el) { el.style.setProperty('--beat', v); });
    requestAnimationFrame(beatLoop);
  })();

  /* Spectrum visualizer */
  var cv = document.getElementById('viz');
  if (cv && cv.getContext('2d')) {
    var c = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), on = false, raf = 0;
    var resize = function () { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener('resize', resize);
    var draw = function () {
      raf = requestAnimationFrame(draw);
      var bins = A().bins, n = W < 500 ? 24 : 32, gap = W < 500 ? 4 : 6, bw = (W - gap * (n - 1)) / n, base = H * 0.72;
      c.clearRect(0, 0, W, H);
      var g = c.createLinearGradient(0, 0, 0, base); g.addColorStop(0, '#fff3d1'); g.addColorStop(0.35, '#E8B96A'); g.addColorStop(1, '#F52986');
      for (var i = 0; i < n; i++) {
        var v = (bins[Math.floor(i * 28 / n)] || 0) / 255, h = Math.max(4, v * base * 1.05), x = i * (bw + gap);
        c.fillStyle = g; c.shadowColor = 'rgba(245,41,134,.6)'; c.shadowBlur = 14;
        c.beginPath(); c.roundRect ? c.roundRect(x, base - h, bw, h, bw / 2) : c.rect(x, base - h, bw, h); c.fill();
        c.shadowBlur = 0; c.globalAlpha = 0.22; c.fillStyle = '#E8B96A';
        c.fillRect(x, base + 4, bw, Math.min(h * 0.4, H - base - 6)); c.globalAlpha = 1;
      }
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
      if (e[0].isIntersecting && !on) { on = true; draw(); } else if (!e[0].isIntersecting) { on = false; cancelAnimationFrame(raf); }
    }).observe(cv);
  }

  if (reduce || !fine) return;

  /* Cursor ring + spark trail */
  var cur = document.getElementById('cursor'), cx = 0, cy = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); }, { passive: true });
  (function follow() { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; requestAnimationFrame(follow); })();
  document.addEventListener('pointerover', function (e) { cur.classList.toggle('hot', !!e.target.closest('a, button, .tilt, .swiper-slide, .d-card, .i-card')); });
  document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });

  var sc = document.getElementById('sparks'), sx = sc.getContext('2d'), parts = [], running = false;
  if (!sx) return;
  var fit = function () { sc.width = window.innerWidth; sc.height = window.innerHeight; }; fit(); window.addEventListener('resize', fit);
  var last = 0;
  window.addEventListener('pointermove', function (e) {
    var now = performance.now(); if (now - last < 28) return; last = now;
    for (var i = 0; i < 2; i++) parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 1.6, vy: Math.random() * 1.2 + 0.2, life: 1, s: 1 + Math.random() * 2.2, c: Math.random() < 0.5 ? '232,185,106' : '245,41,134' });
    if (!running) { running = true; requestAnimationFrame(paint); }
  }, { passive: true });
  function paint() {
    sx.clearRect(0, 0, sc.width, sc.height); sx.globalCompositeOperation = 'lighter';
    parts = parts.filter(function (p) { return p.life > 0; });
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 0.02;
      sx.fillStyle = 'rgba(' + p.c + ',' + p.life * 0.8 + ')'; sx.beginPath(); sx.arc(p.x, p.y, p.s, 0, 6.28); sx.fill();
    });
    if (parts.length) requestAnimationFrame(paint); else running = false;
  }

  /* Magnetic buttons */
  $('.btn, .so-link, .sound-btn').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
      b.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
    });
    b.addEventListener('pointerleave', function () { b.style.translate = ''; });
  });

  /* 3D tilt with spotlight on cards */
  $('.d-card, .i-card, .cd-card').forEach(function (el) {
    el.setAttribute('data-tilt', '');
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add('tilting');
      el.style.transform = 'perspective(800px) rotateY(' + (x * 10).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg) translateZ(0)';
    });
    el.addEventListener('pointerleave', function () { el.classList.remove('tilting'); el.style.transform = ''; });
  });
})();
