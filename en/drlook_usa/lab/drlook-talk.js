/* =====================================================================
   DR. LOOK — talking portrait
   A close-up, animated bust of Dr. Look in its own small 3D view:
   blinks, follows the pointer with his eyes, changes expression and
   moves his mouth while a line of text is "spoken".

   No AI or audio is wired in yet. To connect an LLM later, replace
   ANSWERS / the chip handler in the page with a call to your backend
   and pass the reply to talk.say(text, mood).
   ===================================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ---- look: edit these numbers to retune him without touching the model ---- */
export const TALK_TUNE = {
  skinWarmth: [1.0, 0.985, 0.975],   // multiplies the painted colours (lower green/blue = more orange)
  softness: 0.10,                    // how much the skin glows from within (0 = hard plastic)
  exposure: 0.92,
  keyLight: 1.45, fillLight: 0.5, rimLight: 1.1, envLight: 0.4,
  fov: 22, distance: 4.15, lookAtY: 0.2,   // camera framing of the bust
  lensGlare: 0.2,                   // strength of the sheen on his glasses (0 = no glass)
  lidRest: 0.1,                      // how far the upper lids sit over the eyes at rest (0 = wide open)
  blinkEvery: [2.2, 5.5],            // seconds between blinks (min, max)
  charsPerSecond: 13,                // speaking speed when there is no audio to follow
};

/* ---- expressions: weights for the face shapes stored in the model ---- */
export const MOODS = {
  neutral: {},
  happy:   { smile: .55, upperLipUp: .15, browUp: .15, squint: .25 },
  smile:   { jawOpen: .5, smile: 1.25, upperLipUp: 1.0, stretch: .3, browUp: .2, blink: .28 },
  laugh:   { jawOpen: 1.45, smile: 1.1, upperLipUp: .9, lowerLipDown: .6, browUp: .6, squint: .3 },
  shock:   { jawOpen: .5, pucker: 1.0, upperLipUp: .4, browUp: 1.0, teethHide: 1 },
  grimace: { jawOpen: .45, stretch: 1.0, upperLipUp: .8, lowerLipDown: 1.0, frown: .5, browInnerUp: .8 },
  angry:   { jawOpen: .1, frown: .8, stretch: .4, browDown: 1.0 },
  think:   { pucker: .35, frown: .2, browUp_L: .9, browDown: .25, lookX: .5, lookY: .35 },
};

/* ---- mouth shapes for speech (blended on top of the current mood) ---- */
const VISEMES = {
  rest: {},
  AA:  { jawOpen: .75, upperLipUp: .25 },
  E:   { jawOpen: .32, stretch: .55, upperLipUp: .35 },
  I:   { jawOpen: .2, smile: .45, stretch: .3, upperLipUp: .3 },
  O:   { jawOpen: .5, pucker: .85, upperLipUp: .2, teethHide: 1 },
  U:   { jawOpen: .22, pucker: 1.0, teethHide: 1 },
  MBP: { jawOpen: 0, pucker: .12 },
  FV:  { jawOpen: .1, upperLipUp: .65, lowerLipDown: -.2 },
  L:   { jawOpen: .34, upperLipUp: .3 },
  S:   { jawOpen: .12, stretch: .45, upperLipUp: .4 },
  W:   { jawOpen: .15, pucker: .9, teethHide: 1 },
  C:   { jawOpen: .2, upperLipUp: .15 },
};
const CHAR_VISEME = { a: 'AA', e: 'E', i: 'I', o: 'O', u: 'U', y: 'I', m: 'MBP', b: 'MBP', p: 'MBP', f: 'FV', v: 'FV', l: 'L', t: 'L', d: 'L', n: 'L',
  s: 'S', z: 'S', c: 'S', x: 'S', j: 'S', w: 'W', q: 'W', r: 'W' };
