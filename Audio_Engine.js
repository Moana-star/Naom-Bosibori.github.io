const AudioEngine = (() => {
  let context = null;
  let master = null;
  let ambientGain = null;
  let ambientOscillators = [];
  let hoverGain = null;
  let sweepGain = null;
  let unlocked = false;
  let lastPointer = { x: 0, y: 0, time: 0 };
  let velocity = 0;
  let scrollVelocity = 0;
  let lastScrollY = window.scrollY;
  let lastScrollTime = performance.now();
  let lastHoverAt = 0;
  let sweepOscillators = [];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function makeNoiseBuffer(ctx, seconds = 0.22) {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.8;
    return buffer;
  }

  function createTone(ctx, frequency, type, duration, gainValue, destination, endFrequency = frequency) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), ctx.currentTime + Math.min(0.025, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.03);
    return { osc, gain };
  }

  function createNoiseClick(ctx) {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = makeNoiseBuffer(ctx, 0.045);
    filter.type = "highpass";
    filter.frequency.value = 3200;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.065, ctx.currentTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);
    source.connect(filter).connect(gain).connect(hoverGain);
    source.start();
  }

  function initialise() {
    if (context) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0.42;
    master.connect(context.destination);

    ambientGain = context.createGain();
    ambientGain.gain.value = 0.0001;
    ambientGain.connect(master);

    hoverGain = context.createGain();
    hoverGain.gain.value = 0.8;
    hoverGain.connect(master);

    sweepGain = context.createGain();
    sweepGain.gain.value = 0.8;
    sweepGain.connect(master);

    const low = context.createOscillator();
    const sub = context.createOscillator();
    const shimmer = context.createOscillator();
    const lowGain = context.createGain();
    const subGain = context.createGain();
    const shimmerGain = context.createGain();
    const lowFilter = context.createBiquadFilter();

    low.type = "sine";
    low.frequency.value = 48;
    sub.type = "triangle";
    sub.frequency.value = 72.4;
    shimmer.type = "sine";
    shimmer.frequency.value = 144.8;
    lowFilter.type = "lowpass";
    lowFilter.frequency.value = 180;
    lowFilter.Q.value = 0.7;
    lowGain.gain.value = 0.22;
    subGain.gain.value = 0.055;
    shimmerGain.gain.value = 0.012;

    low.connect(lowFilter).connect(lowGain).connect(ambientGain);
    sub.connect(subGain).connect(ambientGain);
    shimmer.connect(shimmerGain).connect(ambientGain);
    [low, sub, shimmer].forEach(osc => { osc.start(); ambientOscillators.push(osc); });

    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", soften, { passive: true });
    window.addEventListener("focus", restore, { passive: true });
    if (finePointer && !reducedMotion) startAmbient();
  }

  function unlock() {
    if (unlocked) return;
    initialise();
    if (!context) return;
    unlocked = true;
    context.resume().then(() => {
      const now = context.currentTime;
      ambientGain.gain.cancelScheduledValues(now);
      ambientGain.gain.setTargetAtTime(reducedMotion ? 0.008 : 0.035, now, 1.2);
      createTone(context, 440, "sine", 0.12, 0.012, master, 660);
    }).catch(() => { unlocked = false; });
  }

  function startAmbient() {
    if (!context || !unlocked || reducedMotion) return;
    ambientGain.gain.setTargetAtTime(0.035, context.currentTime, 1.5);
  }

  function soften() {
    if (context && ambientGain) ambientGain.gain.setTargetAtTime(0.0001, context.currentTime, 0.25);
  }

  function restore() {
    if (context && unlocked) startAmbient();
  }

  function onPointerMove(event) {
    const now = performance.now();
    const dt = Math.max(8, now - (lastPointer.time || now));
    const distance = Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y);
    velocity += (Math.min(2400, distance / dt * 1000) - velocity) * 0.18;
    lastPointer = { x: event.clientX, y: event.clientY, time: now };
    if (context && unlocked && sweepOscillators.length) {
      const pitch = 1 + Math.min(0.8, velocity / 3000);
      sweepOscillators.forEach(item => {
        try { item.frequency.setTargetAtTime(item.base * pitch, context.currentTime, 0.06); } catch {}
      });
    }
  }

  function onScroll() {
    const now = performance.now();
    const dt = Math.max(8, now - lastScrollTime);
    const nextY = window.scrollY;
    scrollVelocity += (Math.min(2200, Math.abs(nextY - lastScrollY) / dt * 1000) - scrollVelocity) * 0.22;
    lastScrollY = nextY;
    lastScrollTime = now;
    if (context && unlocked && ambientGain) {
      const amount = Math.min(0.075, 0.025 + scrollVelocity / 50000);
      ambientGain.gain.setTargetAtTime(amount, context.currentTime, 0.12);
      ambientOscillators.forEach((osc, i) => {
        const base = [48, 72.4, 144.8][i] || 48;
        osc.frequency.setTargetAtTime(base + Math.min(12, scrollVelocity / 180), context.currentTime, 0.08);
      });
    }
  }

  function onPointerOver(event) {
    const target = event.target instanceof Element ? event.target.closest("a,button,.project,.skill-card,.writing-card,.value-card,.principle") : null;
    if (!target || target.contains(event.relatedTarget)) return;
    const now = performance.now();
    if (now - lastHoverAt < 85) return;
    lastHoverAt = now;
    if (!unlocked) return;
    createNoiseClick(context);
    createTone(context, 1550 + Math.min(800, velocity * 0.2), "sine", 0.045, 0.018, hoverGain, 900);
  }

  function onPointerDown(event) {
    unlock();
    if (!context || !unlocked) return;
    const target = event.target instanceof Element ? event.target.closest(".project") : null;
    if (target) playSweep();
  }

  function playSweep() {
    if (!context || !unlocked || reducedMotion) return;
    sweepOscillators.forEach(item => { try { item.osc.stop(); } catch {} });
    sweepOscillators = [];
    const duration = 0.52;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(95 + Math.min(130, velocity * 0.05), now);
    osc.frequency.exponentialRampToValueAtTime(420 + Math.min(420, velocity * 0.12), now + duration * 0.65);
    osc.frequency.exponentialRampToValueAtTime(65, now + duration);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(360, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + duration * 0.6);
    filter.frequency.exponentialRampToValueAtTime(240, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(Math.min(0.065, 0.018 + velocity / 24000), now + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(filter).connect(gain).connect(sweepGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
    sweepOscillators = [{ osc, frequency: osc.frequency, base: 120 }];
  }

  document.addEventListener("pointerdown", unlock, { once: true, passive: true });
  document.addEventListener("keydown", unlock, { once: true });
  document.addEventListener("touchstart", unlock, { once: true, passive: true });

  return { unlock, playSweep, get unlocked() { return unlocked; } };
})();

window.NaomAudioEngine = AudioEngine;
