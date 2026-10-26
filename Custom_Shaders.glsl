// VERTEX_SHADER
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
varying vec2 vUv;
void main(){vUv=uv;vec3 p=position;vec2 d=uv-uMouse;float r=length(d);p.z+=sin(r*24.0-uTime*2.0)*.035*exp(-r*5.0)*uHover;p.xy+=normalize(d+vec2(.00001))*.025*exp(-r*5.0)*uHover;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}
// FRAGMENT_SHADER
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uHover;
uniform sampler2D uTexture;
uniform float uUseTexture;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.0,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(13.1,7.7);a*=.5;}return v;}
void main(){vec2 uv=vUv;vec2 aspect=vec2(uResolution.x/max(uResolution.y,1.0),1.0);vec2 delta=(uv-uMouse)*aspect;float dist=length(delta);float influence=exp(-dist*5.5)*uHover;float n=fbm(uv*5.0+vec2(uTime*.08,-uTime*.05)+uScroll*.7);float n2=fbm(uv*11.0-vec2(uTime*.11,uTime*.07));vec2 flow=vec2(n-.5,n2-.5);vec2 direction=delta/max(dist,.0001);vec2 warped=uv+flow*.025*uHover+direction*(.035*influence+sin(dist*32.0-uTime*2.2)*.004*influence);float aberration=(.0025+.012*influence)*(0.5+0.5*n);vec4 base=vec4(.0);if(uUseTexture>.5){base.r=texture2D(uTexture,warped+vec2(aberration,0.)).r;base.g=texture2D(uTexture,warped).g;base.b=texture2D(uTexture,warped-vec2(aberration,0.)).b;base.a=texture2D(uTexture,warped).a;}float edge=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));float rim=1.-smoothstep(0.,.012,edge);float grid=max(1.-smoothstep(.0,.018,abs(fract(warped.x*26.)-.5)),1.-smoothstep(.0,.018,abs(fract(warped.y*18.)-.5)));float glow=exp(-dist*6.0)*(.16+.25*n);vec3 ink=mix(vec3(.20,.10,.16),vec3(.82,.43,.57),clamp(n*.85+influence*.4,0.,1.));vec3 rgb=mix(ink,base.rgb,base.a*uUseTexture);rgb+=vec3(.18,.05,.18)*aberration*35.;float alpha=max(base.a*uUseTexture,glow+rim*(.07+.16*uHover)+grid*(.018+.045*influence));gl_FragColor=vec4(rgb,alpha);}
