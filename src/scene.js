// Fixed full-screen Three.js background: a breathing particle core,
// orbital rings and a starfield that react to the mouse and to scrolling.
import * as THREE from "three";

export function startScene(canvas) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = window.innerWidth < 768;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.035);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 0, 9);

  const world = new THREE.Group();
  scene.add(world);

  // ── Particle core: points on a Fibonacci sphere, displaced in the shader ──
  const CORE_COUNT = isSmall ? 6000 : 14000;
  const corePos = new Float32Array(CORE_COUNT * 3);
  const coreSeed = new Float32Array(CORE_COUNT);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < CORE_COUNT; i++) {
    const y = 1 - (i / (CORE_COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    corePos.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3);
    coreSeed[i] = Math.random();
  }
  const coreGeo = new THREE.BufferGeometry();
  coreGeo.setAttribute("position", new THREE.BufferAttribute(corePos, 3));
  coreGeo.setAttribute("seed", new THREE.BufferAttribute(coreSeed, 1));

  const coreUniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.22 },
    uRadius: { value: 2.3 },
    uPixel: { value: renderer.getPixelRatio() },
    uAccent: { value: new THREE.Color("#bcd7ff") },
    uMouse: { value: new THREE.Vector3() },
    uFade: { value: 1 },
  };
  const coreMat = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime, uAmp, uRadius, uPixel;
      uniform vec3 uMouse;
      attribute float seed;
      varying float vGlow;
      varying float vSeed;
      float wave(vec3 p, float t) {
        return sin(p.x * 3.1 + t) * sin(p.y * 2.7 + t * 1.3) * sin(p.z * 3.3 + t * 0.7)
             + 0.5 * sin(p.x * 6.0 - t * 1.7 + p.y * 4.0);
      }
      void main() {
        vec3 n = normalize(position);
        float d = wave(n * 1.2, uTime * 0.6);
        // ripple outward where the cursor points
        float m = smoothstep(0.75, 1.0, dot(n, normalize(uMouse + vec3(0.0001))));
        vec3 p = n * (uRadius + d * uAmp + m * 0.35 * length(uMouse));
        vGlow = smoothstep(-0.6, 1.2, d) + m;
        vSeed = seed;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.4 + seed * 1.8 + vGlow * 1.2) * uPixel * (7.0 / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uAccent;
      uniform float uFade;
      varying float vGlow;
      varying float vSeed;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        float a = smoothstep(0.5, 0.0, r);
        vec3 c = mix(vec3(0.75, 0.78, 0.84), uAccent, clamp(vGlow, 0.0, 1.0));
        c = mix(c, vec3(1.0), step(0.97, vSeed));
        gl_FragColor = vec4(c, a * uFade * (0.35 + 0.65 * clamp(vGlow, 0.0, 1.0)));
      }`,
  });
  const core = new THREE.Points(coreGeo, coreMat);
  world.add(core);

  // ── Wireframe shell ──
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(3.15, 1)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 })
  );
  world.add(shell);

  // ── Orbital rings with a travelling light ──
  const rings = [];
  const ringDefs = [
    { r: 3.9, tilt: [1.2, 0.2, 0], speed: 0.12, dash: 0.55 },
    { r: 4.6, tilt: [1.75, -0.5, 0.3], speed: -0.08, dash: 0.3 },
    { r: 5.4, tilt: [0.4, 0.9, -0.2], speed: 0.05, dash: 0.2 },
  ];
  for (const d of ringDefs) {
    const pts = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * d.r, Math.sin(a) * d.r, 0));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const ring = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }));
    ring.rotation.set(...d.tilt);

    const comet = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xdfeaff })
    );
    ring.add(comet);
    world.add(ring);
    rings.push({ ring, comet, ...d, phase: Math.random() * Math.PI * 2 });
  }

  // ── Starfield ──
  const STARS = isSmall ? 1500 : 3500;
  const starPos = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    const r = 18 + Math.random() * 60;
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    starPos.set([s * Math.cos(th) * r, u * r, s * Math.sin(th) * r], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false })
  );
  scene.add(stars);

  // ── Interaction state ──
  const mouse = new THREE.Vector2();
  const mouseSmooth = new THREE.Vector2();
  let scroll = 0;
  let warp = 0; // 0..1, boosted by the Konami-code easter egg
  let warpTarget = 0;
  // Scene mood: accent colour + how much the core recedes behind a context background.
  const DEFAULT_ACCENT = new THREE.Color("#bcd7ff");
  const accentTarget = DEFAULT_ACCENT.clone();
  let dim = 0, dimTarget = 0;

  const onMove = (e) => {
    mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  };
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scroll = max > 0 ? window.scrollY / max : 0;
  };
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", resize);
  resize();
  onScroll();

  // ── Loop ──
  const clock = new THREE.Clock();
  let running = true;
  let t = 0;
  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    warp += (warpTarget - warp) * 0.04;
    t += dt * (reduceMotion ? 0.15 : 1) * (1 + warp * 4);

    mouseSmooth.lerp(mouse, 0.05);
    coreUniforms.uTime.value = t;
    coreUniforms.uAmp.value = 0.22 + warp * 0.5;
    coreUniforms.uMouse.value.set(mouseSmooth.x, mouseSmooth.y, 0.6);

    // The core drifts right and recedes as you scroll down the page.
    const s = scroll;
    const wide = camera.aspect > 1.15;
    const side = wide ? 3.1 + Math.min(s * 6, 1) * 1.4 : 0;
    dim += (dimTarget - dim) * 0.04;
    coreUniforms.uAccent.value.lerp(accentTarget, 0.04);
    for (const r of rings) r.comet.material.color.lerp(accentTarget, 0.04);
    coreUniforms.uFade.value = (wide ? 1 : 0.5) * (1 - Math.min(s * 5, 1) * 0.72) * (1 - dim * 0.6);
    world.position.x += (side - world.position.x) * 0.05;
    world.position.y += ((wide ? -0.2 : 0.6) - s * 1.5 - world.position.y) * 0.05;
    const scale = 1 - Math.min(s * 3, 1) * 0.25;
    world.scale.setScalar(world.scale.x + (scale - world.scale.x) * 0.05);

    core.rotation.y = t * 0.08;
    core.rotation.x = Math.sin(t * 0.1) * 0.2;
    shell.rotation.y = -t * 0.04;
    shell.rotation.z = t * 0.02;
    for (const r of rings) {
      const a = r.phase + t * r.speed * 6;
      r.comet.position.set(Math.cos(a) * r.r, Math.sin(a) * r.r, 0);
      r.ring.rotation.z += r.speed * dt;
    }
    stars.rotation.y = t * 0.006 + s * 0.6;
    stars.rotation.x = s * 0.3;

    camera.position.x += (mouseSmooth.x * 0.8 - camera.position.x) * 0.04;
    camera.position.y += (mouseSmooth.y * 0.5 - camera.position.y) * 0.04;
    camera.position.z = 9 - warp * 3;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) running = false;
    else if (!running) { running = true; clock.getDelta(); requestAnimationFrame(frame); }
  });

  return {
    setWarp(on) { warpTarget = on ? 1 : 0; },
    toggleWarp() { warpTarget = warpTarget ? 0 : 1; return !!warpTarget; },
    setMood(accent) {
      accentTarget.copy(accent ? new THREE.Color(accent) : DEFAULT_ACCENT);
      dimTarget = accent ? 1 : 0;
    },
  };
}
