(function () {
  var cfg = window.BN_CONFIG;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* Registration links: one source of truth in config.js */
  document.querySelectorAll('[data-register]').forEach(function (a) { a.setAttribute('href', cfg.registrationUrl); });

  /* Text splitting: letters ([data-split]) and words ([data-words]) */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var text = el.textContent;
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    Array.from(text).forEach(function (ch, i) {
      var wrap = document.createElement('span'); wrap.className = 'cw';
      var s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i);
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      wrap.appendChild(s); el.appendChild(wrap);
    });
  });
  document.querySelectorAll('[data-words]').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/\s+/).forEach(function (word, i) {
      var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      var wi = document.createElement('span'); wi.className = 'wi'; wi.style.setProperty('--i', i);
      wi.textContent = word; w.appendChild(wi); el.appendChild(w); el.appendChild(document.createTextNode(' '));
    });
  });

  /* Intro: curtain brand reveal, then lift and start the hero */
  var ready = function () { root.classList.add('is-ready'); };
  if (reduce) ready(); else setTimeout(ready, 1700);
  setTimeout(function () { var c = document.querySelector('.curtain'); if (c) c.remove(); }, reduce ? 50 : 3200);

  /* Hero particles (CSS) */
  var pBox = document.getElementById('particles');
  if (pBox && !reduce) {
    var n = window.matchMedia('(max-width: 767px)').matches ? 16 : 30;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      var sz = 2 + Math.random() * 3;
      p.style.width = p.style.height = sz + 'px';
      p.style.animationDuration = 9 + Math.random() * 10 + 's';
      p.style.animationDelay = -Math.random() * 14 + 's';
      pBox.appendChild(p);
    }
  }

  /* Scroll reveals */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el, idx) {
      var sib = el.parentElement.querySelectorAll(':scope > .rv');
      el.style.transitionDelay = (Array.prototype.indexOf.call(sib, el) % 4) * 90 + 'ms';
      io.observe(el);
    });
    var lines = document.querySelectorAll('.line-grow');
    var lio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); lio.unobserve(e.target); } }); }, { threshold: 0.5 });
    lines.forEach(function (l) { lio.observe(l); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
    document.querySelectorAll('.line-grow').forEach(function (l) { l.classList.add('in'); });
  }

  /* Nav: scrolled state + active section */
  var nav = document.getElementById('nav');
  var onScrollNav = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  var sectionMap = { home: 'home', countdown: 'home', experience: 'experience', highlights: 'highlights', 'event-details': 'event-details', tickets: 'event-details', inclusions: 'event-details', contact: 'contact' };
  var links = document.querySelectorAll('[data-nav]');
  function setActive(id) {
    links.forEach(function (a) {
      var on = a.dataset.nav === id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && sectionMap[e.target.id]) setActive(sectionMap[e.target.id]); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(sectionMap).forEach(function (id) { var el = document.getElementById(id); if (el) so.observe(el); });
  }

  /* Mobile drawer */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var scrim = document.getElementById('scrim');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  scrim.addEventListener('click', function () { setMenu(false); });
  drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', function () { setMenu(false); });

  /* Parallax: scroll depth (data-speed) + hero mouse movement, both through CSS variables */
  var hero = document.getElementById('home');
  var par = document.querySelectorAll('[data-speed]');
  var ticking = false;
  function parallax() {
    ticking = false;
    var vh = window.innerHeight;
    par.forEach(function (el) {
      var host = el.closest('section') || el.parentElement;
      var r = host.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var speed = parseFloat(el.dataset.speed) || 0.1;
      var off = host.id === 'home' ? -r.top : (r.top + r.height / 2 - vh / 2);
      el.style.setProperty('--py', (host.id === 'home' ? off * speed : -off * speed).toFixed(1));
    });
  }
  if (!reduce) {
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
    if (window.matchMedia('(hover: hover)').matches) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    }
  }

  /* Tilt on experience art + ticket, spotlight on cards */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg) scale(1.02)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    var ticket = document.getElementById('ticket');
    ticket.addEventListener('pointermove', function (e) {
      var r = ticket.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      ticket.style.transform = 'perspective(1100px) rotateY(' + ((x - 0.5) * 12).toFixed(2) + 'deg) rotateX(' + ((0.5 - y) * 10).toFixed(2) + 'deg)';
      ticket.style.setProperty('--sx', (x * 100).toFixed(0) + '%');
      ticket.style.setProperty('--sy', (y * 100).toFixed(0) + '%');
    });
    ticket.addEventListener('pointerleave', function () { ticket.style.transform = ''; });
    document.querySelectorAll('.spot').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--x', (e.clientX - r.left) + 'px');
        c.style.setProperty('--y', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* Swiper gallery */
  if (window.Swiper) {
    // Duplicate slides once so loop mode always has enough slides on wide screens.
    var wrap = document.querySelector('.showcase-swiper .swiper-wrapper');
    Array.prototype.slice.call(wrap.children).forEach(function (sl) {
      var cl = sl.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); cl.querySelector('img').setAttribute('alt', ''); wrap.appendChild(cl);
    });
    new Swiper('.showcase-swiper', {
      effect: 'coverflow',
      centeredSlides: true,
      slidesPerView: 'auto',
      loop: true,
      loopAdditionalSlides: 2,
      grabCursor: true,
      speed: 900,
      keyboard: { enabled: true },
      coverflowEffect: { rotate: 26, stretch: 0, depth: 200, modifier: 1, slideShadows: false },
      autoplay: reduce ? false : { delay: 3800, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { prevEl: '.sw-prev', nextEl: '.sw-next' }
    });
  }

  /* Inclusions (from config) */
  var grid = document.getElementById('i-grid');
  if (cfg.inclusions && cfg.inclusions.length) {
    cfg.inclusions.forEach(function (item) {
      var d = document.createElement('div'); d.className = 'i-card rv in spot';
      d.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg>';
      var h = document.createElement('h3'); h.textContent = item.title; d.appendChild(h);
      if (item.text) { var p = document.createElement('p'); p.textContent = item.text; d.appendChild(p); }
      grid.appendChild(d);
    });
  } else {
    var ph = document.createElement('div'); ph.className = 'i-card placeholder rv in';
    ph.innerHTML = '<h3>INCLUSIONS TO BE ADDED</h3><p>Add the exact items from the client poster in js/config.js.</p>';
    grid.appendChild(ph);
  }

  /* Social links (from config) */
  var soRow = document.getElementById('so-row');
  cfg.instagram.forEach(function (s) {
    var a = document.createElement('a');
    a.className = 'so-link rv'; a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', 'Instagram profile ' + s.handle);
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg><span></span>';
    a.querySelector('span').textContent = '@' + s.handle;
    soRow.appendChild(a);
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); } }); }, { threshold: 0.2 });
    soRow.querySelectorAll('.rv').forEach(function (el) { io2.observe(el); });
  } else soRow.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
})();
