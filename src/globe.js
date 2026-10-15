// Travel globe: dotted continents, glowing markers for visited places and arcs from home.
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { feature } from "topojson-client";
import { html, SectionHead, Icon, reduceMotion } from "./ui.js";
import { travels } from "./data.js";
import { unlock } from "./achievements.js";
import { t } from "./i18n.js";

const COUNTRIES_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json";
const R = 1;
const DEG = Math.PI / 180;

// lat/lon → point on the sphere. lon 0 faces +x; the camera sits on +z.
function toVec(lat, lon, r = R) {
  return new THREE.Vector3(
    Math.cos(lat * DEG) * Math.cos(lon * DEG) * r,
    Math.sin(lat * DEG) * r,
    -Math.cos(lat * DEG) * Math.sin(lon * DEG) * r,
  );
}

// Rotation that turns (lat, lon) to face the camera (see toVec).
const facing = (lat, lon) => ({ x: lat * DEG, y: -Math.PI / 2 - lon * DEG });

// Country names as written in travels → names used by the map.
const ALIASES = {
  usa: "United States of America", us: "United States of America", "united states": "United States of America", america: "United States of America",
  uk: "United Kingdom", england: "United Kingdom", scotland: "United Kingdom", britain: "United Kingdom",
  korea: "South Korea", "republic of korea": "South Korea", "czech republic": "Czechia", uae: "United Arab Emirates",
};
const norm = (name) => { const k = String(name).trim().toLowerCase(); return (ALIASES[k] || k).toLowerCase(); };

