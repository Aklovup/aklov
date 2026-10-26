import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { bindCatalogueGestures } from './catalogueGesture';
import { catalogueMaterial } from './catalogueMaterial';
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
  let active=0,worldOpener=false;
  hero.querySelector<HTMLElement>('.world-controls')!.hidden=false;
  let sync=()=>{};
  let selectInScene:((project:Project,index:number,fromGesture?:boolean)=>void)|undefined;
  function select(index:number,announce=true,fromGesture=false) {
    active=((index%projects.length)+projects.length)%projects.length;
    const p=projects[active];
    hero.querySelector('[data-world-title]')!.textContent=p.title;
    hero.querySelector('[data-world-category]')!.textContent=p.category;
    hero.querySelector('[data-form-number]')!.textContent=String(active+1).padStart(2,'0');
    hero.dataset.activeProject=p.slug;open.setAttribute('aria-label',`View project: ${p.title}`);
    if(announce) status.textContent=`${active+1} of ${projects.length} · ${p.type}${p.src?'':' · Preview pending'}`;
    const image=root.querySelector('[data-world-fallback-image]');
    if(image) {if(p.src) image.setAttribute('href',p.src);else image.removeAttribute('href');}
    selectInScene?.(p,active,fromGesture);
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
  catch{root.dataset.renderer='fallback';const hint=hero.querySelector<HTMLElement>('.world-gesture-hint');if(hint){hint.hidden=false;hint.textContent='Use the arrows to explore projects';}return;}
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
  const frameGeometry=new RoundedBoxGeometry(8.1,5.1,.35,3,.08);
  const screenGeometry=new THREE.PlaneGeometry(7.5,4.22);
  const step=Math.PI*2/projects.length;
  const radius=projects.length>2?Math.max(12.5,8.3/(2*Math.sin(step/2))):12.5;
  const panels=projects.map((project,index)=>{
    const group=new THREE.Group();group.userData.projectIndex=index;scene.add(group);
    const frameMaterial=brass.clone();frameMaterial.transparent=true;
    group.add(new THREE.Mesh(frameGeometry,frameMaterial));
    const texture=pendingTexture(project,index);
    const material=catalogueMaterial(texture);
    const screen=new THREE.Mesh(screenGeometry,material);screen.position.z=.2;screen.userData.projectIndex=index;group.add(screen);
    return {group,screen,material,frameMaterial,placeholder:texture,loaded:false,ready:false};
  });
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
  const textures=new Map<string,Promise<THREE.Texture>>(),loader=new THREE.TextureLoader();
  function pendingTexture(p:Project,index:number){
    const c=document.createElement('canvas');c.width=512;c.height=288;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#11191b';ctx.fillRect(0,0,512,288);ctx.strokeStyle='#a58a51';ctx.lineWidth=1;ctx.strokeRect(20,20,472,248);
    ctx.font='90px Georgia';ctx.fillStyle='#d8bd78';ctx.fillText(String(index+1).padStart(2,'0'),36,130);
    ctx.font='14px sans-serif';ctx.fillStyle='#f5f2ea';ctx.fillText(p.title,37,190,435);ctx.font='12px sans-serif';ctx.fillStyle='#bcb7a9';ctx.fillText(p.src?'Loading preview…':'Preview pending',37,221);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  function applyTexture(index:number,texture:THREE.Texture){
    const panel=panels[index],image=texture.image,aspect=image.width/image.height;
    const rx=Math.min(1,(16/9)/aspect),ry=Math.min(1,aspect/(16/9));
    panel.material.uniforms.uMap.value=texture;
    panel.material.uniforms.uTexel.value.set(1/image.width,1/image.height);
    panel.material.uniforms.uCrop.value.set(rx,ry,(1-rx)/2,1-ry);
    panel.placeholder.dispose();panel.ready=true;
    if(index===active){const p=projects[index];status.textContent=`${index+1} of ${projects.length} · ${p.type}${p.src?'':' · Preview pending'}`;}
    draw();
  }
  function ensurePanel(index:number){
    index=((index%projects.length)+projects.length)%projects.length;
    const panel=panels[index],p=projects[index];if(panel.loaded)return;panel.loaded=true;
    if(!p.src){panel.ready=true;return;}
    if(!textures.has(p.src))textures.set(p.src,new Promise((resolve,reject)=>loader.load(p.src!,texture=>{
      const image=texture.image,cover=document.createElement('canvas');
      cover.width=mobile?768:1024;cover.height=cover.width*9/16;
      const ctx=cover.getContext('2d')!,aspect=image.width/image.height;
      const sw=aspect>16/9?image.height*16/9:image.width;
      const sh=aspect>16/9?image.height:image.width*9/16;
      ctx.drawImage(image,(image.width-sw)/2,0,sw,sh,0,0,cover.width,cover.height);
      const cropped=new THREE.CanvasTexture(cover);cropped.colorSpace=THREE.SRGBColorSpace;
      cropped.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());texture.dispose();resolve(cropped);
    },undefined,reject)));
    void textures.get(p.src)!.then(texture=>applyTexture(index,texture)).catch(()=>{
      // Keep an explicit pending preview, without displaying another project's image.
      const fallback=pendingTexture({...p,src:undefined},index);applyTexture(index,fallback);
      if(index===active)status.textContent='Project preview unavailable. Open its case study to explore the project.';
    });
  }
  let cataloguePosition=0,catalogueTarget=0,catalogueVelocity=0,dragging=false;
  function layoutCatalogue(){
    const focus=Math.round(cataloguePosition);ensurePanel(focus);ensurePanel(focus+1);ensurePanel(focus-1);
    const portrait=innerWidth<800,ringRadius=radius*(portrait?.83:1);
    let visibleCount=0;
    for(let index=0;index<panels.length;index++){
      const panel=panels[index];
      const distance=THREE.MathUtils.euclideanModulo(index-cataloguePosition+projects.length/2,projects.length)-projects.length/2;
      const angle=distance*step,depth=Math.abs(distance);
      panel.group.visible=depth<1.72;if(!panel.group.visible)continue;visibleCount++;
      panel.group.position.set(Math.sin(angle)*ringRadius,4.5,(portrait?-7.5:-11.2)+ringRadius*(Math.cos(angle)-1));
      panel.group.rotation.y=angle;panel.group.scale.setScalar(portrait?.86:1);
      const opacity=THREE.MathUtils.clamp(1-depth*.38,.14,1);
      panel.material.uniforms.uBlur.value=Math.min(18,depth*12);
      panel.material.uniforms.uOpacity.value=opacity;
      panel.material.depthWrite=depth<.2;
      panel.frameMaterial.opacity=THREE.MathUtils.clamp(1-depth*.32,.2,1);
      panel.frameMaterial.depthWrite=depth<.2;
    }
    root.dataset.cataloguePosition=cataloguePosition.toFixed(3);
    root.dataset.visibleProjects=String(visibleCount);
    root.dataset.catalogueSettled=String(!dragging&&Math.abs(cataloguePosition-catalogueTarget)<.01&&Math.abs(catalogueVelocity)<.02);
  }
  selectInScene=(p,index,fromGesture=false)=>{
    const origin=fromGesture?cataloguePosition:catalogueTarget;
    catalogueTarget=index+Math.round((origin-index)/projects.length)*projects.length;
    ensurePanel(index);ensurePanel(index+1);ensurePanel(index-1);
    if(paused){cataloguePosition=catalogueTarget;catalogueVelocity=0;draw();}
    else sync();
  };
  let paused=motion.matches,visible=true,lost=false,frameId=0,last=0,time=0,intro=0;
  let mouseX=0,mouseY=0,smoothedX=0,smoothedY=0,scroll=0;
  const look=new THREE.Vector3(0,4,-22);
  function draw(){
    if(lost)return;
    const portrait=innerWidth<800,side=portrait?.75:3.8,range=portrait?17.2:17;
    camera.position.set(side+smoothedX*1.4,5.4+smoothedY*.65,range+intro*7-scroll*5);camera.lookAt(look);
    ripple.value=time;layoutCatalogue();dust.rotation.y=Math.sin(time*.02)*.02;composer.render();root.dataset.rendered='true';
  }
  function resize(){const r=root.getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);composer.setSize(r.width,r.height);draw();}
  function tick(now:number){
    frameId=0;if(paused||!visible||document.hidden||lost||dialog?.open){last=0;return;}
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;
    if(!dragging){
      catalogueVelocity+=(catalogueTarget-cataloguePosition)*34*dt;
      catalogueVelocity*=Math.exp(-10*dt);cataloguePosition+=catalogueVelocity*dt;
      if(Math.abs(cataloguePosition-catalogueTarget)<.0005&&Math.abs(catalogueVelocity)<.002){cataloguePosition=catalogueTarget;catalogueVelocity=0;}
    }
    intro=Math.max(0,intro-dt*.32);smoothedX+=(mouseX-smoothedX)*.045;smoothedY+=(mouseY-smoothedY)*.045;draw();frameId=requestAnimationFrame(tick);
  }
  sync=()=>{cancelAnimationFrame(frameId);last=0;hero.dataset.motion=paused?'paused':'playing';pause.textContent=paused?'Play motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));if(!paused&&visible&&!document.hidden&&!lost&&!dialog?.open)frameId=requestAnimationFrame(tick);};
  intro=paused?0:1;resize();selectInScene(projects[0],0);root.dataset.renderer='webgl';pause.hidden=false;hero.querySelector<HTMLElement>('.world-gesture-hint')!.hidden=false;sync();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const blockers:THREE.Object3D[]=[];
  scene.traverse(object=>{if((object as THREE.Mesh).isMesh&&object!==floor&&object!==sky&&!panels.some(p=>p.group===object.parent))blockers.push(object);});
  bindCatalogueGestures(canvas,{
    position:()=>cataloguePosition,
    start:()=>{dragging=true;catalogueVelocity=0;hero.dataset.dragging='true';},
    move:position=>{cataloguePosition=position;if(paused||!frameId)draw();},
    release:(projected,velocity=0)=>{dragging=false;catalogueVelocity=THREE.MathUtils.clamp(velocity*.35,-1.8,1.8);delete hero.dataset.dragging;select(Math.round(projected),true,true);},
    tap:(x,y)=>{
      const box=canvas.getBoundingClientRect();pointer.set((x-box.left)/box.width*2-1,-(y-box.top)/box.height*2+1);
      raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects([...blockers,...panels.filter(p=>p.group.visible).flatMap(p=>p.group.children)],false)[0];
      if(!hit)return;
      const index=hit.object.userData.projectIndex??hit.object.parent?.userData.projectIndex;
      if(typeof index!=='number')return;
      if(index===active)open.click();else select(index);
    }
  });
  pause.addEventListener('click',()=>{paused=!paused;if(paused){cataloguePosition=catalogueTarget;catalogueVelocity=0;draw();}sync();});
  hero.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!paused&&!dragging){const r=hero.getBoundingClientRect();mouseX=(e.clientX-r.left)/r.width-.5;mouseY=(e.clientY-r.top)/r.height-.5;}},{passive:true});
  hero.addEventListener('pointerleave',()=>{mouseX=mouseY=0;});
  window.addEventListener('scroll',()=>{scroll=Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/hero.offsetHeight));if(paused){scroll=0;return;}if(visible&&!frameId)draw();},{passive:true});
  new ResizeObserver(resize).observe(root);new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(hero);
  document.addEventListener('visibilitychange',sync);document.addEventListener('aklov:project-open',sync);
  motion.addEventListener('change',()=>{paused=motion.matches;if(paused){intro=scroll=smoothedX=smoothedY=0;cataloguePosition=catalogueTarget;catalogueVelocity=0;draw();}sync();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frameId);root.dataset.renderer='fallback';pause.hidden=true;});
}
