(() => {
 if (window.__naomImmersiveSite) return;
 window.__naomImmersiveSite = true;
 const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
 const main = document.querySelector("#main");
 const sections = [...document.querySelectorAll("#home, main .section, .footer")];
 if (!main || !sections.length) return;
 const rail = document.createElement("nav");
 rail.className = "immersive-rail";
 rail.setAttribute("aria-label", "Page chapters");
 const entries = sections.filter(s => s.id && s.id !== "footer").map((s,i) => {
   const label = ({home:"Start",about:"About",value:"Approach",services:"Services",projects:"Projects",writing:"Writing",contact:"Contact"})[s.id] || s.id;
   const a = document.createElement("a"); a.href = "#" + s.id; a.setAttribute("aria-label",label); a.innerHTML = '<span>'+label+'</span>';
   a.addEventListener("click", e => { const target=document.getElementById(s.id); if(target){e.preventDefault();target.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});history.replaceState(null,"","#"+s.id);} });
   rail.append(a);
   if(s.classList.contains("section")){const ix=document.createElement("div");ix.className="immersive-section-index";ix.innerHTML='<b>'+String(i).padStart(2,"0")+'</b> / FIELD NOTES';s.append(ix);}
   return {s,a};
 });
 document.body.append(rail);
 const progress=document.createElement("div");progress.className="immersive-page-progress";progress.setAttribute("aria-hidden","true");progress.innerHTML="<span></span>";document.body.append(progress);
 const fill=progress.firstElementChild;
 const setActive=id=>entries.forEach(({s,a})=>{if(s.id===id)a.setAttribute("aria-current","location");else a.removeAttribute("aria-current");});
 if("IntersectionObserver" in window){
   const observer=new IntersectionObserver(items=>items.forEach(item=>{if(item.isIntersecting)setActive(item.target.id);}),{rootMargin:"-38% 0px -48% 0px",threshold:0});
   entries.forEach(({s})=>observer.observe(s));
   if(!reduce){const reveal=[...document.querySelectorAll(".section-head,.about-grid > *, .value-card,.service-card,.project,.writing-card,.writing-highlight,.contact-panel,.principle")];reveal.forEach((el,i)=>{el.classList.add("reveal-on-scroll");if(i%4===1)el.classList.add("reveal-delay-2");if(i%4===2)el.classList.add("reveal-delay-3");if(i%4===3)el.classList.add("reveal-delay-4");});const rio=new IntersectionObserver(items=>items.forEach(item=>{if(item.isIntersecting){item.target.classList.add("is-visible");rio.unobserve(item.target);}}),{threshold:.06,rootMargin:"0px 0px -3% 0px"});reveal.forEach(el=>rio.observe(el));}
 } else {document.querySelectorAll(".reveal-on-scroll").forEach(el=>el.classList.add("is-visible"));}
 let queued=false;
 const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;fill.style.height=(max>0?Math.min(100,scrollY/max*100):0)+"%";queued=false;};
 addEventListener("scroll",()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});addEventListener("resize",update,{passive:true});update();
 // Give each chapter its own subtle ambient point of light, driven by pointer position.
 if(!reduce&&matchMedia("(hover:hover) and (pointer:fine)").matches){
  let pending=false,px=.5,py=.35;
  addEventListener("pointermove",e=>{px=e.clientX/innerWidth;py=e.clientY/innerHeight;if(!pending){pending=true;requestAnimationFrame(()=>{document.querySelectorAll(".section.is-in-view").forEach(s=>{s.style.setProperty("--spot-x",(px*100)+"%");s.style.setProperty("--spot-y",(py*100)+"%");});pending=false;});}},{passive:true});
 }
 document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{const id=a.getAttribute("href").slice(1),target=document.getElementById(id);if(target&&a.closest(".world-toplinks,.topbar")){e.preventDefault();target.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});history.replaceState(null,"","#"+id);}}));
})();