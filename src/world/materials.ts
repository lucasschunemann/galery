import {
  Color,
  DoubleSide,
  FrontSide,
  BackSide,
  Matrix4,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Material,
  type Side,
  type Texture,
  type WebGLProgramParametersWithUniforms,
} from "three";

/* ============================================================
   Uniforms que todo mundo divide. O céu é um degradê na tela,
   e tudo que desce abaixo do piso se dissolve nele, então os
   materiais precisam saber a cor do céu em cada pixel.
   ============================================================ */

export const U = {
  uRes: { value: new Vector2(1, 1) },
  uTime: { value: 0 },
  uSkyTop: { value: new Color() },
  uSkyBot: { value: new Color() },
  uNight: { value: 0 },
  uReflectMap: { value: null as Texture | null },
  uReflectMatrix: { value: new Matrix4() },
  uReflect: { value: 0.2 },
  uEquirect: { value: null as Texture | null },
  uViewDir: { value: new Vector3(-1, -1, -1).normalize() },
};

const SKY_GLSL = /* glsl */ `
  uniform vec2 uRes;
  uniform vec3 uSkyTop;
  uniform vec3 uSkyBot;
  vec3 skyAt(float fy) { return mix(uSkyBot, uSkyTop, smoothstep(0.0, 1.0, fy)); }
`;

type Patch = (s: WebGLProgramParametersWithUniforms) => void;

function patch(mat: Material, key: string, fade: number, extra?: Patch) {
  mat.onBeforeCompile = (s) => {
    s.uniforms.uRes = U.uRes;
    s.uniforms.uSkyTop = U.uSkyTop;
    s.uniforms.uSkyBot = U.uSkyBot;
    s.uniforms.uFadeK = { value: fade };
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          vec4 wp = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            wp = instanceMatrix * wp;
          #endif
          vWPos = (modelMatrix * wp).xyz;
        }`,
      );
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vWPos;\nuniform float uFadeK;\n${SKY_GLSL}`)
      .replace(
        "#include <opaque_fragment>",
        `{
          float fade = (1.0 - smoothstep(-12.0, -0.8, vWPos.y)) * uFadeK;
          outgoingLight = mix(outgoingLight, skyAt(gl_FragCoord.y / uRes.y), fade);
        }
        #include <opaque_fragment>`,
      );
    extra?.(s);
  };
  mat.customProgramCacheKey = () => key;
}

/* ---------------- materiais com tema ---------------- */

interface Toned { mat: { color: Color }; day: Color; night: Color }
const toned: Toned[] = [];

function tone<T extends { color: Color }>(mat: T, day: string, night: string) {
  toned.push({ mat, day: new Color(day), night: new Color(night) });
  return mat;
}

export function applyTone(t: number) {
  for (const { mat, day, night } of toned) mat.color.lerpColors(day, night, t);
}

/*
 * O ambiente vai material por material, e não por scene.environment,
 * porque só assim cada um tem a sua intensidade: o cromo quer o céu
 * inteiro, a parede branca quer só um pouco dele.
 */
const withEnv: MeshStandardMaterial[] = [];
function lit<T extends MeshStandardMaterial>(m: T, k: number) {
  m.envMapIntensity = k;
  withEnv.push(m);
  return m;
}

export function setEnvironment(tex: Texture) {
  for (const m of withEnv) m.envMap = tex;
}

export function standard(color: string, opts: { rough?: number; metal?: number; fade?: number; side?: Side; env?: number } = {}) {
  const m = new MeshStandardMaterial({
    color,
    roughness: opts.rough ?? 0.6,
    metalness: opts.metal ?? 0,
    side: opts.side ?? FrontSide,
  });
  patch(m, "std", opts.fade ?? 1);
  return lit(m, opts.env ?? ((opts.metal ?? 0) > 0.5 ? 1.3 : 0.32));
}

export function gloss(color: string, opts: { rough?: number; side?: Side } = {}) {
  const m = new MeshPhysicalMaterial({
    color,
    roughness: opts.rough ?? 0.32,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    side: opts.side ?? FrontSide,
  });
  patch(m, "phys", 1);
  return lit(m, 0.75);
}

/** cromo com película de arco-íris, como a face de um CD */
export function iridescent(color = "#ffffff") {
  const m = new MeshPhysicalMaterial({
    color,
    metalness: 1,
    roughness: 0.14,
    iridescence: 1,
    iridescenceIOR: 1.7,
    iridescenceThicknessRange: [180, 820],
  });
  patch(m, "irid", 1);
  return lit(m, 1.5);
}

