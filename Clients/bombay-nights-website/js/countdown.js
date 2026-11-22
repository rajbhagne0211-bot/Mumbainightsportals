/* Countdown to 31 Dec, 6:00 PM IST. Fixed +05:30 offset means every visitor sees the same IST target. */
(function () {
  var cfg = window.BN_CONFIG;
  var grid = document.getElementById('cd-grid');
  if (!grid) return;

  var targetISO = cfg.eventYear + '-12-31T' + cfg.startTime + cfg.timezoneOffset;
  var target = new Date(targetISO).getTime();

  // Testing aid: index.html?countdown=10 ends the countdown 10 seconds from page load.
  var test = new URLSearchParams(location.search).get('countdown');
  if (test !== null && !isNaN(Number(test))) target = Date.now() + Number(test) * 1000;

  document.getElementById('cd-label').textContent = '31 DECEMBER · 6:00 PM IST';

  var cards = {};
  grid.querySelectorAll('.cd-card').forEach(function (c) { cards[c.dataset.unit] = c.querySelector('.cd-num'); });
  var last = {};

  function pad(n) { return String(n).padStart(2, '0'); }

  function setValue(unit, value) {
    var host = cards[unit];
    var text = pad(value);
    if (last[unit] === text) return;
    var first = last[unit] === undefined;
    last[unit] = text;
    var next = document.createElement('span');
    next.className = 'v' + (first ? '' : ' in');
    next.textContent = text;
    var old = host.querySelector('.v');
    host.appendChild(next);
    if (old) {
      old.classList.add('out');
      setTimeout(function () { old.remove(); }, 600);
    }
  }

  function remaining(now) {
    var diff = target - now;
    if (diff <= 0) return null;
    var s = Math.floor(diff / 1000);
    return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
  }

  function celebrate() {
    grid.hidden = true;
    document.getElementById('cd-done').hidden = false;
    document.getElementById('cd-title').textContent = 'IT\'S TIME';
    var box = document.getElementById('confetti');
    var colors = ['#E8B96A', '#F52986', '#F8EBD5', '#C99543'];
    for (var i = 0; i < 46; i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 1.2 + 's';
      p.style.animationDuration = 2.4 + Math.random() * 2 + 's';
      box.appendChild(p);
    }
  }

  var timer;
  function tick() {
    var r = remaining(Date.now());
    if (!r) { clearInterval(timer); celebrate(); return; }
    setValue('days', r.days); setValue('hours', r.hours); setValue('minutes', r.minutes); setValue('seconds', r.seconds);
  }
  tick();
  timer = setInterval(tick, 1000);

  window.BN_COUNTDOWN = { targetISO: targetISO, remaining: remaining };
})();
