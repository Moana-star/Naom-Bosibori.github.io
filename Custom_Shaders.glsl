// VERTEX_SHADER
precision highp float;

attribute vec3 position;
attribute vec2 uv;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uTime;
uniform vec2 uVelocity;
uniform float uHover;
varying vec2 vUv;
varying float vCurvature;

void main() {
  vUv = uv;
  vec3 p = position;
  vec2 centered = uv * 2.0 - 1.0;
  float edge = dot(centered, centered);
  float speed = clamp(length(uVelocity) * 8.0, 0.0, 1.0);
  float barrel = edge * (0.035 + speed * 0.16) * uHover;
  p.xy *= 1.0 + barrel;
  p.z += edge * (0.04 + speed * 0.28) * uHover;
  p.z += sin((uv.x + uv.y) * 18.0 - uTime * 2.0) * speed * 0.025;
  vCurvature = edge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}

// FRAGMENT_SHADER
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uScroll;
uniform vec2 uVelocity;
uniform float uHover;
uniform sampler2D uTexture;
uniform float uUseTexture;
varying vec2 vUv;
varying float vCurvature;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(13.1, 7.7);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 delta = (uv - uMouse) * aspect;
  float distanceToPointer = length(delta);
  float influence = exp(-distanceToPointer * 5.0) * uHover;
  float speed = clamp(length(uVelocity) * 5.0, 0.0, 1.0);
  float n1 = fbm(uv * 5.0 + vec2(uTime * 0.08, -uScroll * 2.0));
  float n2 = fbm(uv * 11.0 - vec2(uTime * 0.11, uTime * 0.07));
  vec2 flow = vec2(n1 - 0.5, n2 - 0.5);
  vec2 radial = delta / max(distanceToPointer, 0.0001);
  vec2 warped = uv + flow * (0.025 + speed * 0.035) * uHover;
  warped += radial * (0.035 * influence + sin(distanceToPointer * 32.0 - uTime * 2.2) * 0.004 * influence);
  warped += uVelocity * (0.05 * speed);

  vec2 velocityVector = uVelocity * (0.05 + speed * 0.08);
  vec2 uvR = warped + velocityVector + vec2(0.002 + influence * 0.009, 0.0);
  vec2 uvG = warped - velocityVector * 0.15;
  vec2 uvB = warped - velocityVector - vec2(0.002 + influence * 0.009, 0.0);

  vec4 tex = vec4(0.0);
  if (uUseTexture > 0.5) {
    tex.r = texture2D(uTexture, uvR).r;
    tex.g = texture2D(uTexture, uvG).g;
    tex.b = texture2D(uTexture, uvB).b;
    tex.a = texture2D(uTexture, warped).a;
  }

  float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float rim = 1.0 - smoothstep(0.0, 0.016, edge);
  float grid = max(1.0 - smoothstep(0.0, 0.018, abs(fract(warped.x * 26.0) - 0.5)),
                   1.0 - smoothstep(0.0, 0.018, abs(fract(warped.y * 18.0) - 0.5)));
  float glow = exp(-distanceToPointer * 6.0) * (0.15 + 0.25 * n1);
  vec3 ink = mix(vec3(0.11, 0.045, 0.08), vec3(0.82, 0.43, 0.57),
                 clamp(n1 * 0.85 + influence * 0.45 + speed * 0.2, 0.0, 1.0));
  vec3 color = mix(ink, tex.rgb, tex.a * uUseTexture);
  float alpha = max(tex.a * uUseTexture, glow + rim * (0.06 + 0.17 * uHover) + grid * (0.015 + 0.04 * influence));
  gl_FragColor = vec4(color, alpha);
}
