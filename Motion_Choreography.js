(() => {
  if (window.__naomMotionChoreography) return;
  window.__naomMotionChoreography = true;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const progress = document.createElement("div");
  progress.id = "motion-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = "<span></span>";
  document.body.append(progress);
  const bar = progress.firstElementChild;
  let ticking = false;
  const paintProgress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    bar.style.width = (Math.max(0, Math.min(1, scrollY / max)) * 100) + "%";
    ticking = false;
  };
  const onScroll = () => { if (!ticking) { requestAnimationFrame(paintProgress); ticking = true; } };
  addEventListener("scroll", onScroll, {passive:true});
  addEventListener("resize", onScroll, {passive:true});
  paintProgress();

  const chapters = [...document.querySelectorAll("main section, #home")];
  chapters.forEach(section => {
    section.classList.add("motion-chapter");
    const groups = section.matches("#home") ? [] : [...section.querySelectorAll(".section-head,.about-grid > *,.value-card,.skill-card,.service-card,.project,.writing-card,.writing-highlight,.step,.contact-panel")];
    groups.forEach((el,i) => {
      if (el.classList.contains("cinematic-reveal")) return;
      el.classList.add("motion-item");
      el.style.setProperty("--motion-delay", (i % 4) * 85 + "ms");
    });
  });
  if (!reduce && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("motion-entered");
        observer.unobserve(entry.target);
      }
    }), {threshold:.12,rootMargin:"0px 0px -7% 0px"});
    document.querySelectorAll(".motion-item,.motion-chapter").forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll(".motion-item,.motion-chapter").forEach(el => el.classList.add("motion-entered"));
  }
  const projects = document.querySelector("#projects");
  if (projects && matchMedia("(hover:hover) and (pointer:fine)").matches && !reduce) {
    projects.querySelectorAll(".project").forEach(card => {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (event.clientX - rect.left) + "px");
        card.style.setProperty("--my", (event.clientY - rect.top) + "px");
      }, {passive:true});
    });
  }
})();