(() => {
  if (window.__naomImmersiveSite) return;
  window.__naomImmersiveSite = true;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const main = document.querySelector("#main");
  if (!main) return;

  // Keep the single, visible site header as the only navigation.
  // Do not inject a second chapter rail or duplicate "FIELD NOTES" labels.
  const nav = document.querySelector("#siteNav");
  const navLinks = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
  const targets = navLinks.map(link => {
    const id = link.getAttribute("href").slice(1);
    return { link, section: document.getElementById(id) };
  }).filter(item => item.section);

  // Reveal the existing content once, without inserting repeated headings or copy.
  if (!reduce && "IntersectionObserver" in window) {
    const reveal = [...document.querySelectorAll(
      ".section-head, .about-grid > *, .value-card, .service-card, .project, .writing-card, .writing-highlight, .contact-panel, .principle"
    )];
    reveal.forEach((el, i) => {
      el.classList.add("reveal-on-scroll");
      if (i % 4 === 1) el.classList.add("reveal-delay-2");
      if (i % 4 === 2) el.classList.add("reveal-delay-3");
      if (i % 4 === 3) el.classList.add("reveal-delay-4");
    });
    const revealObserver = new IntersectionObserver(items => {
      items.forEach(item => {
        if (item.isIntersecting) {
          item.target.classList.add("is-visible");
          revealObserver.unobserve(item.target);
        }
      });
    }, { threshold: .06, rootMargin: "0px 0px -3% 0px" });
    reveal.forEach(el => revealObserver.observe(el));
  } else {
    document.querySelectorAll(".reveal-on-scroll").forEach(el => el.classList.add("is-visible"));
  }

  // The active state follows the real destination sections in the main navigation.
  if ("IntersectionObserver" in window && targets.length) {
    const navObserver = new IntersectionObserver(items => {
      const visible = items.filter(item => item.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      targets.forEach(({ link, section }) => {
        if (section === visible.target) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-22% 0px -60% 0px", threshold: [0, .12, .3, .55] });
    targets.forEach(({ section }) => navObserver.observe(section));
  }

  // Keep browser-native anchor navigation as the reliable fallback. JavaScript
  // must never cancel a valid in-page link; the sticky-header offset is CSS-driven.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    if (!id || !document.getElementById(id)) return;
    link.addEventListener("click", () => {
      if (window.innerWidth < 701 && nav?.contains(link)) {
        nav.classList.remove("open");
        const menu = document.getElementById("menuBtn");
        menu?.setAttribute("aria-expanded", "false");
        if (menu) menu.textContent = "Menu ☰";
      }
    });
  });

  // Progress is visual feedback, not another navigation element.
  const progress = document.createElement("div");
  progress.className = "immersive-page-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = "<span></span>";
  document.body.append(progress);
  const fill = progress.firstElementChild;
  let queued = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    fill.style.height = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
    queued = false;
  };
  addEventListener("scroll", () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  addEventListener("resize", update, { passive: true });
  update();
})();