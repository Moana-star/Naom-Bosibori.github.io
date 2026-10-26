import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js";
import { createDOMBridge } from "./DOM_Bridge.js";

(() => {
  if (window.__naomWebGLSlider) return;
  window.__naomWebGLSlider = true;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  canvas.id = "portfolio-webgl-stage";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: innerWidth > 700,
      powerPreference: "low-power",
      stencil: false
    });
  } catch (error) {
    canvas.remove();
    console.warn("WebGL is unavailable; HTML content remains fully usable.", error);
    return;
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1 : 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, innerWidth / Math.max(1, innerHeight), 0.1, 100);
  camera.position.z = 12;

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uScroll: { value: 0 },
    uVelocity: { value: new THREE.Vector2(0, 0) },
    uHover: { value: 1 }
  };

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}`,
      fragmentShader: `
        precision highp float;
        uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse;
        uniform float uScroll; uniform vec2 uVelocity; varying vec2 vUv;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
        void main(){
          vec2 uv=vUv; vec2 aspect=vec2(uResolution.x/max(uResolution.y,1.0),1.0);
          vec2 d=(uv-uMouse)*aspect; float r=length(d);
          float n=noise(uv*5.0+vec2(uTime*.07,-uScroll*2.0));
          float influence=exp(-r*5.0);
          uv+=vec2(n-.5,noise(uv*9.0+uTime*.1)-.5)*.018;
          uv+=normalize(d+vec2(.0001))*(.018*influence+uVelocity*.003);
          float lines=step(.985,fract(uv.x*36.0))+step(.985,fract(uv.y*26.0));
          vec3 color=mix(vec3(.045,.025,.04),vec3(.42,.16,.31),clamp(influence*.6+n*.2,0.,1.));
          float alpha=clamp(.03*lines+.06*influence+.02*n,0.,.15);
          gl_FragColor=vec4(color,alpha);
        }`
    })
  );
  backdrop.position.z = -2;
  scene.add(backdrop);

  const sculpture = new THREE.Group();
  scene.add(sculpture);
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.7, 0.012, 260, 6, 2, 5),
    new THREE.MeshBasicMaterial({ color: 0xd9a1b6, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sculpture.add(knot);

  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.2 + i * 0.2, 0.004, 4, 144),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x9b86b7 : 0xd9a1b6, transparent: true, opacity: 0.07 + i * 0.009, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.set(i * 0.4, i * 0.62, i * 0.19);
    ring.scale.y = 0.65 + (i % 3) * 0.12;
    sculpture.add(ring);
  }

  const bridge = createDOMBridge({ THREE, renderer });
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, u: 0.5, v: 0.5, targetU: 0.5, targetV: 0.5 };
  const slider = { currentPosition: 0, targetPosition: 0, velocity: 0, lastPosition: 0 };
  let raf = 0;
  let disposed = false;
  let lastTime = performance.now();

  addEventListener("pointermove", event => {
    pointer.targetX = (event.clientX / Math.max(1, innerWidth) - 0.5) * 2;
    pointer.targetY = (event.clientY / Math.max(1, innerHeight) - 0.5) * 2;
    pointer.targetU = event.clientX / Math.max(1, innerWidth);
    pointer.targetV = 1 - event.clientY / Math.max(1, innerHeight);
  }, { passive: true });

  function setTargetScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    slider.targetPosition = window.scrollY / max;
  }

  addEventListener("scroll", setTargetScroll, { passive: true });
  addEventListener("resize", resize, { passive: true });

  function resize() {
    const w = innerWidth, h = Math.max(1, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, w < 700 ? 1 : 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uResolution.value.set(w, h);
    bridge.resize(w, h);
  }

  function animate(now) {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    if (document.hidden) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    const time = now * 0.001;

    pointer.x += (pointer.targetX - pointer.x) * 0.08;
    pointer.y += (pointer.targetY - pointer.y) * 0.08;
    pointer.u += (pointer.targetU - pointer.u) * 0.08;
    pointer.v += (pointer.targetV - pointer.v) * 0.08;

    const previous = slider.currentPosition;
    slider.currentPosition += (slider.targetPosition - slider.currentPosition) * 0.065;
    slider.velocity = (slider.currentPosition - previous) / dt;
    slider.lastPosition = previous;

    uniforms.uTime.value = time;
    uniforms.uMouse.value.set(pointer.u, pointer.v);
    uniforms.uScroll.value = slider.currentPosition;
    uniforms.uVelocity.value.set(pointer.x * 0.05, THREE.MathUtils.clamp(slider.velocity * 0.002, -0.12, 0.12));

    sculpture.rotation.y = time * 0.035 + pointer.x * 0.07 + slider.currentPosition * 0.45;
    sculpture.rotation.x = pointer.y * 0.04;
    sculpture.position.x += (pointer.x * 0.16 - sculpture.position.x) * 0.08;
    sculpture.position.y += (-slider.currentPosition * 0.45 - sculpture.position.y) * 0.08;
    sculpture.scale.setScalar(innerWidth < 700 ? 0.68 : 1);
    camera.position.x += (pointer.x * 0.18 - camera.position.x) * 0.08;
    camera.position.y += (-pointer.y * 0.12 - camera.position.y) * 0.08;
    camera.lookAt(0, -slider.currentPosition * 0.2, 0);

    bridge.update(time, pointer, slider);
    renderer.clear();
    renderer.render(scene, camera);
    bridge.render();

    if (reduceMotion) {
      cancelAnimationFrame(raf);
      bridge.update(0, pointer, slider);
      renderer.clear();
      renderer.render(scene, camera);
      bridge.render();
    }
  }

  function onVisibility() {
    if (!document.hidden) {
      lastTime = performance.now();
      setTargetScroll();
    }
  }

  document.addEventListener("visibilitychange", onVisibility);
  setTargetScroll();
  resize();
  animate(performance.now());
})();