export function anodized(color: string, rough = 0.2) {
  return standard(color, { metal: 1, rough, env: 1.35 });
}

/* ---------------- o vidro ---------------- */

const GLASS_VERT = /* glsl */ `
  varying vec3 vN;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const GLASS_FRAG = /* glsl */ `
  uniform sampler2D uEquirect;
  uniform vec3 uViewDir;
  uniform vec3 uTint;
  uniform float uOpacity;
  varying vec3 vN;
  void main() {
    vec3 N = normalize(vN);
    if (!gl_FrontFacing) N = -N;
    vec3 I = normalize(uViewDir);
    vec3 R = reflect(I, N);
    vec2 uv = vec2(atan(R.z, R.x) * 0.15915494 + 0.5, asin(clamp(R.y, -1.0, 1.0)) * 0.31830989 + 0.5);
    vec3 env = texture2D(uEquirect, uv).rgb;
    float fr = pow(1.0 - abs(dot(N, -I)), 2.2);
    vec3 col = mix(uTint, env, 0.4 + 0.6 * fr);
    float a = mix(0.07, 0.92, fr);
    vec3 L = normalize(vec3(-0.45, 0.8, 0.4));
    float sp = pow(max(dot(N, normalize(L - I)), 0.0), 90.0);
    col += sp * 1.6;
    gl_FragColor = vec4(col, max(a, sp) * uOpacity);
  }
`;

export function glass(tint = "#dff3ff", opacity = 1, side: Side = FrontSide) {
  return new ShaderMaterial({
    uniforms: {
      uEquirect: U.uEquirect,
      uViewDir: U.uViewDir,
      uTint: { value: new Color(tint) },
      uOpacity: { value: opacity },
    },
    vertexShader: GLASS_VERT,
    fragmentShader: GLASS_FRAG,
    transparent: true,
    depthWrite: false,
    side,
  });
}

export const glassBack = (tint?: string) => glass(tint, 0.55, BackSide);

/* ---------------- o piso espelhado ---------------- */

function floorMaterial() {
  const m = lit(new MeshStandardMaterial({ color: "#fbfbfa", roughness: 0.4, metalness: 0 }), 0.28);
  patch(m, "floor", 0, (s) => {
    s.uniforms.uReflectMap = U.uReflectMap;
    s.uniforms.uReflectMatrix = U.uReflectMatrix;
    s.uniforms.uReflect = U.uReflect;
    s.uniforms.uTime = U.uTime;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nuniform mat4 uReflectMatrix;\nvarying vec4 vReflUv;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vReflUv = uReflectMatrix * (modelMatrix * vec4(transformed, 1.0));`,
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D uReflectMap;\nuniform float uReflect;\nvarying vec4 vReflUv;",
      )
      .replace(
        "#include <opaque_fragment>",
        `{
          // uma grade de lajotas, bem de leve, para o piso ter escala
          vec2 g = abs(fract(vWPos.xz / 2.5 + 0.5) - 0.5);
          float seam = 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
          outgoingLight *= 1.0 - seam * 0.06;
          vec4 refl = texture2DProj(uReflectMap, vReflUv);
          outgoingLight = mix(outgoingLight, refl.rgb, refl.a * uReflect);
        }
        #include <opaque_fragment>`,
      );
  });
  return m;
}

/* ---------------- a paleta compartilhada ---------------- */

function flat<T extends MeshStandardMaterial>(m: T) {
  m.flatShading = true;
  return m;
}

export const M = {
  white: tone(standard("#f4f3ef", { rough: 0.62 }), "#f4f3ef", "#a29cf0"),
  trunk: tone(flat(standard("#eeede9", { rough: 0.7 })), "#eeede9", "#5a52c4"),
  floor: tone(floorMaterial(), "#fbfbfa", "#6a63d8"),
  cloud: tone(standard("#ffffff", { rough: 1, fade: 0.42 }), "#ffffff", "#7a68d8"),
  porcelain: tone(gloss("#ffffff", { rough: 0.24 }), "#ffffff", "#ece8ff"),
  chrome: standard("#ffffff", { metal: 1, rough: 0.07, env: 1.5 }),
  chromeSoft: standard("#e9eef5", { metal: 1, rough: 0.2, env: 1.3 }),
  ink: standard("#0d0f1a", { rough: 0.3 }),
  glass: glass(),
  glassBack: glassBack(),
  shadow: new MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.22, depthWrite: false }),
};

export const DOUBLE = DoubleSide;
