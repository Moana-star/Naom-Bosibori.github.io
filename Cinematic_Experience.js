(() => {
  if (window.__naomCinematicExperience) return;
  window.__naomCinematicExperience = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Remove legacy visual overlays and injected navigation that competed with the page.
  document.querySelectorAll(".immersive-world,.opening-scene,.opening-pointer-wake,#portfolio-webgl-stage,.scroll-progress,#portfolio-guide-launch,#portfolio-guide").forEach(el => el.remove());
  const hero = document.querySelector("#home");
  const main = document.querySelector("#main");
  if (!hero || !main) return;
  const stage = document.createElement("div");
  stage.className = "cinematic-stage is-static";
  stage.setAttribute("aria-hidden", "true");
  stage.innerHTML = '<canvas></canvas>';
  document.body.prepend(stage);
  const canvas = stage.querySelector("canvas");
  const nav = document.querySelector("#siteNav");
  const menu = document.querySelector("#menuBtn");
  const navLinks = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
  // Native anchors remain the source of truth; only close the mobile menu on selection.
  navLinks.forEach(link => link.addEventListener("click", () => {
    nav?.classList.remove("open");
    menu?.setAttribute("aria-expanded", "false");
  }));
  if (menu && nav) {
    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("open", open);
    });
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            if (link.hash === "#" + entry.target.id) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      });
    }, { rootMargin: "-25% 0px -60% 0px", threshold: 0 });
    navLinks.forEach(link => { const target = document.querySelector(link.hash); if (target) observer.observe(target); });
  }
  if (reduce) return;
  let THREE;
  import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js").then(T => {
    THREE = T;
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: innerWidth > 700, powerPreference: "low-power", stencil: false });
    } catch (error) {
      stage.classList.add("is-static");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1 : 1.5));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new T.Scene();
    scene.fog = new T.FogExp2(0x080b12, 0.028);
    const camera = new T.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 0, 12);
    const rig = new T.Group();
    rig.position.set(2.35, .1, -1.3);
    scene.add(rig);
    scene.add(new T.HemisphereLight(0xb9d7ed, 0x15131f, 1.6));
    const key = new T.PointLight(0xa8f4df, 34, 22); key.position.set(3, 4, 5); scene.add(key);
    const warm = new T.PointLight(0xf0a28d, 18, 18); warm.position.set(-4, -1, 1); scene.add(warm);
    const violet = new T.PointLight(0xb9a8f7, 20, 16); violet.position.set(1, -3, -4); scene.add(violet);
    const glass = new T.MeshPhysicalMaterial({ color: 0x9ce9da, metalness: .42, roughness: .18, transmission: .12, transparent: true, opacity: .88, clearcoat: 1, clearcoatRoughness: .12 });
    const chrome = new T.MeshStandardMaterial({ color: 0xd7e2ec, metalness: .88, roughness: .24 });
    const rose = new T.MeshStandardMaterial({ color: 0xe9a0a5, metalness: .66, roughness: .3, emissive: 0x2d111b, emissiveIntensity: .3 });
    const lilac = new T.MeshStandardMaterial({ color: 0xb9a8f7, metalness: .58, roughness: .25, emissive: 0x19102b, emissiveIntensity: .25 });
    const core = new T.Mesh(new T.IcosahedronGeometry(1.22, 3), glass);
    rig.add(core);
    const inner = new T.Mesh(new T.IcosahedronGeometry(.77, 1), new T.MeshStandardMaterial({ color: 0x182d39, metalness: .78, roughness: .22, wireframe: true }));
    rig.add(inner);
    const ringA = new T.Mesh(new T.TorusGeometry(1.82, .028, 10, 180), chrome);
    ringA.rotation.set(.55, .2, -.3); rig.add(ringA);
    const ringB = new T.Mesh(new T.TorusGeometry(2.15, .018, 8, 180), rose);
    ringB.rotation.set(1.12, .65, .24); rig.add(ringB);
    const ringC = new T.Mesh(new T.TorusGeometry(1.48, .024, 8, 140), lilac);
    ringC.rotation.set(.2, 1.2, .65); rig.add(ringC);
    const satelliteA = new T.Mesh(new T.DodecahedronGeometry(.32, 1), rose);
    const satelliteB = new T.Mesh(new T.OctahedronGeometry(.27, 1), lilac);
    const satelliteC = new T.Mesh(new T.TetrahedronGeometry(.24, 1), chrome);
    rig.add(satelliteA, satelliteB, satelliteC);
    const satellites = [
      { mesh: satelliteA, phase: 0, radius: 2.65, speed: .42, tilt: .7, base: .32 },
      { mesh: satelliteB, phase: 2.1, radius: 2.95, speed: -.31, tilt: 1.1, base: .27 },
      { mesh: satelliteC, phase: 4.2, radius: 2.38, speed: .52, tilt: -.55, base: .24 }
    ];
    // Fine, low-cost particles give the scene depth without a noisy starfield.
    const count = innerWidth < 700 ? 220 : 430;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - .5) * 24;
      positions[i * 3 + 1] = (Math.random() - .5) * 14;
      positions[i * 3 + 2] = -12 - Math.random() * 22;
    }
    const particleGeo = new T.BufferGeometry();
    particleGeo.setAttribute("position", new T.BufferAttribute(positions, 3));
    const particles = new T.Points(particleGeo, new T.PointsMaterial({ color: 0x9dcfc8, size: .018, transparent: true, opacity: .54, sizeAttenuation: true }));
    scene.add(particles);
    const scrollSections = [...document.querySelectorAll("#home,#about,#services,#projects,#writing,#contact")];
    let targetProgress = 0, progress = 0, mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
    let raf = 0, disposed = false, lastFrame = 0;
    const getProgress = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      return Math.max(0, Math.min(1, scrollY / max));
    };
    const updateScroll = () => { targetProgress = getProgress(); };
    const updatePointer = event => {
      if (event.pointerType === "touch") return;
      targetMouseX = (event.clientX / Math.max(1, innerWidth) - .5);
      targetMouseY = (event.clientY / Math.max(1, innerHeight) - .5);
    };
    addEventListener("scroll", updateScroll, { passive: true });
    addEventListener("resize", resize, { passive: true });
    addEventListener("pointermove", updatePointer, { passive: true });
    function resize() {
      if (!renderer) return;
      camera.aspect = innerWidth / Math.max(1, innerHeight);
      camera.fov = innerWidth < 700 ? 48 : 38;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight, false);
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1 : 1.5));
      rig.position.x = innerWidth < 700 ? 1.05 : 2.35;
      rig.scale.setScalar(innerWidth < 700 ? .72 : 1);
    }
    function animate(now) {
      raf = requestAnimationFrame(animate);
      if (document.hidden || now - lastFrame < (innerWidth < 700 ? 32 : 20)) return;
      lastFrame = now;
      const time = now * .001;
      progress += (targetProgress - progress) * .045;
      mouseX += (targetMouseX - mouseX) * .035;
      mouseY += (targetMouseY - mouseY) * .035;
      // Each object has its own scroll path; camera travel is deliberately restrained.
      const chapter = progress * Math.PI * 1.8;
      camera.position.x += ((mouseX * .34 + Math.sin(chapter) * .24) - camera.position.x) * .025;
      camera.position.y += ((mouseY * -.24 + Math.sin(progress * Math.PI * 2) * .16) - camera.position.y) * .025;
      camera.position.z += ((12 - progress * 1.15 + Math.sin(chapter * .7) * .12) - camera.position.z) * .025;
      camera.lookAt(.6 + Math.sin(chapter) * .12, 0, -1.4);
      rig.position.y = .1 + Math.sin(progress * Math.PI * 2) * .36;
      rig.position.z = -1.3 - progress * 1.25;
      rig.rotation.x += ((Math.sin(time * .19) * .12 + progress * .7) - rig.rotation.x) * .025;
      rig.rotation.y += ((time * .09 + progress * 1.05) - rig.rotation.y) * .025;
      rig.rotation.z = Math.sin(time * .16) * .08 + progress * .22;
      core.rotation.x = time * .12 + progress * 1.4;
      core.rotation.y = time * .18 - progress * 1.9;
      inner.rotation.x = -time * .11 + progress * 2.1;
      inner.rotation.y = time * .14 + progress * 1.6;
      ringA.rotation.x = .55 + progress * 1.9 + Math.sin(time * .13) * .08;
      ringA.rotation.y = .2 + progress * -.85;
      ringB.rotation.z = .24 + progress * 2.6;
      ringB.rotation.x = 1.12 - progress * 1.2;
      ringC.rotation.y = 1.2 + progress * -2.2;
      ringC.rotation.z = .65 + progress * 1.4;
      satellites.forEach((s, i) => {
        const a = time * s.speed + s.phase + progress * (i % 2 ? -3.4 : 4.2);
        s.mesh.position.set(Math.cos(a) * s.radius, Math.sin(a * .8 + s.tilt) * (s.radius * .52), Math.sin(a) * .7);
        s.mesh.rotation.set(time * (.2 + i * .1) + progress * (i + 1), time * (.15 + i * .07) - progress * 1.4, time * .11 + s.phase);
        s.mesh.scale.setScalar(s.base * (1 + .18 * Math.sin(a + progress * 5)));
      });
      particles.rotation.y = time * .008 + progress * .16;
      particles.rotation.x = Math.sin(progress * Math.PI) * .025;
      renderer.render(scene, camera);
    }
    resize();
    updateScroll();
    renderer.setAnimationLoop(null);
    raf = requestAnimationFrame(animate);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && !disposed) { cancelAnimationFrame(raf); raf = requestAnimationFrame(animate); } });
    addEventListener("pagehide", () => { disposed = true; cancelAnimationFrame(raf); renderer.dispose(); particleGeo.dispose(); particles.material.dispose(); }, { once: true });
    stage.classList.remove("is-static");
  }).catch(error => {
    console.warn("Cinematic scene unavailable; keeping the accessible static fallback.", error);
    stage.classList.add("is-static");
  });
  // Reveal once, softly; no content is hidden if observers or motion are unavailable.
  const reveal = [...document.querySelectorAll(".section-head,.about-grid > *, .service-card,.project,.writing-card,.writing-highlight,.contact-panel")];
  if (!reduce && "IntersectionObserver" in window) {
    reveal.forEach((el, i) => { el.classList.add("cinematic-reveal"); el.style.setProperty("--reveal-delay", (i % 4) * 70 + "ms"); });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("cinematic-in"); observer.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: "0px 0px -4% 0px" });
    reveal.forEach(el => observer.observe(el));
  }
})();