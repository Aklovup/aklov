// A closed, chamfered ribbon swept around a parametric knot. No textures or libraries.
type V3 = [number, number, number];
const unit = (v: V3): V3 => { const l = Math.hypot(...v) || 1; return v.map(n => n / l) as V3; };
const cross = (a: V3, b: V3): V3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const vertexShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uRotation;
uniform float uAspect;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 p = (uRotation * vec4(aPosition, 1.)).xyz;
  vNormal = (uRotation * vec4(aNormal, 0.)).xyz;
  vPosition = p;
  float z = 8.6 - p.z;
  gl_Position = vec4(p.x * 2.15 / uAspect, p.y * 2.15, z * 1.002 - .2, z);
}`;
const fragmentShader = `
precision highp float;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 n = normalize(vNormal);
  vec3 view = normalize(vec3(0., 0., 8.6) - vPosition);
  vec3 reflected = reflect(-view, n);
  float key = max(0., dot(n, normalize(vec3(-.7, 1., 1.4))));
  float fill = max(0., dot(n, normalize(vec3(1., -.3, .6))));
  float fresnel = pow(1. - max(dot(n, view), 0.), 3.);
  float softbox = pow(max(0., dot(reflected, normalize(vec3(-.65, 1., 1.5)))), 20.);
  float strip = pow(max(0., 1. - abs(reflected.x * .75 + reflected.y * .3 - .25)), 35.);
  float rim = pow(max(0., dot(reflected, normalize(vec3(1., .1, .1)))), 70.);
  vec3 gold = vec3(.56, .37, .15);
  vec3 color = gold * (.32 + .8 * key + .2 * fill);
  color += vec3(1., .88, .62) * (softbox * .9 + strip * .65);
  color += vec3(.98, .96, .87) * (rim * .9 + fresnel * .3);
  color *= .84 + .16 * smoothstep(-2.5, 1., vPosition.y);
  color = pow(color, vec3(.78));
  gl_FragColor = vec4(color, 1.);
}`;

export function mountSculpture(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const hero = root.closest<HTMLElement>('[data-kinetic-hero]')!;
  const pauseButton = hero.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
  const formButton = hero.querySelector<HTMLButtonElement>('[data-form-toggle]')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let gl: WebGLRenderingContext | null;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { return; }
  if (!gl) return;
  const context = gl;
  const shader = (type: number, source: string) => {
    const s = context.createShader(type)!;
    context.shaderSource(s, source); context.compileShader(s);
    if (!context.getShaderParameter(s, context.COMPILE_STATUS)) { context.deleteShader(s); return null; }
    return s;
  };
  const vs = shader(context.VERTEX_SHADER, vertexShader);
  const fs = shader(context.FRAGMENT_SHADER, fragmentShader);
  if (!vs || !fs) return;
  const program = context.createProgram()!;
  context.attachShader(program, vs); context.attachShader(program, fs); context.linkProgram(program);
  context.deleteShader(vs); context.deleteShader(fs);
  if (!context.getProgramParameter(program, context.LINK_STATUS)) return;
  context.useProgram(program);
  context.enable(context.DEPTH_TEST);
  const rotationUniform = context.getUniformLocation(program, 'uRotation');
  const aspectUniform = context.getUniformLocation(program, 'uAspect');
  const buffers = [context.createBuffer()!, context.createBuffer()!, context.createBuffer()!];
  let indexCount = 0;
  let form = 0;

  function build() {
    const positions: number[] = [], normals: number[] = [], indices: number[] = [];
    const rings = 240, sides = 32;
    function curve(t: number): V3 {
      const p = form === 1 ? 3 : 2, q = form === 1 ? 2 : 3;
      const radius = 1.65 + (form === 2 ? .5 : .65) * Math.cos(q * t);
      return [radius * Math.cos(p*t), radius * Math.sin(p*t), (form === 2 ? 1.05 : .72) * Math.sin(q*t)];
    }
    for (let i = 0; i <= rings; i++) {
      const t = i/rings * Math.PI*2, c = curve(t), before = curve(t-.001), after = curve(t+.001);
      const tangent = unit(after.map((v,j) => v-before[j]) as V3);
      const n = unit(cross(tangent, [0,0,1]));
      const b = unit(cross(tangent, n));
      for (let j = 0; j <= sides; j++) {
        const a = j/sides * Math.PI*2;
        // A superellipse gives a wide ribbon with rounded edges instead of a round pipe.
        const x = .31*Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)), .42);
        const y = .16*Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)), .42);
        const localNormal = unit([Math.sign(x)*Math.pow(Math.abs(x/.31), 3.76)/.31, Math.sign(y)*Math.pow(Math.abs(y/.16), 3.76)/.16, 0]);
        for (let k = 0; k < 3; k++) {
          positions.push(c[k] + n[k]*x + b[k]*y);
          normals.push(n[k]*localNormal[0] + b[k]*localNormal[1]);
        }
        if (i < rings && j < sides) {
          const a0 = i*(sides+1)+j, a1 = a0+sides+1;
          indices.push(a0,a1,a0+1,a0+1,a1,a1+1);
        }
      }
    }
    [positions, normals].forEach((data,i) => {
      context.bindBuffer(context.ARRAY_BUFFER, buffers[i]);
      context.bufferData(context.ARRAY_BUFFER, new Float32Array(data), context.STATIC_DRAW);
      const location = context.getAttribLocation(program, i === 0 ? 'aPosition' : 'aNormal');
      context.enableVertexAttribArray(location); context.vertexAttribPointer(location,3,context.FLOAT,false,0,0);
    });
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, buffers[2]);
    context.bufferData(context.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),context.STATIC_DRAW);
    indexCount = indices.length;
  }

  let angle = .2, elapsed = 0, previous = 0, frame = 0, visible = true, lost = false;
  let paused = motion.matches;
  let targetX = 0, targetY = 0, x = 0, y = 0;
  function resize() {
    const box = root.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, innerWidth < 800 ? 1.25 : 1.5);
    canvas.width = Math.max(1, Math.round(box.width*ratio)); canvas.height = Math.max(1,Math.round(box.height*ratio));
    context.viewport(0,0,canvas.width,canvas.height);
    context.uniform1f(aspectUniform,canvas.width/canvas.height);
    draw();
  }
  function draw() {
    if (lost) return;
    const ax = -.48+y, ay = -.38+x, az = angle;
    const cx=Math.cos(ax), sx=Math.sin(ax), cy=Math.cos(ay), sy=Math.sin(ay), cz=Math.cos(az), sz=Math.sin(az);
    // Column-major rotation Rz * Ry * Rx.
    const matrix = new Float32Array([
      cz*cy, sz*cy, -sy, 0,
      cz*sy*sx-sz*cx, sz*sy*sx+cz*cx, cy*sx, 0,
      cz*sy*cx+sz*sx, sz*sy*cx-cz*sx, cy*cx, 0,
      0, Math.sin(elapsed*.5)*.07, 0, 1,
    ]);
    context.clearColor(0,0,0,0); context.clear(context.COLOR_BUFFER_BIT|context.DEPTH_BUFFER_BIT);
    context.uniformMatrix4fv(rotationUniform,false,matrix);
    context.drawElements(context.TRIANGLES,indexCount,context.UNSIGNED_SHORT,0);
    root.dataset.rendered = 'true';
  }
  function tick(time: number) {
    frame = 0;
    if (paused || !visible || document.hidden || lost) { previous=0; return; }
    const dt = previous ? Math.min((time-previous)/1000,.05) : 0; previous=time;
    elapsed += dt; angle += dt*.09;
    x += (targetX-x)*.045; y += (targetY-y)*.045;
    draw(); frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame=0; previous=0;
    pauseButton.textContent = paused ? 'Play motion' : 'Pause motion';
    pauseButton.setAttribute('aria-pressed',String(paused));
    hero.dataset.motion = paused ? 'paused' : 'playing';
    if (!paused && visible && !document.hidden && !lost) frame=requestAnimationFrame(tick);
  }
  build(); resize();
  root.dataset.renderer = 'webgl';
  pauseButton.hidden = false; formButton.hidden = false;
  sync();
  pauseButton.addEventListener('click', () => { paused=!paused; sync(); });
  formButton.addEventListener('click', () => {
    form=(form+1)%3; build(); draw();
    const count=hero.querySelector<HTMLElement>('[data-form-number]');
    if (count) count.textContent=String(form+1).padStart(2,'0');
  });
  hero.addEventListener('pointermove', event => {
    if (event.pointerType!=='mouse' || paused || motion.matches) return;
    const rect=hero.getBoundingClientRect();
    targetX=(event.clientX/rect.width-.5)*.45;
    targetY=((event.clientY-rect.top)/rect.height-.5)*.3;
  }, { passive:true });
  hero.addEventListener('pointerleave', () => { targetX=0; targetY=0; });
  const observer=new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; sync(); }); observer.observe(hero);
  const sizeObserver=new ResizeObserver(resize); sizeObserver.observe(root);
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change', () => { paused=motion.matches; x=y=targetX=targetY=0; draw(); sync(); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost=true; cancelAnimationFrame(frame); root.dataset.renderer='fallback';
    pauseButton.hidden=true; formButton.hidden=true;
  });
  // Restoring a context invalidates its old GPU resources. Keep the static artwork
  // until navigation rather than attempting to draw with invalid buffers.
  canvas.addEventListener('webglcontextrestored', () => { root.dataset.renderer='fallback'; });
}
