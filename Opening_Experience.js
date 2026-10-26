(() => {
 if (window.__naomOpeningExperience) return;
 window.__naomOpeningExperience = true;
 const hero=document.querySelector("#home.hero");
 const topbar=document.querySelector(".topbar");
 if(!hero)return;
 const scene=document.createElement("div");
 scene.className="opening-scene";
 scene.setAttribute("aria-hidden","true");
 scene.innerHTML='<span class="scene-ring"></span><span class="scene-ring ring-b"></span><span class="scene-ring ring-c"></span><span class="scene-glow"></span><span class="scene-crosshair"></span><span class="scene-crosshair vertical"></span>';
 hero.prepend(scene);
 const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const fine=window.matchMedia("(hover:hover) and (pointer:fine)").matches;
 if(fine&&!reduce){
   const wake=document.createElement("span");wake.className="opening-pointer-wake";document.body.append(wake);
   let px=0,py=0,tx=0,ty=0,raf=0;
   window.addEventListener("pointermove",e=>{
     tx=e.clientX;ty=e.clientY;
     hero.style.setProperty("--scene-x",((e.clientX/innerWidth)-.5)*-18+"px");
     hero.style.setProperty("--scene-y",((e.clientY/innerHeight)-.5)*-14+"px");
     wake.classList.toggle("is-on",e.clientY<innerHeight);
     if(!raf)raf=requestAnimationFrame(function move(){px+=(tx-px)*.25;py+=(ty-py)*.25;wake.style.transform="translate("+px+"px,"+py+"px)";raf=0;if(Math.abs(tx-px)+Math.abs(ty-py)>1)raf=requestAnimationFrame(move);});
   },{passive:true});
   window.addEventListener("pointerleave",()=>wake.classList.remove("is-on"));
 }
 let previous=window.scrollY||0,lastTime=performance.now(),timer=0;
 window.addEventListener("scroll",()=>{
   const now=performance.now(),y=window.scrollY||0,velocity=Math.abs(y-previous)/Math.max(1,now-lastTime);
   previous=y;lastTime=now;
   if(topbar&&velocity>.35){topbar.classList.add("nav-in-motion");clearTimeout(timer);timer=setTimeout(()=>topbar.classList.remove("nav-in-motion"),260);}
 },{passive:true});
})();