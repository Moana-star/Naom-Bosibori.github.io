(() => {
  if (window.__naomPortfolioGuide) return;
  window.__naomPortfolioGuide = true;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const launch = document.createElement("button");
  launch.id = "portfolio-guide-launch";
  launch.type = "button";
  launch.setAttribute("aria-expanded", "false");
  launch.setAttribute("aria-controls", "portfolio-guide");
  launch.innerHTML = '<span class="guide-orb" aria-hidden="true"></span><span>Explore my work</span><span aria-hidden="true">↗</span>';

  const panel = document.createElement("section");
  panel.id = "portfolio-guide";
  panel.setAttribute("aria-label", "Portfolio guide");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="guide-head">
      <div><p class="guide-kicker">Portfolio guide / 01</p><h2>What would you like to explore?</h2></div>
      <button id="portfolio-guide-close" type="button" aria-label="Close portfolio guide">×</button>
    </div>
    <p>Choose a direction or search for a topic. I’ll take you to the most relevant work and writing samples.</p>
    <label for="portfolio-guide-search" class="guide-kicker">Search this portfolio</label>
    <input id="portfolio-guide-search" type="search" placeholder="Try “technical SEO” or “Python”" autocomplete="off">
    <div class="guide-prompts" aria-label="Suggested topics">
      <button class="guide-prompt" type="button" data-destination="writing">Technical writing</button>
      <button class="guide-prompt" type="button" data-destination="services">SEO / GEO</button>
      <button class="guide-prompt" type="button" data-destination="projects">Software projects</button>
      <button class="guide-prompt" type="button" data-destination="contact">Discuss a project</button>
    </div>
    <div id="portfolio-guide-result" role="status" aria-live="polite">Independent samples, practical projects, and a clear view of my approach.</div>
  `;

  document.body.append(launch, panel);
  const closeButton = panel.querySelector("#portfolio-guide-close");
  const search = panel.querySelector("#portfolio-guide-search");
  const result = panel.querySelector("#portfolio-guide-result");
  let lastFocus = null;

  function openGuide() {
    lastFocus = document.activeElement;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    launch.setAttribute("aria-expanded", "true");
    search.focus();
  }
  function closeGuide() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    launch.setAttribute("aria-expanded", "false");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }
  function goTo(id, message) {
    const target = document.getElementById(id);
    if (!target) {
      result.textContent = "That section isn’t available on this page yet. Try Projects, Writing samples, or Contact.";
      return;
    }
    result.textContent = message;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (id === "projects") {
      const cards = [...document.querySelectorAll(".project")];
      cards.forEach(card => card.classList.remove("guide-match"));
      const first = cards.find(card => /exampilot|exam integrity|student/i.test(card.innerText || ""));
      if (first) first.classList.add("guide-match");
      window.setTimeout(() => first?.classList.remove("guide-match"), reduceMotion ? 0 : 1800);
    }
    if (window.innerWidth < 701) {
      const nav = document.getElementById("siteNav");
      const menu = document.getElementById("menuBtn");
      nav?.classList.remove("open");
      menu?.setAttribute("aria-expanded", "false");
    }
  }

  const topics = [
    { terms: /technical writing|developer docs|api|documentation|writing sample|writing/i, id: "writing", message: "Opening the writing samples: technical explanations, structured content, and independent examples." },
    { terms: /seo|geo|aeo|search|indexing|crawl|content strategy/i, id: "services", message: "Opening the SEO and content strategy section for technical SEO, AI search, and content work." },
    { terms: /software|python|flask|exampilot|project|web app|code|javascript|database/i, id: "projects", message: "Opening selected software projects and the work behind them." },
    { terms: /contact|hire|freelance|collaborat|email|work together/i, id: "contact", message: "Opening contact options so we can discuss the scope and next steps." },
    { terms: /about|background|computer science|student/i, id: "about", message: "Opening the background and working approach section." }
  ];
  function searchPortfolio() {
    const query = search.value.trim();
    if (!query) {
      result.textContent = "Try a topic such as technical writing, SEO, GEO, Python, ExamPilot, or contact.";
      return;
    }
    const match = topics.find(topic => topic.terms.test(query));
    if (match) {
      goTo(match.id, match.message);
      return;
    }
    const cards = [...document.querySelectorAll(".project, .writing-card, .writing-highlight, .service-card, .value-card")];
    const needle = query.toLowerCase();
    const found = cards.find(card => (card.innerText || card.textContent || "").toLowerCase().includes(needle));
    if (found) {
      result.textContent = "I found a close match in the portfolio and highlighted it below.";
      found.classList.add("guide-match");
      found.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      window.setTimeout(() => found.classList.remove("guide-match"), reduceMotion ? 0 : 1800);
    } else {
      result.textContent = "No exact match found for “" + query + "”. Try SEO, GEO, technical writing, Python, ExamPilot, or contact.";
    }
  }

  launch.addEventListener("click", () => panel.classList.contains("is-open") ? closeGuide() : openGuide());
  closeButton.addEventListener("click", closeGuide);
  panel.querySelectorAll("[data-destination]").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.destination;
    const messages = {
      writing: "Opening writing samples, including technical explanations and independent content examples.",
      services: "Opening SEO and content strategy, including technical SEO and AI-search-focused work.",
      projects: "Opening software and student-facing projects, with scope and status stated clearly.",
      contact: "Opening contact options for a remote freelance or contract conversation."
    };
    goTo(id, messages[id] || "Opening the selected section.");
  }));
  search.addEventListener("keydown", event => {
    if (event.key === "Enter") searchPortfolio();
  });
  search.addEventListener("search", searchPortfolio);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) closeGuide();
    if ((event.key === "/" || (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey))) &&
        !/input|textarea|select/i.test(document.activeElement?.tagName || "")) {
      event.preventDefault();
      if (!panel.classList.contains("is-open")) openGuide();
      else search.focus();
    }
  });

  // Give the pill navigation a restrained response to fast scroll movement.
  const topbar = document.querySelector(".topbar");
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let fastTimer = 0;
  window.addEventListener("scroll", () => {
    const now = performance.now();
    const elapsed = Math.max(12, now - lastTime);
    const speed = Math.abs(window.scrollY - lastY) / elapsed * 1000;
    lastY = window.scrollY;
    lastTime = now;
    if (topbar) {
      topbar.classList.toggle("is-scrolling-fast", speed > 850);
      window.clearTimeout(fastTimer);
      fastTimer = window.setTimeout(() => topbar.classList.remove("is-scrolling-fast"), 220);
    }
  }, { passive: true });
})();