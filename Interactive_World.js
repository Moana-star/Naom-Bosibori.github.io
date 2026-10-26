(() => {
 if(window.__naomInteractiveWorld)return;window.__naomInteractiveWorld=true;
 const hero=document.querySelector("#home.hero"),cards=[...document.querySelectorAll("#projects .project")];if(!hero||!cards.length)return;
 const projects=cards.map((c,i)=>({title:c.querySelector("h3")?.textContent.trim()||"Selected project",kind:c.querySelector(".project-kind")?.textContent.trim()||"Independent work",desc:c.querySelector(".project-body>p")?.textContent.trim()||"",links:[...c.querySelectorAll(".project-links a")].map(a=>({label:a.textContent.trim(),href:a.href})),i:i+1}));
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 const root=document.createElement("div");root.className="immersive-world";root.innerHTML=`
 <canvas aria-label="Interactive 3D portfolio environment" tabindex="0"></canvas><div class="world-scroll-features" aria-hidden="true"><i class="scroll-feature scroll-feature-a"><b></b><em></em></i><i class="scroll-feature scroll-feature-b"><b></b><em></em></i><i class="scroll-feature scroll-feature-c"><b></b><em></em></i></div><div class="world-transition" aria-hidden="true"></div><div class="world-cursor-trail" aria-hidden="true"></div><div class="world-fallback"><div><p class="world-screen-label">NAOM KENAGWA · SELECTED WORK</p><h2 class="world-screen-title">Ideas, built into experiences.</h2><p>Explore projects and writing through this interactive portfolio. This device is using a lightweight visual mode.</p></div></div>
 <div class="world-loader" role="status"><div class="world-loader-mark"></div><div class="world-loader-label">Building your world</div><div class="world-loader-progress"><span></span></div></div>
 
 <div class="world-kicker">Independent practice / 2026</div><div class="world-side-note">Research · Clarity · Useful technology</div>
 <section class="world-project-screen" aria-label="Featured project"><div class="world-screen-copy"><p class="world-screen-label">Selected work / <span>01</span></p><div class="world-screen-number">PROJECT 01 — 03</div><h2 class="world-screen-title">ExamPilot</h2><p class="world-screen-description"></p><div class="world-screen-actions"></div></div><div class="world-screen-art" aria-hidden="true"><div class="world-art-core"></div><span class="world-art-index">NAOM KENAGWA / WORK ARCHIVE</span></div></section>
 <div class="world-screen-arrows"><button type="button" data-step="-1" aria-label="Previous project">←</button><button type="button" data-step="1" aria-label="Next project">→</button></div>
 <div class="world-bottomline"><div class="world-environments" aria-label="Choose a 3D environment"><button type="button" data-world="canal" aria-pressed="true">01 / Amsterdam Canals</button><button type="button" data-world="venice" aria-pressed="false">02 / Venice Beach</button><button type="button" data-world="studio" aria-pressed="false">03 / After Hours</button></div><div class="world-bottom-caption"><strong>Space to change world</strong>Move / touch to explore</div></div>`;
 hero.classList.add("world-active");document.body.append(root);
 const screen=root.querySelector(".world-project-screen"),loader=root.querySelector(".world-loader"),canvas=root.querySelector("canvas"),fallback=root.querySelector(".world-fallback"),veil=root.querySelector(".world-transition"),trail=root.querySelector(".world-cursor-trail");let active=0;
 let scrollProgress=0,scrollTarget=0;
 // CSS feature motion is deliberately independent of WebGL so it still runs
 // when the external Three.js module is blocked or unsupported.
 const cssFeatures=[...root.querySelectorAll(".scroll-feature")];
 let cssMotionFrame=0;
 const updateCssFeatures=()=>{
   cssMotionFrame=0;
   const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
   const progress=Math.min(1,Math.max(0,window.scrollY/max));
   const time=performance.now()*.001;
   cssFeatures.forEach((el,i)=>{
     const phase=[0,2.1,4.2][i]||0;
     const drift=Math.sin(progress*Math.PI*2+phase);
     const x=[-1,1,0][i];
     const rx=progress*(i%2?210:-250)+Math.sin(time*.22+phase)*8;
     const ry=progress*(i%2?-280:240)+time*2+phase*30;
     const rz=progress*90+phase*24;
     const scale=.82+.22*(.5+.5*Math.sin(progress*Math.PI*2+phase));
     el.style.transform="translate3d("+(x*28+drift*18)+"px,"+(Math.cos(progress*Math.PI*2+phase)*18)+"px,0) rotateX("+rx+"deg) rotateY("+ry+"deg) rotateZ("+rz+"deg) scale("+scale+")";
   });
 };
 const queueCssFeatureMotion=()=>{if(!cssMotionFrame)cssMotionFrame=requestAnimationFrame(updateCssFeatures)};
 addEventListener("scroll",queueCssFeatureMotion,{passive:true});
 addEventListener("resize",queueCssFeatureMotion,{passive:true});
 updateCssFeatures();
 const updateScrollMotion=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);scrollTarget=Math.min(1,Math.max(0,scrollY/max));root.style.setProperty("--world-scroll-progress",scrollTarget.toFixed(4));const intro=window.scrollY<Math.max(120,hero.offsetHeight*.42);root.classList.toggle("world-intro",intro);document.body.classList.toggle("world-intro-active",intro)};
 addEventListener("scroll",updateScrollMotion,{passive:true});addEventListener("resize",updateScrollMotion,{passive:true});updateScrollMotion();
 function showProject(n){active=(n+projects.length)%projects.length;const p=projects[active];screen.classList.add("is-switching");setTimeout(()=>{screen.querySelector(".world-screen-label span").textContent=String(active+1).padStart(2,"0");screen.querySelector(".world-screen-number").textContent="PROJECT "+String(active+1).padStart(2,"0")+" — "+String(projects.length).padStart(2,"0");screen.querySelector(".world-screen-title").textContent=p.title;screen.querySelector(".world-screen-description").textContent=p.desc;const actions=screen.querySelector(".world-screen-actions");actions.replaceChildren();p.links.slice(0,2).forEach((l,i)=>{const a=document.createElement("a");a.href=l.href;a.textContent=i?"Source / details ↗":"Explore project ↗";if(/^https?:/.test(l.href)){a.target="_blank";a.rel="noopener noreferrer"}actions.append(a)});const more=document.createElement("button");more.type="button";more.textContent="All work ↓";more.onclick=()=>document.querySelector("#projects")?.scrollIntoView({behavior:reduce?"auto":"smooth"});actions.append(more);root.querySelector(".world-art-index").textContent=String(active+1).padStart(2,"0")+" / "+p.kind.toUpperCase();screen.classList.remove("is-switching")},reduce?0:150)}
 showProject(0);root.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>showProject(active+Number(b.dataset.step)));const worldNames=["canal","venice","studio"];let currentWorld=0;document.addEventListener("keydown",e=>{if(!hero.classList.contains("world-active")||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||""))return;if(e.code==="Space"&&!e.repeat){e.preventDefault();chooseWorld(worldNames[(currentWorld+1)%worldNames.length])}if(e.key==="ArrowRight")showProject(active+1);if(e.key==="ArrowLeft")showProject(active-1)});
 let renderer,scene,camera,group,clock,raf,resizeObs,worldAPI,disposed=false;const buttons=[...root.querySelectorAll("[data-world]")];function chooseWorld(name){currentWorld=Math.max(0,worldNames.indexOf(name));buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.world===name)));worldAPI?.change(name)}buttons.forEach(b=>b.onclick=()=>chooseWorld(b.dataset.world));
 const hideLoader=()=>setTimeout(()=>loader.classList.add("is-done"),reduce?100:1300);let fallbackTimer=setTimeout(()=>{if(!renderer){canvas.style.display="none";fallback.style.display="grid";hideLoader()}},6500);
 import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js").then(T=>{
 if(disposed)return;try{
 renderer=new T.WebGLRenderer({canvas,antialias:devicePixelRatio<2,alpha:true,powerPreference:"low-power"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(root.clientWidth,root.clientHeight,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 scene=new T.Scene();scene.fog=new T.FogExp2(0x101322,.026);camera=new T.PerspectiveCamera(42,root.clientWidth/root.clientHeight,.1,160);camera.position.set(0,3.2,12.8);clock=new T.Clock();
 scene.add(new T.HemisphereLight(0xbab9e8,0x17121d,2));const key=new T.DirectionalLight(0xffd9e6,3);key.position.set(3,8,7);scene.add(key);const rim=new T.PointLight(0x9d8bff,30,28);rim.position.set(-5,4,-4);scene.add(rim);const pink=new T.PointLight(0xf0a9d2,24,24);pink.position.set(5,3,-2);scene.add(pink);
 const ground=new T.Mesh(new T.PlaneGeometry(180,180),new T.MeshStandardMaterial({color:0x10111e,roughness:.9}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;scene.add(ground);
 const bezel=new T.Mesh(new T.BoxGeometry(7.5,4.2,.28),new T.MeshStandardMaterial({color:0x211d32,metalness:.7,roughness:.3,emissive:0x181329,emissiveIntensity:.5}));bezel.position.set(0,2.05,-1.4);scene.add(bezel);const face=new T.Mesh(new T.PlaneGeometry(7.22,3.92),new T.MeshBasicMaterial({color:0x171729}));face.position.set(0,2.05,-1.245);scene.add(face);const edge=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(7.56,4.26,.3)),new T.LineBasicMaterial({color:0xb88cae}));edge.position.copy(bezel.position);scene.add(edge);
 const baseMat=new T.MeshStandardMaterial({color:0x27233b,metalness:.6,roughness:.35});const stand=new T.Mesh(new T.CylinderGeometry(.09,.18,.8,12),baseMat);stand.position.set(0,-.35,-1.4);scene.add(stand);const foot=new T.Mesh(new T.BoxGeometry(2.2,.12,.9),baseMat);foot.position.set(0,-.72,-1.4);scene.add(foot);
 const starPos=new Float32Array(2400*3);for(let i=0;i<2400;i++){starPos[i*3]=(Math.random()-.5)*60;starPos[i*3+1]=Math.random()*20-1;starPos[i*3+2]=-Math.random()*50-4}const sg=new T.BufferGeometry();sg.setAttribute("position",new T.BufferAttribute(starPos,3));const stars=new T.Points(sg,new T.PointsMaterial({color:0xc9b8e9,size:.035,transparent:true,opacity:.8,depthWrite:false}));scene.add(stars);
 const motes=[];for(let i=0;i<18;i++){const m=new T.Mesh(new T.IcosahedronGeometry(.07+Math.random()*.16,1),new T.MeshStandardMaterial({color:i%2?0xd69cc7:0x8d8be1,emissive:i%2?0x4b1f48:0x222c68,emissiveIntensity:1.5,metalness:.4,roughness:.3}));m.position.set((Math.random()-.5)*18,Math.random()*6-.5,-Math.random()*14-1);m.userData.baseY=m.position.y;m.userData.phase=Math.random()*6.28;scene.add(m);motes.push(m)}
 group=new T.Group();scene.add(group);
 // Three independent 3D features stay in the scene while chapters change.
 // Their position, rotation and scale are driven by scroll progress, not timers.
 const featureRig=new T.Group();scene.add(featureRig);
 const featureMats=[
  new T.MeshBasicMaterial({color:0xa8f4ed,transparent:true,opacity:.78,wireframe:true,depthWrite:false}),
  new T.MeshBasicMaterial({color:0xd9a1b6,transparent:true,opacity:.72,wireframe:true,depthWrite:false}),
  new T.MeshBasicMaterial({color:0xb7a8f0,transparent:true,opacity:.7,wireframe:true,depthWrite:false})
 ];
 const featureSpecs=[
  {geo:new T.TorusKnotGeometry(1.05,.025,110,8,2,3),pos:[3.6,4.1,2.2],phase:0,scale:.82},
  {geo:new T.IcosahedronGeometry(.9,1),pos:[-3.35,2.2,2.8],phase:2.1,scale:.88},
  {geo:new T.TorusGeometry(.9,.035,10,84),pos:[2.9,.45,3.2],phase:4.2,scale:1.05}
 ];
 const scrollFeatures=featureSpecs.map((spec,i)=>{
  const holder=new T.Group();holder.position.set(...spec.pos);holder.scale.setScalar(spec.scale);featureRig.add(holder);
  const mesh=new T.Mesh(spec.geo,featureMats[i]);holder.add(mesh);
  const orbit=new T.Mesh(new T.TorusGeometry(1.25,.009,4,90),featureMats[(i+1)%featureMats.length]);orbit.rotation.set(.6+i*.38,.3+i*.52,.2+i*.27);holder.add(orbit);
  return {holder,mesh,orbit,base:spec.pos,phase:spec.phase,scale:spec.scale,baseRotation:[holder.rotation.x,holder.rotation.y,holder.rotation.z]};
 });
 const material=(c,r=.65,m=.08)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});function box(g,w,h,d,x,y,z,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o}
 function clear(g){while(g.children.length){const o=g.children.pop();o.parent=null;o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()}}
 function arch(g,x,y,z,w,h,d,c){const m=material(c);const sub=new T.Group();sub.position.set(x,y,z);g.add(sub);box(sub,w*.16,h*.6,d,-w*.42,h*.3,0,m);box(sub,w*.16,h*.6,d,w*.42,h*.3,0,m);box(sub,w,h*.15,d,0,h*.62,0,m);const curve=new T.Mesh(new T.TorusGeometry(w*.34,.065,8,28,Math.PI),m);curve.rotation.z=Math.PI;curve.position.set(0,h*.34,0);sub.add(curve)}
 function build(name){
  clear(group);
  const mat=(c,r=.7,m=.08)=>material(c,r,m);
  const lamp=(x,y,z,c=0xffc68e)=>{const p=new T.PointLight(c,.8,7);p.position.set(x,y,z);group.add(p)};
  const win=(x,y,z,w=.26,h=.42,lit=false)=>{box(group,w+.12,h+.12,.08,x,y,z,mat(0x343443,.35,.3));box(group,w,h,.035,x,y,z+.05,new T.MeshBasicMaterial({color:lit?0xffd8a4:0x526577}));if(lit)lamp(x,y,z+.2)};
  const gable=(x,y,z,w,d,c)=>{const sh=new T.Shape();sh.moveTo(-w/2,0);sh.lineTo(0,w*.38);sh.lineTo(w/2,0);sh.closePath();const m=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false}),mat(c,.8,.02));m.position.set(x,y,z-d/2);group.add(m)};
  if(name==="canal"){
   scene.fog=new T.FogExp2(0x111626,.022);
   const water=new T.Mesh(new T.PlaneGeometry(48,40,64,56),mat(0x183b4b,.18,.65));water.rotation.x=-Math.PI/2;water.position.set(0,-.13,-10);water.userData.water=true;group.add(water);
   for(const side of [-1,1]){
    box(group,2.4,.25,34,side*3.9,.02,-10,mat(0x514953,.9,.04));box(group,.2,.45,34,side*2.8,.12,-10,mat(0x9e8d89,.7,.12));
    for(let i=0;i<10;i++){const x=side*(5.05+(i%2)*.12),z=-1.7-i*3.15,h=3.15+(i%4)*.48,w=1.55+(i%3)*.12,c=[0x9a7569,0xc0a58c,0x747b86,0xb88f7d,0x88788a][i%5];
     box(group,w,h,1.65,x,h/2-.04,z,mat(c,.82,.02));gable(x,h-.02,z,w+.1,1.75,[0x383242,0x4a3940,0x302e3b][i%3]);box(group,w+.08,.1,1.75,x,h,z,mat(0x463941,.65,.14));
     for(let row=0;row<2;row++)for(let col=-1;col<=1;col++)win(x+col*.42,.78+row*.95,z+.86,.24,.4,(i+row+col)%7===0);
     box(group,.12,.36,.1,x,h*.6,z+.91,mat(0x3b3039,.4,.18));
    }
    for(let i=0;i<7;i++){const z=-.6-i*4.1,x=side*2.95;const pole=new T.Mesh(new T.CylinderGeometry(.025,.04,1.35,8),mat(0x292b36,.4,.55));pole.position.set(x,.8,z);group.add(pole);box(group,.18,.2,.18,x,1.52,z,mat(0x292631,.3,.4));const bulb=new T.Mesh(new T.SphereGeometry(.06,10,8),new T.MeshBasicMaterial({color:0xffd5a0}));bulb.position.set(x,1.52,z);group.add(bulb);lamp(x,1.52,z)}
   }
   box(group,6.1,.22,.85,0,.77,-5.1,mat(0x8e8589,.78,.14));const bridge=new T.Mesh(new T.TorusGeometry(2.35,.12,10,48,Math.PI),mat(0xb6a4a2,.78,.12));bridge.rotation.z=Math.PI;bridge.position.set(0,.72,-5.05);group.add(bridge);for(let i=0;i<13;i++)box(group,.065,.3,.1,-2.85+i*.475,1.02,-5.1,mat(0xbcb0ad,.7,.12));
   const boat=new T.Group();boat.position.set(-.65,.08,-8.8);boat.rotation.y=-.16;group.add(boat);const hull=new T.Mesh(new T.CapsuleGeometry(.34,.9,4,8),mat(0x332b36,.38,.45));hull.scale.set(1,.25,.55);hull.rotation.y=Math.PI/2;boat.add(hull);box(boat,.58,.28,.48,0,.19,0,mat(0x78604e,.7,.08));const mast=new T.Mesh(new T.CylinderGeometry(.02,.03,1.1,7),mat(0x3c3130,.4,.25));mast.position.set(-.12,.68,0);boat.add(mast);lamp(0,.5,-8.7);
   for(let i=0;i<30;i++){const r=new T.Mesh(new T.PlaneGeometry(.25+Math.random()*.7,.018),new T.MeshBasicMaterial({color:i%3?0x4b8491:0xc1a4b6,transparent:true,opacity:.22}));r.rotation.x=-Math.PI/2;r.position.set((Math.random()-.5)*5,-.1,-3-Math.random()*19);group.add(r)}
  } else if(name==="venice"){
   scene.fog=new T.FogExp2(0x263e4b,.017);
   const ocean=new T.Mesh(new T.PlaneGeometry(70,42,80,60),mat(0x1c6573,.16,.48));ocean.rotation.x=-Math.PI/2;ocean.position.set(0,-.16,-12);ocean.userData.water=true;group.add(ocean);box(group,60,.16,9,0,-.01,3.1,mat(0xd5b98e,.92,.01));box(group,60,.19,1.3,0,.13,-1.25,mat(0x876a59,.74,.08));
   for(let i=0;i<26;i++)box(group,.025,.012,8,-29+i*2.3,.078,3.1,mat(0xb59a78,.9,.02));
   for(let i=0;i<11;i++){const x=(i-5)*2.45,z=-4-(i%3)*1.1,w=1.7+(i%2)*.25,h=2.35+(i%4)*.35;box(group,w,h,1.65,x,h/2-.05,z,mat([0xd5a28e,0xe2c8a6,0x8fa7ac,0xc28f85][i%4],.82,.02));gable(x,h-.02,z,w+.1,1.7,[0x55434b,0x74605b,0x41444d][i%3]);for(let row=0;row<2;row++)for(let col=-1;col<=1;col++)win(x+col*.43,.7+row*.78,z+.85,.22,.32,(i+row+col)%8===0)}
   for(let i=0;i<9;i++){const x=-13+i*3.25,z=-.2-(i%2)*1.6;const trunk=new T.Mesh(new T.CylinderGeometry(.08,.16,3.2,9),mat(0x89664b,.9,.01));trunk.position.set(x,1.58,z);trunk.rotation.z=i%2?-.06:.07;group.add(trunk);for(let j=0;j<8;j++){const a=j*Math.PI/4,leaf=new T.Mesh(new T.ConeGeometry(.12,1.8,6),mat(i%3?0x3d7768:0x58856d,.8,.01));leaf.position.set(x+Math.cos(a)*.62,3.05+Math.sin(j*1.9)*.12,z+Math.sin(a)*.5);leaf.rotation.z=Math.cos(a)*.92;leaf.rotation.x=Math.sin(a)*.8;leaf.rotation.y=a;group.add(leaf)}}
   const sun=new T.Mesh(new T.SphereGeometry(1.05,32,24),new T.MeshBasicMaterial({color:0xffc18e}));sun.position.set(7,5.4,-22);group.add(sun);const halo=new T.Mesh(new T.SphereGeometry(1.6,24,16),new T.MeshBasicMaterial({color:0xe8a7a8,transparent:true,opacity:.15,depthWrite:false}));halo.position.copy(sun.position);group.add(halo);box(group,70,.12,1.2,0,.1,-21,mat(0x36535b,.8,.03));
   for(let i=0;i<24;i++){const wave=new T.Mesh(new T.PlaneGeometry(.7+Math.random()*1.4,.025),new T.MeshBasicMaterial({color:0xb7d7ce,transparent:true,opacity:.24}));wave.rotation.x=-Math.PI/2;wave.position.set((Math.random()-.5)*30,-.12,-4-Math.random()*19);group.add(wave)}
   box(group,.9,.7,.7,-7,.62,1.3,mat(0xe7d7bd,.65,.02));box(group,1.2,.13,.9,-7,1.02,1.3,mat(0x554c4b,.6,.04));for(let i=0;i<5;i++){const x=-5+i*2.4;const canopy=new T.Mesh(new T.ConeGeometry(.62,.32,12),mat(i%2?0xe7a5a1:0xf1d4a5,.7,.01));canopy.position.set(x,.7,4.2);group.add(canopy);const pole=new T.Mesh(new T.CylinderGeometry(.025,.025,.62,6),mat(0x6e5c50,.7,.02));pole.position.set(x,.39,4.2);group.add(pole)}
  } else {
   scene.fog=new T.FogExp2(0x0c0d1a,.019);const floor=new T.Mesh(new T.PlaneGeometry(55,40,32,24),mat(0x151321,.2,.62));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.12,-8);group.add(floor);
   for(let i=0;i<9;i++){const x=(i-4)*1.9,h=3.4+(i*7%5)*.72,z=-4-(i%3)*2.6;box(group,.9,h,.8,x,h/2-.1,z,mat(i%2?0x28243e:0x34314e,.35,.45));box(group,.92,.045,.84,x,h-.1,z,new T.MeshBasicMaterial({color:i%2?0xe5a8cf:0x9d9ce5}));for(let y=0;y<Math.floor(h/.65);y++)box(group,.55,.025,.035,x,.45+y*.65,z+.43,new T.MeshBasicMaterial({color:i%2?0x9d8fd0:0x6fa5b4}))}
   for(let i=0;i<4;i++){const ring=new T.Mesh(new T.TorusGeometry(2.2+i*.5,.035,8,100),new T.MeshBasicMaterial({color:[0xcaa3d2,0x8fd0ce,0x8e8be8,0xd4a0a9][i],transparent:true,opacity:.8}));ring.position.set(0,2.7,-7-i*.12);ring.rotation.x=.16+i*.11;ring.rotation.y=i*.18;group.add(ring)}for(let i=0;i<14;i++){const beam=new T.Mesh(new T.BoxGeometry(.018,5,.018),new T.MeshBasicMaterial({color:i%2?0x8fd0ce:0xd5a3d2,transparent:true,opacity:.3}));beam.position.set(-10+i*1.5,2.4,-4-(i%4)*2);group.add(beam)}
  }
 }
 build("canal");worldAPI={change:name=>{veil.classList.add("is-transitioning");setTimeout(()=>{build(name);camera.position.set(name==="venice"?1.2:0,name==="studio"?3:3.2,name==="studio"?12:12.8);scene.fog.color.set(name==="venice"?0x10202a:name==="studio"?0x080a12:0x101322);setTimeout(()=>veil.classList.remove("is-transitioning"),220)},300)}};const chapterWorlds={about:"canal",value:"venice",services:"studio",projects:"canal",writing:"venice",contact:"studio"};if("IntersectionObserver"in window){const chapterObserver=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;const next=chapterWorlds[visible.target.id];if(next&&worldNames.indexOf(next)!==currentWorld)chooseWorld(next)},{rootMargin:"-34% 0px -48% 0px",threshold:[0,.15,.35,.6]});Object.keys(chapterWorlds).forEach(id=>{const el=document.getElementById(id);if(el)chapterObserver.observe(el)})}let tx=0,ty=0,lastTrail=0;window.addEventListener("pointermove",e=>{if(matchMedia("(pointer:fine)").matches){tx=(e.clientX/innerWidth-.5)*.8;ty=(e.clientY/innerHeight-.5)*.35;if(!reduce&&performance.now()-lastTrail>38){lastTrail=performance.now();const dot=document.createElement("i");dot.style.left=e.clientX+"px";dot.style.top=e.clientY+"px";trail.append(dot);setTimeout(()=>dot.remove(),620)}}},{passive:true});window.addEventListener("blur",()=>{tx=0;ty=0});let touchStartX=0;screen.addEventListener("touchstart",e=>{touchStartX=e.changedTouches[0].clientX},{passive:true});screen.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-touchStartX;if(Math.abs(dx)>55)showProject(active+(dx<0?1:-1))},{passive:true});
 const resize=()=>{const w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5))};addEventListener("resize",resize,{passive:true});if("ResizeObserver"in window){resizeObs=new ResizeObserver(resize);resizeObs.observe(root)}
 let last=0;function animate(t){raf=requestAnimationFrame(animate);if(!renderer)return;if(!reduce&&t-last<30)return;last=t;const now=clock.getElapsedTime();scrollProgress+=(scrollTarget-scrollProgress)*(reduce?.2:.055);
  // Scroll is the timeline: the environment orbits, the camera travels, and foreground details drift with depth.
  const orbit=scrollProgress*Math.PI*1.35,rise=Math.sin(scrollProgress*Math.PI*2);
  // Camera travels through the chapters while the architecture remains stable.
  camera.position.x+=(tx+Math.sin(orbit)*.72-camera.position.x)*.035;
  camera.position.y+=(3.2+ty+Math.sin(scrollProgress*Math.PI)*.38-camera.position.y)*.035;
  camera.position.z+=(12.8-scrollProgress*1.25+Math.cos(orbit)*.18-camera.position.z)*.035;
  camera.lookAt(Math.sin(orbit)*.28+tx*.3,1.3+ty*.2+Math.sin(scrollProgress*Math.PI)*.14,-1.4);
  group.rotation.y+=(Math.sin(orbit)*.045+scrollProgress*.28-group.rotation.y)*.025;
  group.position.x+=(Math.sin(orbit)*.12-group.position.x)*.025;
  group.position.y+=(Math.sin(scrollProgress*Math.PI)*.045-group.position.y)*.025;
  // Every feature has its own scroll-synchronised rotation, depth and scale.
  root.querySelectorAll(".scroll-feature").forEach((el,i)=>{const phase=[0,2.1,4.2][i];const baseX=[-1,1,0][i];const drift=Math.sin(scrollProgress*Math.PI*2+phase);const rotX=scrollProgress*(i%2?210:-250)+Math.sin(now*.22+phase)*8;const rotY=scrollProgress*(i%2?-280:240)+now*2+phase*30;const scale=.82+.22*(.5+.5*Math.sin(scrollProgress*Math.PI*2+phase));el.style.transform="translate3d("+((baseX*28)+drift*18)+"px,"+((Math.cos(scrollProgress*Math.PI*2+phase)*18))+"px,0) rotateX("+rotX+"deg) rotateY("+rotY+"deg) rotateZ("+(scrollProgress*90+phase*24)+"deg) scale("+scale+")";});
  scrollFeatures.forEach((feature,i)=>{
   const p=scrollProgress*Math.PI*2+feature.phase;
   feature.holder.position.x=feature.base[0]+Math.sin(p)*.52;
   feature.holder.position.y=feature.base[1]+Math.cos(p*.72)*.42;
   feature.holder.position.z=feature.base[2]+Math.sin(p*.5)*.65;
   feature.holder.rotation.x=feature.baseRotation[0]+scrollProgress*(i%2?3.8:-4.6)+Math.sin(p)*.18;
   feature.holder.rotation.y=feature.baseRotation[1]+scrollProgress*(i%2?-5.1:4.4);
   feature.holder.rotation.z=feature.baseRotation[2]+Math.sin(p*.6)*.3+scrollProgress*(i-1)*1.6;
   const scale=feature.scale*(.82+.24*(.5+.5*Math.sin(p)));
   feature.holder.scale.setScalar(scale);
   feature.orbit.rotation.x=.6+i*.38+scrollProgress*(i%2?2.2:-1.8);
   feature.orbit.rotation.y=.3+i*.52+scrollProgress*(i%2?-2.6:2.1);
   feature.mesh.rotation.y=scrollProgress*(i%2?5.5:-4.8)+now*.025;
  });
  stars.rotation.y=now*.004+scrollProgress*.22;
  motes.forEach((m,i)=>{m.rotation.y=now*.14+m.userData.phase+scrollProgress*(i%2?1.5:-1.2);m.position.y=m.userData.baseY+Math.sin(now*.7+m.userData.phase)*.12;m.position.x+=(Math.sin(orbit+m.userData.phase)*.04-m.position.x*.002)*.012});
  group.children.forEach((o,i)=>{if(o.userData.float){o.rotation.x=now*.16+o.userData.phase+scrollProgress*.7;o.rotation.y=now*.21+o.userData.phase+scrollProgress*1.1;o.position.y+=Math.sin(now*.8+o.userData.phase)*.0015}if(o.userData.water){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin(x*.7+now*1.3+scrollProgress*4)*.035+Math.cos(y*.8+now+scrollProgress*3)*.03)}p.needsUpdate=true;o.geometry.computeVertexNormals()}});
  root.style.setProperty("--world-camera-orbit",orbit.toFixed(4));renderer.render(scene,camera)}animate(0);clearTimeout(fallbackTimer);hideLoader()
 }catch(e){console.warn("WebGL fallback",e);canvas.style.display="none";fallback.style.display="grid";hideLoader()}
 }).catch(e=>{console.warn("Three.js unavailable",e);clearTimeout(fallbackTimer);canvas.style.display="none";fallback.style.display="grid";hideLoader()});
 addEventListener("pagehide",()=>{disposed=true;cancelAnimationFrame(raf);resizeObs?.disconnect();renderer?.dispose()},{once:true});
})();