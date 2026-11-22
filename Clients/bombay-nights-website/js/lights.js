/* Stage lighting: sweeping beams, lasers and disco-ball glints drawn on 2D canvas.
   Beam energy follows the music (BN_AUDIO.beat / level). Pauses off-screen. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var small = window.matchMedia('(max-width: 767px)').matches;
  var COLORS = [[245, 41, 134], [232, 185, 106], [248, 235, 213]];

  function create(section, opts) {
    if (!section) return;
    var cv = document.createElement('canvas');
    cv.className = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true');
    section.insertBefore(cv, opts.before ? section.querySelector(opts.before) : section.firstChild);
    var c = cv.getContext('2d'); if (!c) { cv.remove(); return; }
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5), visible = false, raf = 0;
    var N = small ? opts.beams - 2 : opts.beams;
    var src = []; for (var i = 0; i < N; i++) src.push({ x: (i + 0.5) / N, ph: Math.random() * 6.28, sp: 0.25 + Math.random() * 0.35, sw: 0.45 + Math.random() * 0.4, col: COLORS[i % 3], w: 0.05 + Math.random() * 0.05 });
    var glints = []; for (var g = 0; g < (small ? 14 : 34); g++) glints.push({ a: Math.random() * 6.28, r: 0.1 + Math.random() * 0.5, s: 0.1 + Math.random() * 0.25, sz: 6 + Math.random() * 18, col: COLORS[g % 2] });

    function resize() {
      W = section.clientWidth; H = section.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(section); else window.addEventListener('resize', resize);

    function draw(ms) {
      raf = requestAnimationFrame(draw);
      var t = ms / 1000, A = window.BN_AUDIO || { beat: 0, level: 0.2 };
      var boost = 1 + A.beat * 1.1 + A.level * 0.6;
      c.clearRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter';
      var len = H * opts.length;
      for (var i = 0; i < src.length; i++) {
        var s = src[i], x = s.x * W, ang = Math.sin(t * s.sp + s.ph) * s.sw;
        var ex = x + Math.sin(ang) * len, ey = opts.originY * H + Math.cos(ang) * len, oy = opts.originY * H;
        var wd = (s.w * W) * (1 + A.beat * 0.25);
        var grad = c.createLinearGradient(x, oy, ex, ey);
        var rgb = s.col.join(',');
        grad.addColorStop(0, 'rgba(' + rgb + ',' + (0.34 * opts.intensity * boost) + ')');
        grad.addColorStop(1, 'rgba(' + rgb + ',0)');
        c.fillStyle = grad;
        c.beginPath(); c.moveTo(x - 3, oy); c.lineTo(x + 3, oy); c.lineTo(ex + wd, ey); c.lineTo(ex - wd, ey); c.closePath(); c.fill();
        // laser core
        c.strokeStyle = 'rgba(' + rgb + ',' + Math.min(0.7, 0.25 * boost) + ')'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(x, oy); c.lineTo(ex, ey); c.stroke();
        // source flare
        var fl = c.createRadialGradient(x, oy, 0, x, oy, 34 * boost);
        fl.addColorStop(0, 'rgba(255,255,255,.9)'); fl.addColorStop(0.25, 'rgba(' + rgb + ',.55)'); fl.addColorStop(1, 'rgba(' + rgb + ',0)');
        c.fillStyle = fl; c.beginPath(); c.arc(x, oy, 34 * boost, 0, 6.28); c.fill();
      }
      if (opts.glints) {
        for (var k = 0; k < glints.length; k++) {
          var q = glints[k], a = q.a + t * q.s * 0.4;
          var gx = W * (0.5 + Math.cos(a) * (0.2 + q.r)), gy = H * (0.42 + Math.sin(a * 1.3) * (0.15 + q.r * 0.5));
          var tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.5 + k)), rr = q.sz * (1 + A.beat * 0.6);
          var gr = c.createRadialGradient(gx, gy, 0, gx, gy, rr);
          gr.addColorStop(0, 'rgba(255,255,255,' + 0.55 * tw + ')'); gr.addColorStop(0.3, 'rgba(' + q.col.join(',') + ',' + 0.32 * tw + ')'); gr.addColorStop(1, 'rgba(' + q.col.join(',') + ',0)');
          c.fillStyle = gr; c.beginPath(); c.arc(gx, gy, rr, 0, 6.28); c.fill();
        }
      }
      c.globalCompositeOperation = 'source-over';
    }
    function run(on) { if (on && !visible) { visible = true; raf = requestAnimationFrame(draw); } else if (!on && visible) { visible = false; cancelAnimationFrame(raf); } }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { run(e[0].isIntersecting); }).observe(section); else run(true);
  }

  create(document.getElementById('home'), { beams: 7, length: 0.95, originY: 0, intensity: 1, glints: true, before: '.near' });
  create(document.querySelector('.final'), { beams: 6, length: 1.1, originY: 0, intensity: 0.9, glints: false, before: '.container' });
  create(document.getElementById('vibe'), { beams: 5, length: 1.2, originY: 0, intensity: 0.8, glints: false, before: '.container' });
})();