const MOUTH_KEYS = ['jawOpen', 'smile', 'pucker', 'stretch', 'frown', 'upperLipUp', 'lowerLipDown', 'teethHide'];

/** Turn a sentence into timed mouth shapes: [{t, v}] with t in seconds. */
export function visemesFromText(text, cps = TALK_TUNE.charsPerSecond) {
  const out = []; let t = 0;
  for (const ch of text.toLowerCase()) {
    if (/[a-z]/.test(ch)) { out.push({ t, v: CHAR_VISEME[ch] || 'C' }); t += 1 / cps; }
    else if (/[.,!?;:…]/.test(ch)) { out.push({ t, v: 'rest' }); t += (ch === ',' ? 2.5 : 5) / cps; }
    else { out.push({ t, v: 'rest' }); t += .6 / cps; }
  }
  out.push({ t, v: 'rest' });
  return out;
}

export function createTalk({ canvas, loader, url }) {
  const T = TALK_TUNE;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = T.exposure;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = T.envLight;
  const camera = new THREE.PerspectiveCamera(T.fov, 1, .1, 30);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d8ea, T.fillLight));
  const key = new THREE.DirectionalLight(0xfff4ea, T.keyLight); key.position.set(-1.6, 2.2, 3.2); scene.add(key);
  const rimL = new THREE.DirectionalLight(0x9fe9ff, T.rimLight); rimL.position.set(2.4, 1.2, -2.2); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xff9ecb, T.rimLight * .6); rimR.position.set(-2.6, .6, -2.0); scene.add(rimR);

  const rig = { root: new THREE.Group(), morphs: [], dict: null, eyes: [], lidsUp: [], lidsLo: [], teeth: null, lenses: [] };
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const g2 = gc.getContext('2d');
  g2.fillStyle = '#000'; g2.fillRect(0, 0, 256, 256); g2.translate(128, 128); g2.rotate(-.55); g2.translate(-128, -128);
  for (const [x, w, a] of [[96, 34, .9], [150, 11, .6]]) {            // two soft diagonal streaks, repeated across the lens
    const gr = g2.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = gr; g2.fillRect(x - w, -200, 2 * w, 700);
  }
  const glare = new THREE.CanvasTexture(gc); glare.colorSpace = THREE.SRGBColorSpace; glare.wrapS = glare.wrapT = THREE.RepeatWrapping; glare.repeat.set(1, 1);
  scene.add(rig.root);
  const cur = {}, mood = { ...MOODS.neutral }, vis = {};          // current, target expression, target viseme
  const st = { open: false, ready: false, loading: null, t: 0, nextBlink: 2, blink: 0, blinkT: -1, lookX: 0, lookY: 0, px: 0, py: 0,
    sacT: 0, sacX: 0, sacY: 0, speaking: null, speakT: 0, onWord: null, raf: 0, last: 0 };

  function load() {
    if (st.loading) return st.loading;
    st.loading = new Promise((res, rej) => loader.load(url, g => {
      const m = g.scene; rig.root.add(m);
      m.traverse(o => {
        if (o.isMesh && o.morphTargetDictionary) { rig.morphs.push(o); rig.dict = o.morphTargetDictionary; }
        if (o.isMesh && o.morphTargetDictionary && o.material) o.material.side = THREE.DoubleSide;        // lips and mouth lining are seen from both sides
        if (o.isMesh && o.material && o.material.map) {                       // painted head: warm it and let it glow a little
          const mt = o.material; mt.color.setRGB(...T.skinWarmth); mt.emissive = new THREE.Color(1, 1, 1); mt.emissiveMap = mt.map; mt.emissiveIntensity = T.softness; mt.envMapIntensity = .8;
        }
        const n = o.name;
        if (/^lens_[LR]/.test(n) && o.isMesh) {                               // glass: a faint sheen that slides as he turns his head
          o.material = new THREE.MeshBasicMaterial({ map: glare, transparent: true, opacity: T.lensGlare, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
          o.renderOrder = 5; rig.lenses.push(o);
        }
        if (/^eye_[LR]$/.test(n)) rig.eyes.push({ o, base: o.quaternion.clone() });
        if (/^lidUp_[LR]$/.test(n)) rig.lidsUp.push(o);
        if (/^lidLo_[LR]$/.test(n)) rig.lidsLo.push(o);
        if (n === 'teethUp') rig.teeth = { o, base: o.position.clone() };
      });
      st.ready = true; res(api);
    }, undefined, rej));
    return st.loading;
  }

  const Q = new THREE.Quaternion(), E = new THREE.Euler();
  function apply(dt) {
    const k = 1 - Math.exp(-14 * dt), kMouth = 1 - Math.exp(-30 * dt), speaking = !!st.speaking;
    const keys = new Set([...Object.keys(cur), ...Object.keys(mood), ...Object.keys(vis)]);
    for (const key_ of keys) {
      let target = mood[key_] || 0;
      if (speaking && MOUTH_KEYS.includes(key_)) target = target * .35 + (vis[key_] || 0);     // the mood relaxes while the mouth talks
      cur[key_] = (cur[key_] || 0) + (target - (cur[key_] || 0)) * (speaking && MOUTH_KEYS.includes(key_) ? kMouth : k);
    }
    st.browPop = (st.browPop || 0) * Math.exp(-5 * dt);
    const w = n => cur[n] || 0, both = w('browUp') + st.browPop * .35;
    if (rig.dict) for (const m of rig.morphs) for (const name in rig.dict) {
      let v = w(name); if (name === 'browUp_L' || name === 'browUp_R') v += both;
      m.morphTargetInfluences[rig.dict[name]] = v;
    }
    // blink
    if (st.t > st.nextBlink) { st.blinkT = 0; st.nextBlink = st.t + T.blinkEvery[0] + Math.random() * (T.blinkEvery[1] - T.blinkEvery[0]); }
    if (st.blinkT >= 0) { st.blinkT += dt; const u = st.blinkT / .16; st.blink = u < 1 ? Math.sin(Math.PI * u) : 0; if (u >= 1) st.blinkT = -1; }
    const lid = Math.max(st.blink, w('blink'), T.lidRest), squint = w('squint');
    for (const l of rig.lidsUp) l.rotation.x = THREE.MathUtils.degToRad(112 * lid);
    for (const l of rig.lidsLo) l.rotation.x = THREE.MathUtils.degToRad(-24 * lid - 22 * squint);
    // eyes: follow the pointer, with small darting movements
    if (st.t > st.sacT) { st.sacT = st.t + .6 + Math.random() * 2.2; st.sacX = (Math.random() - .5) * .08; st.sacY = (Math.random() - .5) * .05; }
    const gx = st.px * .32 + st.sacX + w('lookX') * .4, gy = st.py * .2 + st.sacY + w('lookY') * .3;
    st.lookX += (gx - st.lookX) * (1 - Math.exp(-10 * dt)); st.lookY += (gy - st.lookY) * (1 - Math.exp(-10 * dt));
    for (const e of rig.eyes) { E.set(-st.lookY, st.lookX, 0, 'YXZ'); Q.setFromEuler(E); e.o.quaternion.copy(e.base).premultiply(Q); }
    if (rig.teeth) { const openness = w('jawOpen') + .6 * w('upperLipUp') + .3 * w('lowerLipDown');           // teeth tuck away while the lips are closed
      const h = Math.max(w('teethHide'), 1 - THREE.MathUtils.clamp((openness - .05) / .2, 0, 1)); rig.teeth.o.position.set(rig.teeth.base.x, rig.teeth.base.y + .04 * h, rig.teeth.base.z - .03 * h); }
    // a little life in the head
    const talkBob = speaking ? Math.sin(st.t * 9) * .012 : 0;
    rig.root.rotation.set(Math.sin(st.t * .9) * .018 + talkBob - st.py * .05, Math.sin(st.t * .55) * .05 + st.px * .16, Math.sin(st.t * .7) * .012);
    rig.root.position.y = Math.sin(st.t * 1.6) * .006;
    glare.offset.set(rig.root.rotation.y * 1.6, -rig.root.rotation.x * 1.6);
  }

  function speakStep() {
    const s = st.speaking; if (!s) return;
    const t = (performance.now() - s.t0) / 1000; let i = s.i;            // real time, so the mouth stays with the audio even if frames drop
    while (i + 1 < s.cues.length && s.cues[i + 1].t <= t) i++;
    s.i = i;
    if (i !== s.last) { if (s.cues[i].v !== 'rest' && (i === 0 || s.cues[i - 1].v === 'rest')) st.browPop = Math.random() < .45 ? 1 : st.browPop; s.last = i; }
    for (const k_ in vis) delete vis[k_];
    Object.assign(vis, VISEMES[s.cues[i].v] || {});
    if (s.level) {                                                        // real audio: loudness opens and closes the mouth, the text picks the shape
      s.g = (s.g || 0) + (s.level() - (s.g || 0)) * .45;
      if (s.g < .05) { for (const k_ in vis) delete vis[k_]; }
      else { const gain = Math.min(1.25, .35 + s.g * 1.5); for (const k_ in vis) if (k_ !== 'teethHide') vis[k_] *= gain; if (!('jawOpen' in vis) || vis.jawOpen < .12 * gain) vis.jawOpen = .12 * gain; }
    }
    if (s.onProgress) s.onProgress(Math.min(1, t / s.dur));
    if (t >= s.dur) { const done = s.resolve; st.speaking = null; for (const k_ in vis) delete vis[k_]; done(); }
  }

  function frame(now) {
    st.raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - st.last) / 1000 || .016); st.last = now; st.t += dt;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    camera.position.set(0, T.lookAtY + .05, T.distance); camera.lookAt(0, T.lookAtY, 0);
    if (st.ready) { speakStep(); apply(dt); }
    renderer.render(scene, camera);
  }

  const api = {
    get ready() { return st.ready; }, rig, load,
    async open() { st.open = true; if (!st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(frame); } return load(); },
    close() { st.open = false; cancelAnimationFrame(st.raf); st.raf = 0; if (st.speaking) { st.speaking.resolve(); st.speaking = null; } },
    /** Change his expression. Pass a name from MOODS or your own weights. */
    setMood(m) { const src = typeof m === 'string' ? (MOODS[m] || {}) : m; for (const k_ in mood) delete mood[k_]; Object.assign(mood, src); },
    /** Speak a line: moves the mouth for the length of the text. cues = [{t, v}] lets real audio drive it later. */
    say(text, m, { cues, duration, onProgress, level } = {}) {
      if (m) api.setMood(m);
      if (st.speaking) st.speaking.resolve();
      let c = cues || visemesFromText(text); const natural = c[c.length - 1].t + .15, dur = duration || natural;
      if (duration && !cues) c = c.map(q => ({ t: q.t * (duration / natural), v: q.v }));          // stretch the text timing over the audio's length
      return new Promise(resolve => { st.speaking = { cues: c, i: 0, t0: performance.now(), dur, resolve, onProgress, level }; });
    },
    pointer(nx, ny) { st.px = THREE.MathUtils.clamp(nx, -1, 1); st.py = THREE.MathUtils.clamp(ny, -1, 1); },
    /** test hook: jump the clock so a pose settles instantly */
    settle(sec = 1) { for (let i = 0; i < sec * 60; i++) { st.t += 1 / 60; if (st.speaking) st.speaking.t0 -= 1000 / 60; if (st.ready) { speakStep(); apply(1 / 60); } } renderer.render(scene, camera); },
  };
  return api;
}
