/**
 * DOM_Bridge.js
 * Maps visible project-card rectangles into a screen-space WebGL scene.
 * HTML remains the accessible, crawlable source of all project content.
 */
export function createDOMBridge({ THREE, renderer }) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -window.innerWidth / 2, window.innerWidth / 2,
    window.innerHeight / 2, -window.innerHeight / 2,
    0.1, 50
  );
  camera.position.z = 10;

  const entries = [];
  const cardSelector = ".project";
  // Every project card is a visual work item, not only ExamPilot.
  // The DOM remains the accessible source of text and links.
  const cards = [...document.querySelectorAll(cardSelector)];

  const clamp = THREE.MathUtils.clamp;
  const vertexShader = `
    precision highp float;
    varying vec2 vUv;
    varying float vEdge;
    uniform float uTime;
    uniform float uHover;
    uniform vec2 uVelocity;

    void main() {
      vUv = uv;
      vec3 p = position;
      vec2 centered = uv * 2.0 - 1.0;
      float edge = dot(centered, centered);
      float speed = clamp(length(uVelocity) * 0.045, 0.0, 1.0);
      float bend = uHover * (0.035 + speed * 0.19);
      p.xy *= 1.0 + edge * bend;
      p.z += edge * uHover * (0.035 + speed * 0.22);
      p.z += sin((uv.x * 1.2 + uv.y) * 12.0 - uTime * 1.5) * speed * uHover * 0.035;
      vEdge = edge;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    varying float vEdge;
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform vec2 uVelocity;
    uniform float uTime;
    uniform float uScroll;
    uniform float uHover;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      vec2 uv = vUv;
      float speed = clamp(length(uVelocity) * 0.045, 0.0, 1.0);
      vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
      vec2 cursorDelta = (uv - uMouse) * aspect;
      float cursorDistance = length(cursorDelta);
      float cursorInfluence = exp(-cursorDistance * 5.5) * uHover;

      float scrollPhase = uScroll * 7.0;
      float n1 = noise(uv * 7.0 + vec2(uTime * 0.08, -scrollPhase));
      float n2 = noise(uv * 13.0 - vec2(uTime * 0.055, scrollPhase * 0.45));
      vec2 flow = vec2(n1 - 0.5, n2 - 0.5);
      vec2 warpedUv = uv + flow * (0.004 + speed * 0.026) * uHover;
      warpedUv += cursorDelta / max(cursorDistance, 0.0001) * cursorInfluence * 0.018;
      warpedUv += vec2(uVelocity.x, -uVelocity.y) * (0.0008 + speed * 0.012);

      // Chromatic aberration separates the RGB channels in opposite directions.
      // It scales with real motion velocity and eases away when movement settles.
      vec2 chromaAxis = normalize(vec2(uVelocity.x + 0.00001, -uVelocity.y + 0.00001));
      float chroma = (0.0012 + speed * 0.018 + cursorInfluence * 0.0035) * uHover;
      vec2 redUv = clamp(warpedUv + chromaAxis * chroma, vec2(0.001), vec2(0.999));
      vec2 greenUv = clamp(warpedUv, vec2(0.001), vec2(0.999));
      vec2 blueUv = clamp(warpedUv - chromaAxis * chroma, vec2(0.001), vec2(0.999));

      vec4 base = texture2D(uTexture, greenUv);
      vec3 splitColor = vec3(
        texture2D(uTexture, redUv).r,
        base.g,
        texture2D(uTexture, blueUv).b
      );

      float rim = 1.0 - smoothstep(0.0, 0.018, min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y)));
      float glint = cursorInfluence * 0.10 + rim * uHover * 0.045;
      vec3 color = splitColor + vec3(glint * 0.95, glint * 0.38, glint * 0.72);

      // Matte-core output is fully opaque; photographic image alpha cannot wash out the card.
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function createMatteFallbackTexture(card) {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 576;
    const ctx = canvas.getContext("2d", { alpha: false });
    const isExamPilot = /exampilot/i.test(card.innerText || card.textContent || "");
    const gradient = ctx.createLinearGradient(0, 0, 960, 576);
    gradient.addColorStop(0, "#40202f");
    gradient.addColorStop(0.52, "#241620");
    gradient.addColorStop(1, "#130f15");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(226, 165, 190, 0.22)";
    ctx.lineWidth = 1;
    for (let x = 24; x < 960; x += 36) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 576); ctx.stroke();
    }
    for (let y = 24; y < 576; y += 36) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke();
    }

    const glow = ctx.createRadialGradient(640, 265, 10, 640, 265, 370);
    glow.addColorStop(0, "rgba(217, 161, 182, 0.24)");
    glow.addColorStop(1, "rgba(217, 161, 182, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 960, 576);

    ctx.fillStyle = "#fff5ef";
    ctx.font = "700 48px Manrope, sans-serif";
    ctx.fillText(isExamPilot ? "EXAMPILOT" : "STUDENT LEARNING", 56, 94);
    ctx.fillStyle = "#e5a9bf";
    ctx.font = "500 19px monospace";
    ctx.fillText(isExamPilot ? "EVIDENCE-FIRST STUDY PRACTICE" : "LEARNING EXPERIENCE / INTERFACE", 58, 132);

    ctx.fillStyle = "rgba(15, 10, 15, 0.72)";
    ctx.fillRect(56, 176, 848, 332);
    ctx.strokeStyle = "rgba(229, 169, 191, 0.55)";
    ctx.strokeRect(56, 176, 848, 332);

    for (let i = 0; i < 7; i++) {
      const y = 216 + i * 35;
      ctx.fillStyle = i === 1 ? "rgba(229,169,191,.8)" : "rgba(247,240,233,.24)";
      ctx.fillRect(88, y, 290 + (i % 3) * 72, 5);
    }
    ctx.strokeStyle = "rgba(229,169,191,.55)";
    ctx.strokeRect(590, 214, 260, 232);
    ctx.fillStyle = "rgba(217,161,182,.18)";
    ctx.fillRect(606, 230, 228, 200);
    ctx.strokeStyle = "rgba(229,169,191,.48)";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(626, 256 + i * 34);
      ctx.lineTo(800 - (i % 2) * 32, 256 + i * 34);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  function createCardTexture(card) {
    const image = card.querySelector(".project-top img, img");
    if (!image) return createMatteFallbackTexture(card);

    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 576;
    const context = canvas.getContext("2d", { alpha: false });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const paint = () => {
      const iw = image.naturalWidth || image.width;
      const ih = image.naturalHeight || image.height;
      if (!iw || !ih) return;
      context.fillStyle = "#1a1118";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.max(canvas.width / iw, canvas.height / ih);
      const width = iw * scale;
      const height = ih * scale;
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      texture.needsUpdate = true;
    };

    if (image.complete && image.naturalWidth > 0) paint();
    else image.addEventListener("load", paint, { once: true });
    return texture;
  }

  cards.forEach(card => {
    const texture = createCardTexture(card);
    const uniforms = {
      uTexture: { value: texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uVelocity: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uHover: { value: 0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: false,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 20), material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 10;
    scene.add(mesh);

    const entry = { card, mesh, uniforms, texture, hover: 0, hoverTarget: 0, rect: null };
    entries.push(entry);

    card.addEventListener("pointerenter", () => {
      entry.hoverTarget = 1;
      window.NaomAudioEngine?.playSweep();
    }, { passive: true });
    card.addEventListener("pointerleave", () => {
      entry.hoverTarget = 0;
      card.style.removeProperty("--webgl-pointer-x");
      card.style.removeProperty("--webgl-pointer-y");
    }, { passive: true });
    card.addEventListener("pointermove", event => {
      const rect = card.getBoundingClientRect();
      uniforms.uMouse.value.set(
        clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1),
        1 - clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1)
      );
      card.style.setProperty("--webgl-pointer-x", `${(event.clientX - rect.left) / Math.max(rect.width, 1) * 100}%`);
      card.style.setProperty("--webgl-pointer-y", `${(event.clientY - rect.top) / Math.max(rect.height, 1) * 100}%`);
    }, { passive: true });
  });

  function update(time, pointer, slider) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollProgress = slider?.currentPosition || 0;
    const scrollVelocity = slider?.velocity || 0;
    const pointerVelocity = pointer?.velocity || { x: 0, y: 0 };

    for (const entry of entries) {
      // Fresh DOM bounds each frame ensure the WebGL plane tracks layout and scroll precisely.
      const rect = entry.card.getBoundingClientRect();
      entry.rect = rect;
      const visible = rect.width > 0 && rect.height > 0 &&
        rect.bottom > 0 && rect.right > 0 &&
        rect.top < viewportHeight && rect.left < viewportWidth;

      entry.mesh.visible = visible;
      if (!visible) continue;

      entry.mesh.position.set(
        rect.left + rect.width * 0.5 - viewportWidth * 0.5,
        viewportHeight * 0.5 - rect.top - rect.height * 0.5,
        0
      );
      entry.mesh.scale.set(rect.width, rect.height, 1);
      entry.uniforms.uResolution.value.set(rect.width, rect.height);
      entry.uniforms.uTime.value = time;
      entry.uniforms.uScroll.value = scrollProgress;
      entry.uniforms.uVelocity.value.set(
        clamp((pointerVelocity.x || 0) * 0.0006, -1.4, 1.4),
        clamp(scrollVelocity * 0.0018 + (pointerVelocity.y || 0) * 0.0006, -1.4, 1.4)
      );
      entry.hover += (entry.hoverTarget - entry.hover) * 0.085;
      entry.uniforms.uHover.value = entry.hover;
    }
  }

  function render() {
    renderer.clearDepth();
    renderer.render(scene, camera);
  }

  function resize(width = window.innerWidth, height = window.innerHeight) {
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    update(0, null, null);
  }

  function dispose() {
    for (const entry of entries) {
      scene.remove(entry.mesh);
      entry.mesh.geometry.dispose();
      entry.mesh.material.dispose();
      entry.texture.dispose();
    }
    entries.length = 0;
  }

  return { update, render, resize, dispose, count: entries.length };
}
