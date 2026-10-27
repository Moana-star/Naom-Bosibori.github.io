"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import Lenis from "lenis";
import { Github, Linkedin, Volume2, VolumeX } from "lucide-react";

const SOUND_KEY = "naom-portfolio-sfx";

export default function Experience({ content }: { content: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SOUND_KEY) === "on";
      setSoundEnabled(saved);
      soundEnabledRef.current = saved;
    } catch {
      setSoundEnabled(false);
      soundEnabledRef.current = false;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | null = null;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrame = 0;
    let observer: IntersectionObserver | null = null;
    let disposed = false;
    const canvas = canvasRef.current;

    if (!reducedMotion) {
      lenis = new Lenis({
        duration: 1.12,
        smoothWheel: true,
        wheelMultiplier: 0.86,
        touchMultiplier: 1,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
      const scrollFrame = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(scrollFrame);
      };
      raf = requestAnimationFrame(scrollFrame);
    }

    let removeSceneListeners = () => {};
    if (canvas && !reducedMotion) {
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: window.innerWidth > 720,
          powerPreference: "low-power",
          stencil: false,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1 : 1.35));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 80);
        camera.position.set(0, 0, 8.4);
        scene.add(new THREE.AmbientLight(0x9dbbff, 1.3));

        const blueLight = new THREE.PointLight(0x416dff, 24, 24);
        blueLight.position.set(-3, 2, 4);
        scene.add(blueLight);
        const iceLight = new THREE.PointLight(0x7cd8ff, 17, 18);
        iceLight.position.set(3, -2, 1);
        scene.add(iceLight);
        const violetLight = new THREE.PointLight(0x7770ff, 15, 20);
        violetLight.position.set(0, 3, -3);
        scene.add(violetLight);

        // A continuous two-sided ribbon. Its vertices update in place each frame,
        // avoiding per-frame geometry allocations.
        const segments = window.innerWidth < 720 ? 150 : 260;
        const positions = new Float32Array((segments + 1) * 2 * 3);
        const colors = new Float32Array((segments + 1) * 2 * 3);
        const indices: number[] = [];
        for (let i = 0; i < segments; i++) {
          const a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        const ribbonGeometry = new THREE.BufferGeometry();
        ribbonGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        ribbonGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        ribbonGeometry.setIndex(indices);
        const ribbonMaterial = new THREE.MeshPhysicalMaterial({
          vertexColors: true,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.86,
          metalness: 0.42,
          roughness: 0.22,
          clearcoat: 1,
          clearcoatRoughness: 0.16,
          emissive: new THREE.Color(0x07143d),
          emissiveIntensity: 0.42,
        });
        const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
        ribbon.position.z = 0.15;
        scene.add(ribbon);

        const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x456eff, transparent: true, opacity: 0.27 });
        const orbitA = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.006, 6, 200), orbitMaterial);
        orbitA.rotation.set(0.8, 0.25, -0.32);
        orbitA.position.z = -0.8;
        scene.add(orbitA);
        const orbitB = new THREE.Mesh(
          new THREE.TorusGeometry(1.58, 0.004, 6, 180),
          new THREE.MeshBasicMaterial({ color: 0x8eabff, transparent: true, opacity: 0.22 })
        );
        orbitB.rotation.set(1.2, -0.65, 0.4);
        orbitB.position.z = -1.15;
        scene.add(orbitB);

        const particleCount = window.innerWidth < 720 ? 260 : 620;
        const particlePositions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
          particlePositions[i * 3] = (Math.random() - 0.5) * 19;
          particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 11;
          particlePositions[i * 3 + 2] = -2 - Math.random() * 25;
        }
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
        const dust = new THREE.Points(
          particleGeometry,
          new THREE.PointsMaterial({ color: 0x91b4ff, size: 0.018, transparent: true, opacity: 0.54, sizeAttenuation: true })
        );
        scene.add(dust);

        const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
        const colorA = new THREE.Color(0x426bff);
        const colorB = new THREE.Color(0x8d80ff);
        const colorC = new THREE.Color(0x8bdcff);
        const tmpColor = new THREE.Color();

        const ribbonPoint = (t: number, time: number) => {
          const phase = time * 0.22;
          return {
            x:
              Math.sin(t + phase) * 1.68 +
              Math.sin(t * 2 - phase * 0.7) * 0.39 +
              Math.sin(t * 0.5 + phase) * pointer.x * 0.38,
            y:
              Math.cos(t + phase * 0.82) * 1.04 +
              Math.sin(t * 3 - phase) * 0.31 +
              Math.cos(t * 1.2 - phase) * pointer.y * 0.34,
            z: Math.sin(t * 2 + phase * 1.4) * 0.31 + Math.cos(t * 3 - phase) * 0.1,
          };
        };

        const onPointerMove = (event: PointerEvent) => {
          if (event.pointerType === "touch") return;
          pointer.tx = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
          pointer.ty = -(event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
        };
        const onResize = () => {
          if (!renderer) return;
          camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
          camera.fov = window.innerWidth < 720 ? 50 : 42;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight, false);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1 : 1.35));
        };
        const animate = (now: number) => {
          if (disposed || !renderer) return;
          animationFrame = requestAnimationFrame(animate);
          if (document.hidden) return;
          const time = now * 0.001;
          pointer.x += (pointer.tx - pointer.x) * 0.035;
          pointer.y += (pointer.ty - pointer.y) * 0.035;

          for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            const p = ribbonPoint(t, time);
            const next = ribbonPoint(t + 0.012, time);
            const dx = next.x - p.x;
            const dy = next.y - p.y;
            const length = Math.max(0.001, Math.hypot(dx, dy));
            const nx = -dy / length;
            const ny = dx / length;
            const cursorX = pointer.x * 1.5;
            const cursorY = pointer.y * 1.0;
            const distance = Math.hypot(p.x - cursorX, p.y - cursorY);
            const swell = Math.exp(-distance * distance * 0.7) * 0.11;
            const width = 0.075 + (0.5 + 0.5 * Math.sin(t * 4 + time * 0.7)) * 0.09 + swell;
            const left = i * 2 * 3;
            const right = (i * 2 + 1) * 3;
            positions[left] = p.x + nx * width;
            positions[left + 1] = p.y + ny * width;
            positions[left + 2] = p.z;
            positions[right] = p.x - nx * width;
            positions[right + 1] = p.y - ny * width;
            positions[right + 2] = p.z - 0.025;

            const blend = (Math.sin(t * 0.65 + time * 0.18) + 1) * 0.5;
            tmpColor.copy(colorA).lerp(colorB, blend);
            tmpColor.lerp(colorC, (Math.sin(t * 1.8 - time * 0.16) + 1) * 0.22);
            for (const offset of [left, right]) {
              colors[offset] = tmpColor.r;
              colors[offset + 1] = tmpColor.g;
              colors[offset + 2] = tmpColor.b;
            }
          }
          ribbonGeometry.attributes.position.needsUpdate = true;
          ribbonGeometry.attributes.color.needsUpdate = true;
          ribbonGeometry.computeVertexNormals();
          ribbon.rotation.y = pointer.x * 0.08;
          ribbon.rotation.x = pointer.y * 0.055;
          camera.position.x += (pointer.x * 0.13 - camera.position.x) * 0.02;
          camera.position.y += (pointer.y * 0.1 - camera.position.y) * 0.02;
          camera.lookAt(0, 0, 0);
          orbitA.rotation.z = -0.32 + time * 0.035;
          orbitB.rotation.y = -0.65 + Math.sin(time * 0.16) * 0.08;
          dust.rotation.y = time * 0.006;
          dust.rotation.x = Math.sin(time * 0.08) * 0.025;
          renderer.render(scene, camera);
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("resize", onResize, { passive: true });
        animationFrame = requestAnimationFrame(animate);
        removeSceneListeners = () => {
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("resize", onResize);
          cancelAnimationFrame(animationFrame);
          ribbonGeometry.dispose();
          ribbonMaterial.dispose();
          particleGeometry.dispose();
          orbitMaterial.dispose();
          renderer?.dispose();
        };
      } catch (error) {
        // The semantic portfolio remains usable if WebGL is unavailable.
        console.warn("WebGL scene unavailable; using the CSS ambient background.", error);
      }
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          }
        }),
        { threshold: 0.1, rootMargin: "0px 0px -4% 0px" }
      );
      document
        .querySelectorAll(".section-head, .project, .writing-card, .writing-highlight, .skill-card, .service-card, .principle, .value-card, .contact-panel")
        .forEach((element) => observer?.observe(element));
    }

    // Magnetic cards stay within a restrained radius and are disabled for touch/reduced motion.
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".project, .service-card, .writing-card, .skill-card, .value-card, .principle"));
    const moveCard = (event: Event) => {
      const pointerEvent = event as PointerEvent;
      const card = pointerEvent.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = (pointerEvent.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      const y = (pointerEvent.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 2.8}deg) rotateY(${x * 3.4}deg) translate3d(${x * 4}px, ${y * 4}px, 0)`;
    };
    const resetCard = (event: Event) => {
      (event.currentTarget as HTMLElement).style.transform = "";
    };
    if (finePointer && !reducedMotion) {
      cards.forEach((card) => {
        card.addEventListener("pointermove", moveCard);
        card.addEventListener("pointerleave", resetCard);
      });
    }

    // A restrained character scramble. Text is restored immediately after the short visual pass.
    const scramble = (element: HTMLElement) => {
      if (element.dataset.scrambling === "true" || element.children.length > 0) return;
      const original = element.textContent || "";
      if (original.trim().length < 4 || original.length > 100) return;
      element.dataset.scrambling = "true";
      const glyphs = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%";
      let frame = 0;
      const total = 7;
      const run = () => {
        frame++;
        const settled = Math.floor((frame / total) * original.length);
        element.textContent = original
          .split("")
          .map((char, index) => (char === " " || index < settled ? char : glyphs[Math.floor(Math.random() * glyphs.length)]))
          .join("");
        if (frame < total) window.setTimeout(run, 24);
        else {
          element.textContent = original;
          delete element.dataset.scrambling;
        }
      };
      run();
    };
    if (!reducedMotion) {
      document.querySelectorAll<HTMLElement>(".section-head h2, .project h3, .writing-card h3").forEach((element, index) => {
        if (index < 5) window.setTimeout(() => scramble(element), 180 + index * 110);
      });
      document.addEventListener("pointerover", onTextHover);
    }
    function onTextHover(event: Event) {
      const target = event.target as HTMLElement | null;
      const element = target?.closest<HTMLElement>(".project h3, .writing-card h3, .section-head h2, .nav a");
      if (element) scramble(element);
    }

    const onFormSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      if (form.id !== "enquiryForm") return;
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const service = String(data.get("service") || "").trim();
      const brief = String(data.get("brief") || "").trim();
      const feedback = document.querySelector<HTMLElement>("#enquiryFeedback");
      const subject = encodeURIComponent(`Portfolio enquiry — ${service || "Project discussion"}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nService: ${service}\n\nProject overview:\n${brief}`);
      if (feedback) feedback.textContent = "Opening your email app with the enquiry draft. Nothing is sent or stored by this website.";
      window.location.href = `mailto:naom6083@gmail.com?subject=${subject}&body=${body}`;
    };
    document.addEventListener("submit", onFormSubmit);

    const menuButton = document.querySelector<HTMLButtonElement>("#menuBtn");
    const nav = document.querySelector<HTMLElement>("#siteNav");
    const onMenuClick = () => {
      const open = menuButton?.getAttribute("aria-expanded") !== "true";
      menuButton?.setAttribute("aria-expanded", String(open));
      nav?.classList.toggle("open", open);
    };
    menuButton?.addEventListener("click", onMenuClick);

    const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("#siteNav a[href^='#']"));
    const onNavClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("#siteNav a")) {
        nav?.classList.remove("open");
        menuButton?.setAttribute("aria-expanded", "false");
      }
    };
    document.addEventListener("click", onNavClick);
    let activeSectionObserver: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && navLinks.length) {
      activeSectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            if (link.hash === "#" + entry.target.id) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-24% 0px -62% 0px" });
      navLinks.forEach((link) => {
        const section = document.querySelector(link.hash);
        if (section) activeSectionObserver?.observe(section);
      });
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(animationFrame);
      lenis?.destroy();
      observer?.disconnect();
      removeSceneListeners();
      cards.forEach((card) => {
        card.removeEventListener("pointermove", moveCard);
        card.removeEventListener("pointerleave", resetCard);
      });
      document.removeEventListener("pointerover", onTextHover);
      document.removeEventListener("submit", onFormSubmit);
      document.removeEventListener("click", onNavClick);
      menuButton?.removeEventListener("click", onMenuClick);
      activeSectionObserver?.disconnect();
      if (audioRef.current) {
        void audioRef.current.close().catch(() => {});
        audioRef.current = null;
      }
    };
  }, []);

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return null;
      audioRef.current = new AudioContextClass();
    }
    return audioRef.current;
  };

  const tone = (frequency: number, duration: number, delay = 0, volume = 0.012) => {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === "suspended") void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + delay);
    gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + delay + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + delay);
    oscillator.stop(context.currentTime + delay + duration + 0.02);
  };

  const playTick = () => {
    if (soundEnabledRef.current) tone(1750, 0.025, 0, 0.006);
  };

  const playConfirm = () => {
    if (soundEnabledRef.current) {
      tone(520, 0.1, 0, 0.009);
      tone(780, 0.13, 0.07, 0.007);
    }
  };

  const toggleSound = async () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      // Storage may be disabled; the control still works for this session.
    }
    if (next) {
      const context = getAudioContext();
      if (context?.state === "suspended") await context.resume();
      tone(620, 0.11, 0, 0.009);
      tone(880, 0.13, 0.08, 0.008);
    }
  };

  useEffect(() => {
    const onPointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const control = target?.closest("a, button");
      if (!control || control.contains(event.relatedTarget as Node | null)) return;
      playTick();
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, .project")) playConfirm();
    };
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("click", onClick);
    };
  });

  return (
    <>
      <motion.div
        className="webgl-stage fixed inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        aria-hidden="true"
      >
        <canvas ref={canvasRef} className="webgl-canvas" />
      </motion.div>
      <div className="ambient-grid" aria-hidden="true" />
      <div id="portfolio-content" dangerouslySetInnerHTML={{ __html: content }} />
      <a className="hud-email" href="mailto:naom6083@gmail.com">
        <span className="hud-label">OPEN CHANNEL</span>
        <span>naom6083@gmail.com <span aria-hidden="true">↗</span></span>
      </a>
      <div className="hud-social">
        <a href="https://github.com/Moana-star" target="_blank" rel="noreferrer" aria-label="GitHub profile">
          <Github size={15} strokeWidth={1.6} /> <span>GITHUB</span>
        </a>
        <a href="https://www.linkedin.com/in/naom-kenagwa-493107403/" target="_blank" rel="noreferrer" aria-label="LinkedIn profile">
          <Linkedin size={15} strokeWidth={1.6} /> <span>LINKEDIN</span>
        </a>
        <motion.button
          type="button"
          className={`sound-toggle ${soundEnabled ? "is-on" : ""}`}
          onClick={toggleSound}
          onPointerEnter={playTick}
          onClickCapture={playConfirm}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? "Mute interface sounds" : "Enable interface sounds"}
          title={soundEnabled ? "Mute interface sounds" : "Enable interface sounds"}
          whileTap={{ scale: 0.96 }}
        >
          <span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span className="sound-label">{soundEnabled ? "SOUND ON" : "SOUND OFF"}</span>
        </motion.button>
      </div>
      <span className="hud-coordinate" aria-hidden="true">NK / DIGITAL PRACTICE</span>
    </>
  );
}
