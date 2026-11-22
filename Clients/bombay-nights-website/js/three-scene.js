/* Hero 3D: mirrored disco ball + drifting gold dust (Three.js).
   Mobile gets a lighter ball and fewer particles; reduced-motion or no WebGL gets the CSS fallback. */
(function () {
  var host = document.getElementById('disco');
  if (!host) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 767px)').matches;
  if (reduce || !window.THREE) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return; }

  host.classList.add('webgl');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75));
  host.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  var group = new THREE.Group();
  scene.add(group);

  // Ball: flat-shaded facets, each tile gets its own brightness so it reads like mirror tiles.
  var geo = new THREE.IcosahedronGeometry(1.7, small ? 2 : 3).toNonIndexed();
  var count = geo.attributes.position.count;
  var colors = new Float32Array(count * 3);
  for (var i = 0; i < count; i += 3) {
    var b = 0.45 + Math.random() * 0.55;
    var warm = Math.random();
    for (var k = 0; k < 3; k++) {
      colors[(i + k) * 3] = b * (0.85 + warm * 0.15);
      colors[(i + k) * 3 + 1] = b * (0.82 + warm * 0.1);
      colors[(i + k) * 3 + 2] = b * (0.9 - warm * 0.15);
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  var mat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.9, roughness: 0.22, flatShading: true });
  var ball = new THREE.Mesh(geo, mat);
  group.add(ball);

  // Cord
  var cordGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.7, 0), new THREE.Vector3(0, 7, 0)]);
  var cordMat = new THREE.LineBasicMaterial({ color: 0xc99543, transparent: true, opacity: 0.7 });
  group.add(new THREE.Line(cordGeo, cordMat));

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  var gold = new THREE.PointLight(0xe8b96a, 90, 0, 2); gold.position.set(-4, 3, 5); scene.add(gold);
  var magenta = new THREE.PointLight(0xf52986, 80, 0, 2); magenta.position.set(4, -2, 4); scene.add(magenta);
  var white = new THREE.PointLight(0xffffff, 40, 0, 2); white.position.set(0, 4, 6); scene.add(white);

  // Gold dust
  var N = small ? 70 : 180;
  var pos = new Float32Array(N * 3);
  var speed = new Float32Array(N);
  for (var p = 0; p < N; p++) {
    pos[p * 3] = (Math.random() - 0.5) * 14;
    pos[p * 3 + 1] = (Math.random() - 0.5) * 10;
    pos[p * 3 + 2] = (Math.random() - 0.5) * 6;
    speed[p] = 0.1 + Math.random() * 0.25;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var pMat = new THREE.PointsMaterial({ color: 0xe8b96a, size: 0.05, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  var dust = new THREE.Points(pGeo, pMat);
  scene.add(dust);

  var mouse = { x: 0, y: 0 }, tx = 0, ty = 0;
  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function resize() {
    var w = host.clientWidth || 400, h = host.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host); else window.addEventListener('resize', resize);

  var clock = new THREE.Clock();
  var running = true, raf = 0;
  function frame() {
    if (!running) return;
    var t = clock.getElapsedTime(), dt = Math.min(clock.getDelta(), 0.05);
    var A = window.BN_AUDIO;
    ball.rotation.y = t * 0.28 + (A ? A.level * 0.6 : 0);
    if (A) {
      ball.scale.setScalar(1 + A.beat * 0.07);
      magenta.intensity = 80 + A.beat * 160;
      gold.intensity = 90 + A.level * 140;
      pMat.size = 0.05 + A.beat * 0.04;
    }
    group.rotation.z = Math.sin(t * 0.5) * 0.03;
    gold.position.x = Math.sin(t * 0.7) * 5;
    magenta.position.y = Math.cos(t * 0.6) * 3;
    tx += (mouse.x * 0.5 - tx) * 0.04;
    ty += (mouse.y * 0.3 - ty) * 0.04;
    group.position.x = tx; group.position.y = -ty;
    var a = pGeo.attributes.position.array;
    for (var j = 0; j < N; j++) {
      a[j * 3 + 1] += speed[j] * 0.016;
      if (a[j * 3 + 1] > 5) a[j * 3 + 1] = -5;
    }
    pGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  frame();

  // Pause when the hero is off screen or the tab is hidden.
  function setRunning(on) {
    if (on && !running) { running = true; clock.getDelta(); frame(); }
    if (!on) { running = false; cancelAnimationFrame(raf); }
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { setRunning(e[0].isIntersecting); }).observe(document.getElementById('home'));
  }
  document.addEventListener('visibilitychange', function () { setRunning(!document.hidden); });
})();
