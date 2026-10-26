(() => {
  if (window.__naomWorkGallery) return;
  window.__naomWorkGallery = true;
  const section = document.querySelector("#projects");
  const grid = section?.querySelector(".project-grid");
  if (!section || !grid) return;
  const cards = [...grid.querySelectorAll(".project")];
  if (!cards.length) return;

  const intro = document.createElement("div");
  intro.className = "work-gallery-intro";
  intro.innerHTML = '<p>Selected work / Explore each project</p><span class="gallery-count">A CLOSER LOOK — 0' + cards.length + '</span>';
  const filters = section.querySelector(".work-filters");
  (filters || grid).insertAdjacentElement("beforebegin", intro);

  cards.forEach((card, index) => {
    const visual = card.querySelector(".project-top");
    if (visual) {
      const art = document.createElement("div");
      art.className = "gallery-art";
      art.setAttribute("aria-hidden", "true");
      art.innerHTML = '<span class="art-orbit"></span><span class="art-orbit orbit-two"></span><span class="art-core"></span><span class="art-shard"></span>';
      visual.prepend(art);
      const number = document.createElement("span");
      number.className = "gallery-index";
      number.textContent = String(index + 1).padStart(2, "0") + " / " + String(cards.length).padStart(2, "0");
      visual.append(number);
    }
    card.dataset.galleryIndex = String(index);
  });

  const controls = document.createElement("nav");
  controls.className = "project-gallery-controls";
  controls.setAttribute("aria-label", "Project gallery navigation");
  controls.innerHTML = '<div class="gallery-pagination" aria-live="polite"><strong>01</strong><span class="gallery-track"><span></span></span><span class="gallery-total">0' + cards.length + '</span></div><div class="gallery-control-group"><button class="gallery-step" type="button" data-gallery-step="-1" aria-label="Previous project">← Previous</button><button class="gallery-step" type="button" data-gallery-step="1" aria-label="Next project">Next →</button></div>';
  grid.insertAdjacentElement("afterend", controls);
  const current = controls.querySelector(".gallery-pagination strong");
  const progress = controls.querySelector(".gallery-track span");
  const buttons = [...controls.querySelectorAll("[data-gallery-step]")];
  let active = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function visibleCards() { return cards.filter(card => !card.hidden); }
  function setActive(index) {
    const visible = visibleCards();
    if (!visible.length) return;
    const card = visible[(index + visible.length) % visible.length];
    active = Number(card.dataset.galleryIndex);
    cards.forEach(item => item.classList.toggle("is-gallery-active", item === card));
    current.textContent = String(visible.indexOf(card) + 1).padStart(2, "0");
    progress.style.width = ((visible.indexOf(card) + 1) / visible.length * 100) + "%";
    buttons[0].disabled = visible.length < 2;
    buttons[1].disabled = visible.length < 2;
  }
  function go(step) {
    const visible = visibleCards();
    if (!visible.length) return;
    const here = visible.findIndex(card => Number(card.dataset.galleryIndex) === active);
    const target = visible[(Math.max(0, here) + step + visible.length) % visible.length];
    setActive(Number(target.dataset.galleryIndex));
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }
  buttons.forEach(button => button.addEventListener("click", () => go(Number(button.dataset.galleryStep))));
  const filterGroup = section.querySelector(".work-filters");
  filterGroup?.addEventListener("click", () => {
    window.requestAnimationFrame(() => {
      const visible = visibleCards();
      if (!visible.some(card => Number(card.dataset.galleryIndex) === active)) {
        setActive(Number(visible[0]?.dataset.galleryIndex || 0));
      } else setActive(active);
    });
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const best = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (best) setActive(Number(best.target.dataset.galleryIndex));
    }, { threshold: [0.2, 0.4, 0.65], rootMargin: "-12% 0px -12% 0px" });
    cards.forEach(card => observer.observe(card));
  }
  document.addEventListener("keydown", event => {
    if (!section.matches(":hover") && !section.contains(document.activeElement)) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
    if (event.key === "ArrowDown" || event.key === "PageDown") { event.preventDefault(); go(1); }
    if (event.key === "ArrowUp" || event.key === "PageUp") { event.preventDefault(); go(-1); }
  });
  setActive(0);
})();