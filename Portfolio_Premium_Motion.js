(() => {
 if(window.__naomSignatureMotion)return;window.__naomSignatureMotion=true;
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 const fine=matchMedia("(hover:hover) and (pointer:fine)").matches;
 const hero=document.querySelector("#home,.hero");
 const progress=document.createElement("div");progress.id="premium-progress";progress.innerHTML="<span></span>";progress.setAttribute("aria-hidden","true");document.body.append(progress);
 const fill=progress.firstElementChild,nav=document.querySelector(".topbar,.top");
 let queued=false;
 const paint=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);fill.style.width=(Math.min(1,Math.max(0,scrollY/max))*100)+"%";nav?.classList.toggle("is-premium-scrolled",scrollY>28);queued=false};
 addEventListener("scroll",()=>{if(!queued){requestAnimationFrame(paint);queued=true}},{passive:true});addEventListener("resize",paint,{passive:true});paint();
 if(hero){[...hero.querySelectorAll(".availability,h1,.lead,.actions,.hero-note,.hero-aside,.eyebrow,.wrap>*")].filter((el,i,a)=>a.indexOf(el)===i).forEach((el,i)=>{el.classList.add("premium-hero-item");el.style.animationDelay=(Math.min(i,5)*85)+"ms"})}
 const reveal=[...document.querySelectorAll(".section-head,.about-grid > *, .value-card,.skill-card,.service-card,.project,.writing-card,.writing-highlight,.step,.contact-panel,.principle,.sample > .wrap,.paper,.sample-visual,.sample-art")];
 if(!reduce&&"IntersectionObserver"in window){reveal.forEach((el,i)=>{el.classList.add("premium-reveal");el.style.setProperty("--premium-delay",(i%3)*90+"ms")});const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("is-visible");io.unobserve(e.target)}}),{threshold:.07,rootMargin:"0px 0px -4% 0px"});reveal.forEach(el=>io.observe(el))}else reveal.forEach(el=>el.classList.add("is-visible"));
 if(fine&&!reduce){document.querySelectorAll(".project,.service-card,.writing-card,.skill-card,.value-card,.principle,.paper").forEach(card=>{card.classList.add("premium-tilt","premium-spotlight");let raf=0;card.addEventListener("pointermove",e=>{if(raf)return;raf=requestAnimationFrame(()=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.style.setProperty("--spot-x",(x*100)+"%");card.style.setProperty("--spot-y",(y*100)+"%");card.style.setProperty("--tilt-x",((.5-y)*2.4)+"deg");card.style.setProperty("--tilt-y",((x-.5)*3)+"deg");raf=0})},{passive:true});card.addEventListener("pointerleave",()=>{card.style.setProperty("--tilt-x","0deg");card.style.setProperty("--tilt-y","0deg")},{passive:true})})}
})();
