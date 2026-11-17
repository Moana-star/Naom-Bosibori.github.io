(() => {
  if (window.__naomSamplesMotion) return;
  window.__naomSamplesMotion = true;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const targets = [...document.querySelectorAll(".sample > .wrap, .sample .paper, .sample .sample-visual, .sample .sample-art")];
  if (reduce || !("IntersectionObserver" in window)) return;
  body.classList.add("motion-ready");
  targets.forEach((el, i) => {
    el.classList.add("sample-reveal");
    el.style.setProperty("--sample-delay", (i % 3) * 75 + "ms");
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    }
  }), { threshold: .08, rootMargin: "0px 0px -5% 0px" });
  targets.forEach(el => observer.observe(el));
  const bar = document.createElement("div");
  bar.className = "sample-motion-progress";
  bar.setAttribute("aria-hidden", "true");
  bar.innerHTML = "<span></span>";
  body.append(bar);
  const fill = bar.firstElementChild;
  let ticking = false;
  const update = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    fill.style.width = (Math.max(0, Math.min(1, scrollY / max)) * 100) + "%";
    ticking = false;
  };
  addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  addEventListener("resize", update, { passive: true });
  update();
})();