// Rasterise every country into an equirectangular ID map (colour = country index + 1).
async function loadCountryMap() {
  const topo = await fetch(COUNTRIES_URL).then((r) => r.json());
  const feats = feature(topo, topo.objects.countries).features;
  const W = 1440, H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const px = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
  feats.forEach((f, i) => {
    const g = f.geometry;
    if (!g) return;
    const id = i + 1;
    ctx.fillStyle = `rgb(${id & 255}, ${id >> 8}, 0)`;
    ctx.beginPath();
    for (const poly of g.type === "Polygon" ? [g.coordinates] : g.coordinates) {
      for (const ring of poly) {
        let prev = null;
        ring.forEach((c, j) => {
          const [x, y] = px(c);
          // Break the path where a ring wraps across the antimeridian.
          if (j === 0 || (prev && Math.abs(c[0] - prev[0]) > 180)) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          prev = c;
        });
      }
    }
    ctx.fill("evenodd");
  });
  const data = ctx.getImageData(0, 0, W, H).data;
  const names = feats.map((f) => f.properties?.name || "");
  const lookup = (lat, lon) => {
    const x = Math.min(W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * W)));
    const y = Math.min(H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * H)));
    const o = (y * W + x) * 4;
    if (data[o + 3] < 128) return -2; // sea
    const id = data[o] + (data[o + 1] << 8) - 1;
    return id >= 0 && id < names.length ? id : -1; // -1: land on an anti-aliased border
  };
  return { names, lookup };
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 70, 128, 128, 126);
  grd.addColorStop(0, "rgba(188,215,255,0.32)");
  grd.addColorStop(0.35, "rgba(188,215,255,0.1)");
  grd.addColorStop(1, "rgba(188,215,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function buildGlobe(canvas, places, { onReady, onHover, onPick }) {
  const small = window.innerWidth < 768;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 4.6);

  const globe = new THREE.Group();
  scene.add(globe);

  // Glow behind the globe.
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), depthWrite: false, transparent: true }));
  glow.scale.set(2.7, 2.7, 1); // must stay inside the camera's view, or the canvas edge shows
  scene.add(glow);

  // Dark core hides the dots on the far side.
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 64, 64), new THREE.MeshBasicMaterial({ color: 0x05070b })));

  // Faint graticule.
  const grat = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 });
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = []; for (let lon = -180; lon <= 180; lon += 4) pts.push(toVec(lat, lon, R * 1.001));
    grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const pts = []; for (let lat = -90; lat <= 90; lat += 4) pts.push(toVec(lat, lon, R * 1.001));
    grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
  globe.add(grat);

  // Land dots (filled in once the map loads), coloured by country.
  const C_BASE = new THREE.Color("#7c8592"), C_VISITED = new THREE.Color("#bcd7ff"), C_HOVER = new THREE.Color("#ffffff");
  let landReady = false, countryNames = [], visited = new Set(), dotsByCountry = new Map(), colors = null, dotGeo = null;
  let lookupCountry = () => -2;
  const countryOf = (name) => countryNames.findIndex((n) => n.toLowerCase() === norm(name));
  const paint = (idx, color) => {
    if (!colors) return;
    for (const i of dotsByCountry.get(idx) || []) color.toArray(colors, i * 3);
    dotGeo.attributes.color.needsUpdate = true;
  };
  loadCountryMap().then(({ names, lookup }) => {
    countryNames = names;
    lookupCountry = lookup;
    places.forEach((p) => { const i = countryOf(p.country); if (i >= 0) visited.add(i); });
    const N = small ? 16000 : 30000;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pos = [], col = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const lat = Math.asin(y) / DEG;
      const lon = ((((golden * i) / DEG) % 360) + 360) % 360 - 180;
      const c = lookup(lat, lon);
      if (c === -2) continue;
      const n = pos.length / 3;
      pos.push(...toVec(lat, lon, R).toArray());
      (visited.has(c) ? C_VISITED : C_BASE).toArray(col, n * 3);
      if (c >= 0) { if (!dotsByCountry.has(c)) dotsByCountry.set(c, []); dotsByCountry.get(c).push(n); }
    }
    colors = new Float32Array(col);
    dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    dotGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    globe.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({ vertexColors: true, size: small ? 0.015 : 0.012, sizeAttenuation: true, transparent: true, opacity: 0.95 })));
    landReady = true;
    onReady?.(true);
  }).catch((err) => { console.warn("Map failed to load:", err); onReady?.(false); });

  // Markers + arcs.
  const home = places.find((p) => p.home) || places[0];
  const markers = [];
  const arcMats = [];
  places.forEach((p) => {
    const color = new THREE.Color(p.home ? "#7dffb3" : "#bcd7ff");
    const at = toVec(p.lat, p.lon, R * 1.004);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(p.home ? 0.022 : 0.018, 16, 16), new THREE.MeshBasicMaterial({ color }));
    dot.position.copy(at);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.038, 40), new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.copy(at);
    ring.lookAt(at.clone().multiplyScalar(2));
    globe.add(dot, ring);
    markers.push({ place: p, dot, ring, phase: Math.random() * Math.PI * 2 });

    if (p !== home) {
      const a = toVec(home.lat, home.lon, R), b = toVec(p.lat, p.lon, R);
      const lift = 1 + Math.min(a.distanceTo(b) * 0.45, 0.6) + 0.04;
      const mid = a.clone().add(b).normalize().multiplyScalar(lift);
      const curve = new THREE.QuadraticBezierCurve3(a.multiplyScalar(1.004), mid, b.multiplyScalar(1.004));
      const pts = curve.getPoints(80);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setAttribute("t", new THREE.Float32BufferAttribute(pts.map((_, i) => i / (pts.length - 1)), 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#bcd7ff") } },
        transparent: true, depthWrite: false,
        vertexShader: "attribute float t; varying float vT; void main(){ vT=t; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
        fragmentShader: "uniform float uTime; uniform vec3 uColor; varying float vT; void main(){ float head=fract(uTime*0.35); float d=head-vT; float trail=d>0.0? exp(-d*9.0):0.0; gl_FragColor=vec4(uColor, 0.18+0.82*trail); }",
      });
      arcMats.push(mat);
      globe.add(new THREE.Line(geo, mat));
    }
  });

  // Start facing home, tilted slightly.
  const start = facing(home.lat, home.lon);
  globe.rotation.set(start.x + 0.25, start.y, 0, "XYZ");
  const target = { x: globe.rotation.x, y: globe.rotation.y };
  let focusing = false;

  // Hover: find the visited country under the pointer (or under a marker).
  let hovered = -1;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  const sphere = new THREE.Sphere(new THREE.Vector3(), R), inv = new THREE.Matrix4(), mpos = new THREE.Vector3();
  const setHovered = (idx, x = 0, y = 0) => {
    if (idx !== hovered) {
      if (hovered >= 0) paint(hovered, visited.has(hovered) ? C_VISITED : C_BASE);
      if (idx >= 0) paint(idx, C_HOVER);
      hovered = idx;
      canvas.style.cursor = idx >= 0 ? "pointer" : "";
    }
    const name = countryNames[idx];
    onHover?.(idx >= 0 ? { name, places: places.filter((p) => norm(p.country) === name.toLowerCase()), x, y } : null);
  };
  const hoverAt = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    // Markers first (nearest one wins): small countries like Singapore have no dots of their own.
    let near = null, best = 14;
    for (const m of markers) {
      m.dot.getWorldPosition(mpos);
      if (mpos.z < 0.12) continue;
      mpos.project(camera);
      const d = Math.hypot((mpos.x * 0.5 + 0.5) * rect.width - x, (-mpos.y * 0.5 + 0.5) * rect.height - y);
      if (d < best) { best = d; near = m; }
    }
    if (near) { const i = countryOf(near.place.country); if (i >= 0) return setHovered(i, x, y); }
    ndc.set((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectSphere(sphere, hit)) return setHovered(-1);
    hit.applyMatrix4(inv.copy(globe.matrixWorld).invert());
    const lat = Math.asin(THREE.MathUtils.clamp(hit.y / R, -1, 1)) / DEG;
    const lon = Math.atan2(-hit.z, hit.x) / DEG;
    const c = lookupCountry(lat, lon);
    setHovered(visited.has(c) ? c : -1, x, y);
  };

  // Drag to rotate, with inertia. A press that doesn't move counts as a click.
  let dragging = false, last = null, vel = { x: 0, y: 0 }, idle = 0, travelled = 0;
  const down = (e) => { dragging = true; focusing = false; travelled = 0; last = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture?.(e.pointerId); };
  const move = (e) => {
    if (!dragging) {
      if (e.target === canvas && landReady) { hoverAt(e); if (hovered >= 0) idle = 0; }
      else if (hovered >= 0) setHovered(-1);
      return;
    }
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    last = { x: e.clientX, y: e.clientY };
    travelled += Math.abs(dx) + Math.abs(dy);
    if (hovered >= 0) setHovered(-1);
    vel = { x: dy * 0.006, y: dx * 0.006 };
    globe.rotation.y += vel.y;
    globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + vel.x, -1.2, 1.2);
    idle = 0;
  };
  const up = (e) => {
    if (dragging && travelled < 5 && hovered >= 0) {
      const p = places.find((q) => norm(q.country) === countryNames[hovered].toLowerCase());
      if (p) onPick?.(p);
    }
    dragging = false;
  };
  const leave = () => { if (!dragging && hovered >= 0) setHovered(-1); };
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Only render while the globe is on screen.
  let visible = false, raf = 0, t = 0;
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); }
  });
  io.observe(canvas);

  const labelCallbacks = new Set();
  function frame() {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    if (hovered >= 0) idle = 0; // hold still while a country is hovered
    if (focusing) {
      const k = 1 - Math.exp(-dt * 5); // time-based easing: same speed at any frame rate
      globe.rotation.x += (target.x - globe.rotation.x) * k;
      globe.rotation.y += (target.y - globe.rotation.y) * k;
      if (Math.abs(target.y - globe.rotation.y) < 0.002 && Math.abs(target.x - globe.rotation.x) < 0.002) focusing = false;
    } else if (!dragging) {
      vel.x *= 0.92; vel.y *= 0.92;
      globe.rotation.y += vel.y;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + vel.x, -1.2, 1.2);
      idle += dt;
      if (idle > 2.5 && !reduceMotion()) globe.rotation.y += dt * 0.12;
    }
    for (const m of markers) {
      const s = 1 + ((t * 0.8 + m.phase) % 1) * 1.6;
      m.ring.scale.setScalar(s);
      m.ring.material.opacity = Math.max(0, 1 - (s - 1) / 1.6);
    }
    arcMats.forEach((mat, i) => (mat.uniforms.uTime.value = t + i * 0.37));
    renderer.render(scene, camera);

    // Screen positions for HTML labels (hidden when on the far side).
    if (labelCallbacks.size) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const out = markers.map((m) => {
        m.dot.getWorldPosition(tmp);
        const front = tmp.z > 0.12;
        tmp.project(camera);
        return { name: m.place.place, x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, front };
      });
      labelCallbacks.forEach((cb) => cb(out));
    }
    raf = requestAnimationFrame(frame);
  }

  return {
    focus(p) {
      const f = facing(p.lat, p.lon);
      // Take the short way round.
      const cur = globe.rotation.y;
      let y = f.y; while (y - cur > Math.PI) y -= Math.PI * 2; while (cur - y > Math.PI) y += Math.PI * 2;
      target.x = f.x; target.y = y; focusing = true; vel = { x: 0, y: 0 }; idle = 0;
    },
    onLabels(cb) { labelCallbacks.add(cb); return () => labelCallbacks.delete(cb); },
    // Highlight a country from outside the globe (e.g. hovering the place list).
    highlight(countryName) {
      const i = countryName ? countryOf(countryName) : -1;
      if (i !== hovered) {
        if (hovered >= 0) paint(hovered, visited.has(hovered) ? C_VISITED : C_BASE);
        if (i >= 0) paint(i, C_HOVER);
        hovered = i;
      }
    },
    get landReady() { return landReady; },
    dispose() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      renderer.dispose();
    },
  };
}

