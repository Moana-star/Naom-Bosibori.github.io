/**
 * WebGL_Slider_Engine.js
 * Fixed-viewport WebGL atmosphere and screen-space project-card renderer.
 * Animation work is capped to a 60 Hz cadence; DOM remains the semantic source.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js";
import { createDOMBridge } from "./DOM_Bridge.js";

(() => {
  if (window.__naomWebGLSlider) return;
  window.__naomWebGLSlider = true;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FRAME_INTERVAL = 1000 / 60;
  const canvas = document.createElement("canvas");
  canvas.id = "portfolio-webgl-stage";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.innerWidth > 700,
      powerPreference: "low-power",
      stencil: false,
      depth: true
    });
  } catch (error) {
    canvas.remove();
    console.warn("WebGL unavailable; semantic HTML content remains available.", error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 100);
  camera.position.z = 12;

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uScroll: { value: 0 },
    uVelocity: { value: new THREE.Vector2(0, 0) }
  };

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      depthTest: false,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uScroll;
        uniform vec2 uVelocity;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }

        void main() {
          vec2 uv = vUv;
          vec2 delta = (uv - uMouse) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
          float cursor = exp(-length(delta) * 4.8);
          float flow = noise(uv * 5.5 + vec2(uTime * 0.065, -uScroll * 5.0));
          float wave = noise(uv * 10.0 - vec2(uTime * 0.04, uScroll * 2.2));
          uv += vec2(flow - 0.5, wave - 0.5) * (0.012 + min(length(uVelocity), 1.0) * 0.02);
          uv += normalize(delta + vec2(0.00001)) * cursor * 0.012;

          float gridX = 1.0 - smoothstep(0.0, 0.018, abs(fract(uv.x * 32.0) - 0.5));
          float gridY = 1.0 - smoothstep(0.0, 0.018, abs(fract(uv.y * 22.0) - 0.5));
          float grid = max(gridX, gridY) * 0.12;
          vec3 deep = vec3(0.035, 0.018, 0.03);
          vec3 wine = vec3(0.28, 0.075, 0.16);
          vec3 rose = vec3(0.48, 0.22, 0.34);
          vec3 color = mix(deep, wine, clamp(flow * 0.5 + cursor * 0.45, 0.0, 0.85));
          color = mix(color, rose, clamp(cursor * 0.18 + wave * 0.06, 0.0, 0.3));
          color += grid * vec3(0.8, 0.42, 0.65);
          float alpha = clamp(0.1 + cursor * 0.18 + grid * 0.45, 0.0, 0.34);
          gl_FragColor = vec4(color, alpha);
        }
      `
    })
  );
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -10;
  scene.add(backdrop);

  const sculpture = new THREE.Group();
  scene.add(sculpture);
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.6, 0.018, 320, 8, 2, 5),
    new THREE.MeshBasicMaterial({ color: 0xd9a1b6, transparent: true, opacity: 0.62, blending: THREE.NormalBlending, depthWrite: false })
  );
  sculpture.add(knot);

  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.1 + i * 0.28, 0.006, 4, 180),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x9b86b7 : 0xd9a1b6,
        transparent: true,
        opacity: 0.12 + i * 0.012,
        blending: THREE.NormalBlending,
        depthWrite: false
      })
    );
    ring.rotation.set(i * 0.4, i * 0.62, i * 0.19);
    ring.scale.y = 0.65 + (i % 3) * 0.12;
    sculpture.add(ring);
  }

  // Cursor ribbon: lightweight GPU points create a living, touch-responsive trail.
  const trailCount = 420;
  const trailPositions = new Float32Array(trailCount * 3);
  const trailAges = new Float32Array(trailCount);
  const trailSizes = new Float32Array(trailCount);
  const trailColors = new Float32Array(trailCount * 3);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3).setUsage(THREE.DynamicDrawUsage));
  trailGeometry.setAttribute("aAge", new THREE.BufferAttribute(trailAges, 1).setUsage(THREE.DynamicDrawUsage));
  trailGeometry.setAttribute("aSize", new THREE.BufferAttribute(trailSizes, 1).setUsage(THREE.DynamicDrawUsage));
  trailGeometry.setAttribute("aColor", new THREE.BufferAttribute(trailColors, 3).setUsage(THREE.DynamicDrawUsage));
  const trailMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) } },
    vertexShader: `
      attribute float aAge;
      attribute float aSize;
      attribute vec3 aColor;
      varying float vAlpha;
      varying vec3 vColor;
      uniform float uPixelRatio;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vColor = aColor;
        vAlpha = pow(max(0.0, 1.0 - aAge), 1.7);
        gl_PointSize = max(1.0, aSize * uPixelRatio * (0.35 + vAlpha) * (260.0 / max(1.0, -mvPosition.z)));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p);
        float glow = exp(-d * 13.0) * (1.0 - smoothstep(0.22, 0.5, d));
        if (glow < 0.015) discard;
        gl_FragColor = vec4(vColor, glow * vAlpha * 0.82);
      }
    `
  });
  const trailPoints = new THREE.Points(trailGeometry, trailMaterial);
  trailPoints.frustumCulled = false;
  trailPoints.renderOrder = 20;
  scene.add(trailPoints);
  let trailHead = 0;
  let trailSpawnAccumulator = 0;
  const trailPalette = [
    new THREE.Color("#e7a8c0"),
    new THREE.Color("#ad91dc"),
    new THREE.Color("#f4d3df"),
    new THREE.Color("#7f9dca")
  ];

  function spawnTrailPoint(x, y, strength = 1) {
    const index = trailHead;
    trailHead = (trailHead + 1) % trailCount;
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
    const width = height * camera.aspect;
    trailPositions[index * 3] = (x / Math.max(1, window.innerWidth) - 0.5) * width;
    trailPositions[index * 3 + 1] = (0.5 - y / Math.max(1, window.innerHeight)) * height;
    trailPositions[index * 3 + 2] = 0.12 + Math.random() * 0.5;
    trailAges[index] = 0;
    trailSizes[index] = (3 + Math.random() * 9) * strength;
    const color = trailPalette[Math.floor(Math.random() * trailPalette.length)];
    trailColors[index * 3] = color.r;
    trailColors[index * 3 + 1] = color.g;
    trailColors[index * 3 + 2] = color.b;
    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.aAge.needsUpdate = true;
    trailGeometry.attributes.aSize.needsUpdate = true;
    trailGeometry.attributes.aColor.needsUpdate = true;
  }
  let lastTrailX = -1000;
  let lastTrailY = -1000;
  function trackTrail(event) {
    const dx = event.clientX - lastTrailX;
    const dy = event.clientY - lastTrailY;
    const distance = Math.hypot(dx, dy);
    if (distance > 2) {
      const count = Math.min(8, Math.max(1, Math.floor(distance / 9)));
      for (let i = 1; i <= count; i++) {
        const t = i / count;
        spawnTrailPoint(lastTrailX < 0 ? event.clientX : lastTrailX + dx * t,
          lastTrailY < 0 ? event.clientY : lastTrailY + dy * t,
          Math.min(1.5, 0.7 + distance / 90));
      }
    }
    lastTrailX = event.clientX;
    lastTrailY = event.clientY;
  }
  window.addEventListener("pointermove", trackTrail, { passive: true });
  window.addEventListener("pointerdown", event => {
    for (let i = 0; i < 18; i++) spawnTrailPoint(event.clientX + (Math.random() - 0.5) * 30,
      event.clientY + (Math.random() - 0.5) * 30, 1.25);
  }, { passive: true });

  const bridge = createDOMBridge({ THREE, renderer });
  const pointer = {
    x: 0, y: 0, targetX: 0, targetY: 0,
    u: 0.5, v: 0.5, targetU: 0.5, targetV: 0.5,
    lastX: 0, lastY: 0, velocity: { x: 0, y: 0 }, lastMoveAt: performance.now()
  };
  const slider = { currentPosition: 0, targetPosition: 0, velocity: 0, lastPosition: 0 };

  let raf = 0;
  let disposed = false;
  let lastFrameAt = 0;
  let previousFrameAt = performance.now();
  let lastPointerSampleAt = performance.now();

  function trackPointer(event) {
    const now = performance.now();
    const dt = Math.max(1, now - lastPointerSampleAt);
    pointer.velocity.x = (event.clientX - pointer.lastX) / dt * 1000;
    pointer.velocity.y = (event.clientY - pointer.lastY) / dt * 1000;
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    pointer.lastMoveAt = now;
    lastPointerSampleAt = now;
    pointer.targetX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
    pointer.targetY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    pointer.targetU = event.clientX / Math.max(1, window.innerWidth);
    pointer.targetV = 1 - event.clientY / Math.max(1, window.innerHeight);
  }
  window.addEventListener("pointermove", trackPointer, { passive: true });

  function setTargetScroll() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    slider.targetPosition = window.scrollY / maxScroll;
  }
  window.addEventListener("scroll", setTargetScroll, { passive: true });

  function resize() {
    const width = window.innerWidth;
    const height = Math.max(1, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 1 : 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    uniforms.uResolution.value.set(width, height);
    bridge.resize(width, height);
    setTargetScroll();
  }
  window.addEventListener("resize", resize, { passive: true });

  function wakeUpAudioPipeline() {
    const audio = window.NaomAudioEngine;
    if (!audio || audio.unlocked) return;
    try {
      audio.unlock();
      window.removeEventListener("click", wakeUpAudioPipeline);
      window.removeEventListener("pointerdown", wakeUpAudioPipeline);
      window.removeEventListener("touchstart", wakeUpAudioPipeline);
      window.removeEventListener("keydown", wakeUpAudioPipeline);
    } catch (error) {
      console.warn("Audio could not be unlocked on this interaction.", error);
    }
  }
  window.addEventListener("click", wakeUpAudioPipeline, { passive: true });
  window.addEventListener("pointerdown", wakeUpAudioPipeline, { passive: true });
  window.addEventListener("touchstart", wakeUpAudioPipeline, { passive: true });
  window.addEventListener("keydown", wakeUpAudioPipeline, { passive: true });

  function renderFrame(now) {
    if (disposed) return;
    raf = window.requestAnimationFrame(renderFrame);
    if (document.hidden) return;
    if (lastFrameAt && now - lastFrameAt < FRAME_INTERVAL) return;
    lastFrameAt = now - (lastFrameAt ? (now - lastFrameAt) % FRAME_INTERVAL : 0);

    const dt = Math.max(0.001, Math.min(0.05, (now - previousFrameAt) / 1000));
    previousFrameAt = now;
    const time = now * 0.001;

    pointer.x += (pointer.targetX - pointer.x) * 0.08;
    pointer.y += (pointer.targetY - pointer.y) * 0.08;
    pointer.u += (pointer.targetU - pointer.u) * 0.08;
    pointer.v += (pointer.targetV - pointer.v) * 0.08;
    if (now - pointer.lastMoveAt > 90) {
      pointer.velocity.x *= 0.82;
      pointer.velocity.y *= 0.82;
    }

    const previous = slider.currentPosition;
    slider.currentPosition += (slider.targetPosition - slider.currentPosition) * 0.065;
    slider.velocity = (slider.currentPosition - previous) / dt;
    slider.lastPosition = previous;

    for (let i = 0; i < trailCount; i++) trailAges[i] = Math.min(1, trailAges[i] + dt * 0.62);
    trailGeometry.attributes.aAge.needsUpdate = true;

    uniforms.uTime.value = time;
    uniforms.uMouse.value.set(pointer.u, pointer.v);
    uniforms.uScroll.value = slider.currentPosition;
    uniforms.uVelocity.value.set(
      THREE.MathUtils.clamp(pointer.velocity.x * 0.0008, -1.0, 1.0),
      THREE.MathUtils.clamp(slider.velocity * 0.002 + pointer.velocity.y * 0.0005, -1.0, 1.0)
    );

    sculpture.rotation.y = time * 0.035 + pointer.x * 0.07 + slider.currentPosition * 0.45;
    sculpture.rotation.x = pointer.y * 0.04;
    sculpture.position.x += (pointer.x * 0.16 - sculpture.position.x) * 0.08;
    sculpture.position.y += (-slider.currentPosition * 0.45 - sculpture.position.y) * 0.08;
    sculpture.scale.setScalar(window.innerWidth < 700 ? 0.78 : 1.22);
    camera.position.x += (pointer.x * 0.18 - camera.position.x) * 0.08;
    camera.position.y += (-pointer.y * 0.12 - camera.position.y) * 0.08;
    camera.lookAt(0, -slider.currentPosition * 0.2, 0);

    bridge.update(time, pointer, slider);
    renderer.clear();
    renderer.render(scene, camera);
    bridge.render();

    if (reduceMotion) {
      window.cancelAnimationFrame(raf);
      bridge.update(0, pointer, slider);
      renderer.clear();
      renderer.render(scene, camera);
      bridge.render();
      return;
    }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      window.cancelAnimationFrame(raf);
    } else {
      previousFrameAt = performance.now();
      lastFrameAt = 0;
      setTargetScroll();
      raf = window.requestAnimationFrame(renderFrame);
    }
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  function dispose() {
    disposed = true;
    window.cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", trackPointer);
    window.removeEventListener("pointermove", trackTrail);
    window.removeEventListener("scroll", setTargetScroll);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    bridge.dispose();
    renderer.dispose();
    canvas.remove();
    window.__naomWebGLSlider = false;
  }
  window.NaomWebGLSlider = { dispose, renderer, bridge };

  setTargetScroll();
  resize();
  raf = window.requestAnimationFrame(renderFrame);
})();
