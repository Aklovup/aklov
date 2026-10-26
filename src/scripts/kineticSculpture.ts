import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
interface Project { slug:string; title:string; category:string; type:string; src?:string; }

export function mountSculpture(root:HTMLElement) {
  const hero=root.closest<HTMLElement>('[data-kinetic-hero]')!;
  const projects:Project[]=JSON.parse(root.querySelector('#world-projects')!.textContent!);
  const canvas=root.querySelector<HTMLCanvasElement>('canvas')!;
  const pause=hero.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
  const next=hero.querySelector<HTMLButtonElement>('[data-form-toggle]')!;
  const previous=hero.querySelector<HTMLButtonElement>('[data-world-prev]')!;
  const open=hero.querySelector<HTMLButtonElement>('[data-world-open]')!;
  const status=hero.querySelector<HTMLElement>('[data-world-status]')!;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const dialog=document.querySelector<HTMLDialogElement>('[data-project-dialog]');
  let active=0,worldOpener=false,textureEpoch=0,projectPan=0,targetProjectPan=0;
  hero.querySelector<HTMLElement>('.world-controls')!.hidden=false;
  let sync=()=>{};
  let selectInScene:((project:Project,index:number)=>void)|undefined;
  function select(index:number,announce=true) {
    active=(index+projects.length)%projects.length;targetProjectPan=((active%3)-1)*1.8;
    const p=projects[active];
    hero.querySelector('[data-world-title]')!.textContent=p.title;
    hero.querySelector('[data-world-category]')!.textContent=p.category;
    hero.querySelector('[data-form-number]')!.textContent=String(active+1).padStart(2,'0');
    hero.dataset.activeProject=p.slug;open.setAttribute('aria-label',`View project: ${p.title}`);
    if(announce) status.textContent=`${active+1} of ${projects.length} · ${p.type}${p.src?'':' · Preview pending'}`;
    const image=root.querySelector('[data-world-fallback-image]');
    if(image) {if(p.src) image.setAttribute('href',p.src);else image.removeAttribute('href');}
    selectInScene?.(p,active);
  }
  next.addEventListener('click',()=>select(active+1));
  previous.addEventListener('click',()=>select(active-1));
  hero.querySelector('.world-controls')!.addEventListener('keydown',(event:Event)=>{
    const key=event as KeyboardEvent;
    if(key.key==='ArrowRight'||key.key==='ArrowLeft'){key.preventDefault();select(active+(key.key==='ArrowRight'?1:-1));}
  });
  open.addEventListener('click',()=>{
    const trigger=document.querySelector<HTMLButtonElement>(`[data-project-open="${projects[active].slug}"]`);
    if(trigger&&!trigger.hidden){worldOpener=true;trigger.click();}else document.getElementById('projects')?.scrollIntoView();
  });
  const returnWorldFocus=()=>{
    if(!worldOpener||dialog?.open||new URL(location.href).searchParams.has('project')) return;
    worldOpener=false;
    // Wait for the dialog's URL/history restoration and its own queued focus work.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!dialog?.open)open.focus({preventScroll:true});}));
  };
  dialog?.addEventListener('close',()=>{returnWorldFocus();sync();});
  window.addEventListener('popstate',returnWorldFocus);
  select(0,false);
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}
  catch{root.dataset.renderer='fallback';return;}
  const mobile=innerWidth<800;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.15:1.4));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#27373b');scene.fog=new THREE.FogExp2('#3d4b4a',.024);
  const camera=new THREE.PerspectiveCamera(46,1,.1,200);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(110,32,16),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    vertexShader:'varying vec3 vDirection; void main(){ vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader:'precision highp float; varying vec3 vDirection; void main(){ vec3 d=normalize(vDirection); float h=smoothstep(-.06,.6,d.y); vec3 c=mix(vec3(.27,.32,.29),vec3(.025,.055,.07),h); float sun=pow(max(dot(d,normalize(vec3(-.6,.16,-1.))),0.),18.); c+=vec3(.30,.22,.10)*sun; gl_FragColor=vec4(c,1.); }'
  }));scene.add(sky);
  const pmrem=new THREE.PMREMGenerator(renderer),studio=new RoomEnvironment();
  const env=pmrem.fromScene(studio,.06);scene.environment=env.texture;scene.environmentIntensity=.42;studio.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#d3e0d8','#222a28',2.1));
  const sun=new THREE.DirectionalLight('#f5dfaf',4.5);sun.position.set(-12,24,7);sun.castShadow=!mobile;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.normalBias=.04;scene.add(sun);
  const cold=new THREE.DirectionalLight('#879caa',2);cold.position.set(16,8,-20);scene.add(cold);
  const stone=new THREE.MeshStandardMaterial({color:'#596059',roughness:.58,metalness:.48});
  const darkStone=new THREE.MeshStandardMaterial({color:'#11191b',roughness:.68,metalness:.3});
  const brass=new THREE.MeshStandardMaterial({color:'#b99b58',metalness:.92,roughness:.23});
  const light=new THREE.MeshBasicMaterial({color:new THREE.Color('#e7c37e').multiplyScalar(2.4),toneMapped:false});
  function box(w:number,h:number,d:number,material:THREE.Material,x:number,y:number,z:number,r=.07){
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,r),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;
  }
  // One coherent courtyard. Architecture, light strips and reflections share a space.
  for(let i=0;i<9;i++){
    const z=-11-i*8,opening=10+i*.35,height=11+i*.45,mat=i%2?darkStone:stone;
    box(1.25,height,1.8,mat,-opening/2,height/2,z);box(1.25,height,1.8,mat,opening/2,height/2,z);box(opening+1.25,1.25,1.8,mat,0,height,z);
    box(.045,height-.5,.07,light,-opening/2+.65,height/2,z+.92,.01);box(opening-.05,.045,.07,light,0,height-.64,z+.92,.01);
    const offset=11+(i%3)*2.5;
    box(2.2,13+i*.65,5,darkStone,-offset,6.5+i*.325,z-3);box(2.2,8+i*.8,3,stone,offset,4+i*.4,z-3);
  }
  for(let i=0;i<10;i++){const z=10-i*5;box(1.6,.3,3.2,stone,-5.8,.08,z);box(1.6,.3,3.2,darkStone,5.8,.08,z);}
  const screenGroup=new THREE.Group();screenGroup.position.set(0,4.5,-11.2);scene.add(screenGroup);
  screenGroup.add(new THREE.Mesh(new RoundedBoxGeometry(8.1,5.1,.35,3,.08),brass));
  const backing=new THREE.Mesh(new THREE.PlaneGeometry(7.8,4.8),new THREE.MeshBasicMaterial({color:'#090d0e'}));backing.position.z=.19;screenGroup.add(backing);
  const screenMaterial=new THREE.MeshBasicMaterial({color:'#11191b',toneMapped:false});
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(7.5,4.22),screenMaterial);screen.position.z=.2;screenGroup.add(screen);
  const screenLight=new THREE.PointLight('#e2c58c',18,14,2);screenLight.position.set(0,5,-7);scene.add(screenLight);
  const floor=new Reflector(new THREE.PlaneGeometry(250,250),{color:0x707a75,textureWidth:mobile?320:640,textureHeight:mobile?320:640,clipBias:.003,multisample:0});
  floor.rotation.x=-Math.PI/2;floor.position.y=-.12;scene.add(floor);
  const ripple={value:0};floor.material.uniforms.uTime=ripple;
  floor.material.fragmentShader='uniform float uTime;\n'+floor.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );','vec4 waterUv=vUv; waterUv.x += sin(vUv.y*85.0/vUv.w+uTime*.28)*.00075*vUv.w; waterUv.y += sin(vUv.x*120.0/vUv.w+uTime*.19)*.0006*vUv.w; vec4 base = texture2DProj(tDiffuse, waterUv);');
  floor.material.fragmentShader=floor.material.fragmentShader.replace(/\}\s*$/, 'gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.27,.32,.29),smoothstep(.9975,.9996,gl_FragCoord.z));\n}');
  const dustGeometry=new THREE.BufferGeometry(),positions=new Float32Array((mobile?160:420)*3);let seed=917;
  const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<positions.length;i+=3){positions[i]=(random()-.5)*55;positions[i+1]=random()*22+.3;positions[i+2]=random()*-85+12;}
  dustGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#dbd1ae',size:.015,transparent:true,opacity:.23,depthWrite:false}));scene.add(dust);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.32,.65,1.25));composer.addPass(new OutputPass());
  const textures=new Map<string,THREE.Texture>(),loader=new THREE.TextureLoader();
  function pendingTexture(p:Project,index:number){
    const c=document.createElement('canvas');c.width=1024;c.height=576;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#11191b';ctx.fillRect(0,0,1024,576);ctx.strokeStyle='#a58a51';ctx.lineWidth=2;ctx.strokeRect(40,40,944,496);
    ctx.font='180px Georgia';ctx.fillStyle='#d8bd78';ctx.fillText(String(index+1).padStart(2,'0'),72,260);
    ctx.font='28px sans-serif';ctx.fillStyle='#f5f2ea';ctx.fillText(p.title,74,380,870);ctx.font='20px sans-serif';ctx.fillStyle='#bcb7a9';ctx.fillText('Preview pending',74,442);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  function applyTexture(t:THREE.Texture){
    screenMaterial.color.set(0xffffff);screenMaterial.map=t;screenMaterial.needsUpdate=true;
    const current=projects[active];status.textContent=`${active+1} of ${projects.length} · ${current.type}${current.src?'':' · Preview pending'}`;const aspect=t.image.width/t.image.height;
    t.repeat.set(Math.min(1,(16/9)/aspect),Math.min(1,aspect/(16/9)));t.offset.set((1-t.repeat.x)/2,1-t.repeat.y);t.needsUpdate=true;draw();
  }
  selectInScene=(p,index)=>{
    const epoch=++textureEpoch,key=p.src||p.slug;
    if(textures.has(key)){applyTexture(textures.get(key)!);return;}
    if(!p.src){const t=pendingTexture(p,index);textures.set(key,t);applyTexture(t);return;}
    screenMaterial.map=null;screenMaterial.color.set('#11191b');screenMaterial.needsUpdate=true;draw();status.textContent='Loading project preview…';
    loader.load(p.src,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.set(key,t);if(epoch===textureEpoch)applyTexture(t);},undefined,()=>{
      const t=pendingTexture(p,index);textures.set(key,t);if(epoch===textureEpoch){applyTexture(t);status.textContent='Project preview unavailable. Open the case study to explore the project.';}
    });
  };
  let paused=motion.matches,visible=true,lost=false,frameId=0,last=0,time=0,intro=0;
  let mouseX=0,mouseY=0,smoothedX=0,smoothedY=0,scroll=0;
  const look=new THREE.Vector3(0,4,-22);
  function draw(){
    if(lost)return;
    const portrait=innerWidth<800,side=portrait?1.3:7.2,range=portrait?13.5:17;
    camera.position.set(side+projectPan+smoothedX*2.3,5.4+smoothedY*.65,range+intro*7-scroll*5);camera.lookAt(look);
    ripple.value=time;screenGroup.rotation.y=Math.sin(time*.15)*.025;dust.rotation.y=Math.sin(time*.02)*.02;composer.render();root.dataset.rendered='true';
  }
  function resize(){const r=root.getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);composer.setSize(r.width,r.height);draw();}
  function tick(now:number){
    frameId=0;if(paused||!visible||document.hidden||lost||dialog?.open){last=0;return;}
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;projectPan+=(targetProjectPan-projectPan)*.035;intro=Math.max(0,intro-dt*.32);smoothedX+=(mouseX-smoothedX)*.045;smoothedY+=(mouseY-smoothedY)*.045;draw();frameId=requestAnimationFrame(tick);
  }
  sync=()=>{cancelAnimationFrame(frameId);last=0;hero.dataset.motion=paused?'paused':'playing';pause.textContent=paused?'Play motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));if(!paused&&visible&&!document.hidden&&!lost&&!dialog?.open)frameId=requestAnimationFrame(tick);};
  intro=paused?0:1;resize();selectInScene(projects[0],0);root.dataset.renderer='webgl';pause.hidden=false;sync();
  pause.addEventListener('click',()=>{paused=!paused;sync();});
  hero.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!paused){const r=hero.getBoundingClientRect();mouseX=(e.clientX-r.left)/r.width-.5;mouseY=(e.clientY-r.top)/r.height-.5;}},{passive:true});
  hero.addEventListener('pointerleave',()=>{mouseX=mouseY=0;});
  window.addEventListener('scroll',()=>{scroll=Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/hero.offsetHeight));if(paused){scroll=0;return;}if(visible&&!frameId)draw();},{passive:true});
  new ResizeObserver(resize).observe(root);new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(hero);
  document.addEventListener('visibilitychange',sync);document.addEventListener('aklov:project-open',sync);
  motion.addEventListener('change',()=>{paused=motion.matches;if(paused){intro=scroll=smoothedX=smoothedY=0;draw();}sync();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frameId);root.dataset.renderer='fallback';pause.hidden=true;});
}