export function Travel({ index }) {
  const canvasRef = useRef(null);
  const globeRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mapState, setMapState] = useState("loading");
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let g;
    try {
      g = buildGlobe(canvasRef.current, travels, {
        onReady: (ok) => setMapState(ok ? "ready" : "failed"),
        onHover: (h) => { setHover(h); if (h) unlock("globe"); },
        onPick: (p) => { setSelected(p); g.focus(p); },
      });
    } catch (err) {
      console.warn("Globe disabled:", err);
      setMapState("failed");
      return;
    }
    globeRef.current = g;
    const off = g.onLabels(setLabels);
    return () => { off(); g.dispose(); };
  }, []);

  const pick = (p) => { setSelected(p); globeRef.current?.focus(p); };

  // Hide labels that would collide with a higher-priority one (selected first, then home).
  const shown = (() => {
    const selName = (selected || travels.find((p) => p.home))?.place;
    const homeName = travels.find((p) => p.home)?.place;
    const rank = (l) => (l.name === selName ? 0 : l.name === homeName ? 1 : 2);
    const placed = [];
    return [...labels].sort((a, b) => rank(a) - rank(b)).map((l) => {
      const hidden = !l.front || placed.some((o) => Math.abs(o.x - l.x) < 90 && Math.abs(o.y - l.y) < 26);
      if (!hidden) placed.push(l);
      return { ...l, hidden };
    });
  })();
  const countries = new Set(travels.map((p) => p.country)).size;
  // Home pinned first, then newest year first; places without a year go last.
  const ordered = [...travels].sort((a, b) => (b.home ? 1 : 0) - (a.home ? 1 : 0) || (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  const sel = selected || travels.find((p) => p.home);

  return html`<section id="travel" className="section">
    <${SectionHead} index=${index} label=${t("Travel")} title=${t("Places I've been.")} />
    <div className="travel" data-reveal>
      <div className="globe-wrap">
        <canvas ref=${canvasRef} className="globe" aria-label="Interactive globe of places visited"></canvas>
        <div className="globe-labels" aria-hidden="true">
          ${shown.map((l) => html`<span key=${l.name} className=${"globe-label mono" + (l.hidden ? " back" : "") + (sel?.place === l.name ? " on" : "")}
            style=${{ transform: `translate(${l.x}px, ${l.y}px) translate(-50%, -170%)` }}>${t(l.name)}</span>`)}
        </div>
        ${hover && html`<div className="globe-tip glass" style=${{ transform: `translate(${hover.x}px, ${hover.y}px)` }}>
          <div className="globe-tip-name">${t(hover.name)}</div>
          ${hover.places.map((p) => html`<div key=${p.place} className="globe-tip-place mono">
            <span className=${"travel-dot" + (p.home ? " home" : "")}></span>${p.place}<span className="dim">${p.home ? " · " + t("Home") : p.year ? " · " + p.year : ""}</span>
          </div>`)}
        </div>`}
        ${mapState === "loading" && html`<div className="globe-status mono">${t("Loading map…")}</div>`}
        <div className="globe-hint mono">${t("Drag to spin · hover a lit-up country")}</div>
      </div>
      <div className="travel-side">
        <div className="travel-stats">
          <div className="stat glass"><div className="stat-v">${countries}</div><div className="stat-l">${t(countries === 1 ? "Country" : "Countries")}</div></div>
          <div className="stat glass"><div className="stat-v">${travels.length}</div><div className="stat-l">${t("Places pinned")}</div></div>
        </div>
        <div className="travel-list" role="list">
          ${ordered.map((p) => html`<button key=${p.place} role="listitem" className=${"travel-item" + (sel?.place === p.place ? " on" : "") + (p.home ? " home" : "")}
              onClick=${() => pick(p)}
              onMouseEnter=${() => globeRef.current?.highlight(p.country)} onMouseLeave=${() => globeRef.current?.highlight(null)}>
            <span className="travel-dot"></span>
            <span className="travel-name">${t(p.place)}<span className="dim"> · ${t(p.country)}</span></span>
            <span className="mono dim">${p.home ? t("HOME") : p.year || ""}</span>
          </button>`)}
        </div>
        ${sel?.note && html`<div className="travel-note glass"><${Icon} name=${sel.home ? "globe" : "plane"} size=${18} /><span>${t(sel.note)}</span></div>`}
      </div>
    </div>
  </section>`;
}
