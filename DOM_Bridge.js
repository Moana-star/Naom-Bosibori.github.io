export function createDOMBridge({ THREE, renderer }) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-innerWidth / 2, innerWidth / 2, innerHeight / 2, -innerHeight / 2, 0.1, 20);
  camera.position.z = 10;
  const entries = [];
  const cards = [...document.querySelectorAll(".project")].filter(el => /exampilot|student learning platform/i.test(el.innerText));

  function makeFallbackTexture(element) {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 460;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 768, 460);
    gradient.addColorStop(0, "#38202c");
    gradient.addColorStop(.55, "#21151e");
    gradient.addColorStop(1, "#171117");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(217,161,182,.28)";
    ctx.lineWidth = 1;
    for (let x = 24; x < 768; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 460); ctx.stroke(); }
    for (let y = 20; y < 460; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(768, y); ctx.stroke(); }
    const glow = ctx.createRadialGradient(384, 230, 10, 384, 230, 330);
    glow.addColorStop(0, "rgba(217,161,182,.18)");
    glow.addColorStop(1, "rgba(217,161,182,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 768, 460);
    ctx.fillStyle = "#f7f0e9";
    ctx.font = "600 35px Manrope, sans-serif";
    ctx.fillText(/exampilot/i.test(element.innerText) ? "EXAMPILOT" : "STUDENT LEARNING", 42, 92);
    ctx.fillStyle = "#d9a1b6";
    ctx.font = "16px monospace";
    ctx.fillText("INTERACTIVE PROJECT / 2026", 44, 126);
    ctx.strokeStyle = "rgba(217,161,182,.65)";
    ctx.strokeRect(42, 160, 684, 246);
    ctx.strokeStyle = "rgba(217,161,182,.24)";
    for (let i = 0; i < 7; i++) {
      const y = 194 + i * 29;
      ctx.beginPath(); ctx.moveTo(68, y); ctx.lineTo(280 + (i % 3) * 78, y); ctx.stroke();
    }
    ctx.fillStyle = "rgba(217,161,182,.2)";
    ctx.fillRect(480, 184, 204, 174);
    ctx.strokeStyle = "rgba(217,161,182,.8)";
    ctx.strokeRect(480, 184, 204, 174);
    return new THREE.CanvasTexture(canvas);
  }

  function getTexture(element) {
    const image = element.querySelector(".project-top img, img");
    if (!image) return makeFallbackTexture(element);
    const canvas = document.createElement("canvas");
    canvas.width = 768; canvas.height = 460;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const iw = image.naturalWidth || image.width, ih = image.naturalHeight || image.height;
      if (!iw || !ih) return;
      const scale = Math.max(canvas.width / iw, canvas.height / ih);
      const w = iw * scale, h = ih * scale;
      ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      texture.needsUpdate = true;
    };
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    if (image.complete && image.naturalWidth) draw();
    else image.addEventListener("load", draw, { once: true });
    return texture;
  }

  const baseVertex = `varying vec2 vUv; uniform float uTime; uniform vec2 uVelocity; uniform float uHover; varying float vCurvature; void main(){vUv=uv;vec3 p=position;vec2 c=uv*2.0-1.0;float edge=dot(c,c);float speed=clamp(length(uVelocity)*8.0,0.0,1.0);p.xy*=1.0+edge*(0.035+speed*0.16)*uHover;p.z+=edge*(0.04+speed*0.28)*uHover;p.z+=sin((uv.x+uv.y)*18.0-uTime*2.0)*speed*0.025;vCurvature=edge;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
  const baseFragment = `precision highp float;uniform float uTime;uniform vec2 uResolution;uniform vec2 uMouse;uniform float uScroll;uniform vec2 uVelocity;uniform float uHover;uniform sampler2D uTexture;uniform float uUseTexture;varying vec2 vUv;varying float vCurvature;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}void main(){vec2 uv=vUv;vec2 aspect=vec2(uResolution.x/max(uResolution.y,1.),1.);vec2 delta=(uv-uMouse)*aspect;float r=length(delta);float influence=exp(-r*5.)*uHover;float n=noise(uv*8.+vec2(uTime*.08,-uScroll*2.));float speed=clamp(length(uVelocity)*5.,0.,1.);vec2 flow=vec2(n-.5,noise(uv*13.-uTime*.08)-.5);vec2 warped=uv+flow*(.02+speed*.035)*uHover+delta/max(r,.0001)*(.03*influence);vec2 v=uVelocity*(.05+speed*.08);vec2 uvR=warped+v+vec2(.002+influence*.009,0.);vec2 uvG=warped-v*.15;vec2 uvB=warped-v-vec2(.002+influence*.009,0.);vec4 tex=vec4(texture2D(uTexture,uvR).r,texture2D(uTexture,uvG).g,texture2D(uTexture,uvB).b,texture2D(uTexture,warped).a);float edge=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));float rim=1.-smoothstep(0.,.016,edge);float glow=exp(-r*6.)*(.15+.25*n);vec3 color=mix(vec3(.11,.045,.08),tex.rgb,tex.a);color+=vec3(.2,.04,.15)*influence;float alpha=max(tex.a,glow+rim*(.06+.17*uHover));gl_FragColor=vec4(color,alpha);}`;

  cards.forEach(element => {
    const texture = getTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const uniforms = {
      uTime: { value: 0 },
      uHover: { value: 0 },
      uMouse: { value: new THREE.Vector2(.5, .5) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uScroll: { value: 0 },
      uVelocity: { value: new THREE.Vector2(0, 0) },
      uTexture: { value: texture },
      uUseTexture: { value: 1 }
    };
    const material = new THREE.ShaderMaterial({
      uniforms, vertexShader: baseVertex, fragmentShader: baseFragment,
      transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    mesh.renderOrder = 20;
    scene.add(mesh);
    const entry = { element, mesh, uniforms, hover: 0, hoverTarget: 0 };
    entries.push(entry);
    element.addEventListener("pointerenter", () => {
      entry.hoverTarget = 1;
      window.NaomAudioEngine?.playSweep();
    });
    element.addEventListener("pointerleave", () => {
      entry.hoverTarget = 0;
      element.style.removeProperty("--webgl-pointer-x");
      element.style.removeProperty("--webgl-pointer-y");
    });
    element.addEventListener("pointermove", event => {
      const rect = element.getBoundingClientRect();
      uniforms.uMouse.value.set(
        THREE.MathUtils.clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
        1 - THREE.MathUtils.clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
      );
      element.style.setProperty("--webgl-pointer-x", ((event.clientX - rect.left) / Math.max(1, rect.width) * 100) + "%");
      element.style.setProperty("--webgl-pointer-y", ((event.clientY - rect.top) / Math.max(1, rect.height) * 100) + "%");
    }, { passive: true });
  });

  function update(time, pointer = { u: .5, v: .5 }, slider = { currentPosition: 0, velocity: 0 }) {
    entries.forEach(entry => {
      const rect = entry.element.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
      entry.mesh.visible = visible;
      if (visible) {
        entry.mesh.position.set(rect.left + rect.width / 2 - innerWidth / 2, innerHeight / 2 - rect.top - rect.height / 2, 0);
        entry.mesh.scale.set(rect.width, rect.height, 1);
        entry.uniforms.uResolution.value.set(rect.width, rect.height);
      }
      entry.uniforms.uTime.value = time;
      entry.uniforms.uScroll.value = slider.currentPosition || 0;
      entry.uniforms.uVelocity.value.set(pointer.x * .04 || 0, THREE.MathUtils.clamp((slider.velocity || 0) * .002, -.12, .12));
      entry.hover += (entry.hoverTarget - entry.hover) * .08;
      entry.uniforms.uHover.value = entry.hover;
    });
  }

  function render() { renderer.clearDepth(); renderer.render(scene, camera); }
  function resize(width, height) {
    camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    update(0);
  }
  return { update, render, resize };
}
