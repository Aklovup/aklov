import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { modelsFor, type ShowroomModel, type ShowroomProject, type ShowroomState } from './showroomState';
import { previousLocation, wheelDistance, travelProgress } from './showroomTravel';
interface Options { selectModel:(category:string)=>void; selectRoom:(slug:string)=>void; retreat:()=>void; isIndexOpen:()=>boolean; }

export function createShowroomScene(root:HTMLElement,projects:ShowroomProject[],options:Options) {
  const canvas=root.querySelector<HTMLCanvasElement>('canvas')!;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const pause=root.querySelector<HTMLButtonElement>('[data-showroom-motion]')!;
  let renderer:THREE.WebGLRenderer;
  try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch {root.dataset.renderer='fallback';root.dataset.roomReady='true';return {setState:(_state:ShowroomState)=>{},hover:(_key?:string)=>{},start:()=>{}};}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<800?1.1:1.4));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#18292b');scene.fog=new THREE.FogExp2('#253c3d',.012);
  const camera=new THREE.PerspectiveCamera(42,1,.1,180);
  const envSource=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(envSource,.06);
  scene.environment=environment.texture;scene.environmentIntensity=.48;envSource.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#dce7da','#172628',1.7));
  const key=new THREE.DirectionalLight('#ffe4b2',2.3);key.position.set(-14,28,12);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-23;key.shadow.camera.right=23;key.shadow.camera.top=23;key.shadow.camera.bottom=-23;key.shadow.normalBias=.035;scene.add(key);
  const fill=new THREE.DirectionalLight('#a4c1c3',1.9);fill.position.set(16,12,-20);scene.add(fill);
  const plaster=new THREE.MeshStandardMaterial({color:'#e5e1d3',roughness:.57,metalness:.04});
  const charcoal=new THREE.MeshStandardMaterial({color:'#17282a',roughness:.4,metalness:.55});
  const gold=new THREE.MeshStandardMaterial({color:'#c5a76b',roughness:.28,metalness:.86});
  const glow=new THREE.MeshBasicMaterial({color:new THREE.Color('#e9cb88').multiplyScalar(1.7),toneMapped:false});
  function box(parent:THREE.Object3D,w:number,h:number,d:number,material:THREE.Material,x=0,y=0,z=0,r=.04) {
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,Math.min(w,h,d)/3)),material.clone());mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  // The room is a quiet exhibition space; the models are the exhibits.
  for(const x of [-22,22])for(let i=0;i<5;i++) {
    box(scene,1.5,15,4,charcoal,x,7.5,-24+i*8);
    box(scene,.055,11,.1,glow,x+(x<0?1:-1),6,-22+i*8,.01);
  }
  box(scene,46,18,.8,charcoal,0,9,-28);
  box(scene,28,.06,.15,glow,0,10,-27.5,.01);
  const table=new THREE.Group();scene.add(table);
  const tabletop=new THREE.MeshStandardMaterial({color:'#9d9f8c',roughness:.72,metalness:.08});
  box(table,18,.46,15.4,tabletop,0,3.2,0,.16);
  box(table,18.12,.07,15.52,gold,0,2.96,0,.03);
  box(table,10.2,2.8,7.5,charcoal,0,1.4,0,.2);
  for(let i=-4;i<=4;i++)box(table,.055,2.55,.08,gold,i*1.04,1.4,3.8,.01);
  const floor=new Reflector(new THREE.PlaneGeometry(180,180),{color:0x535f5b,textureWidth:innerWidth<800?320:640,textureHeight:innerWidth<800?320:640,clipBias:.003,multisample:0});floor.rotation.x=-Math.PI/2;floor.position.y=-.03;scene.add(floor);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.25,.7,1.3));composer.addPass(new OutputPass());
  const dustGeometry=new THREE.BufferGeometry();
  const dustPositions=new Float32Array(60*3);for(let i=0;i<60;i++){dustPositions[i*3]=(Math.sin(i*2.39)*13);dustPositions[i*3+1]=5+(i%9);dustPositions[i*3+2]=Math.cos(i*1.71)*10;}
  dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#d8bd78',size:.035,transparent:true,opacity:.22,depthWrite:false}));scene.add(dust);
  const loader=new THREE.TextureLoader(),textureCache=new Map<string,Promise<THREE.Texture>>();
  function preview(project:ShowroomProject,index:number,label=project.src?'Preview loading':'Preview pending') {
    const c=document.createElement('canvas');c.width=512;c.height=288;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#17282a';ctx.fillRect(0,0,512,288);ctx.strokeStyle='#b79d67';ctx.strokeRect(15,15,482,258);ctx.fillStyle='#dfc489';ctx.font='100px Georgia';ctx.fillText(String(index+1).padStart(2,'0'),34,150);ctx.fillStyle='#e5e1d3';ctx.font='16px Arial';ctx.fillText(label,35,220);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  function modelSign(model:ShowroomModel,index:number) {
    const c=document.createElement('canvas');c.width=640;c.height=180;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#17282a';ctx.fillRect(0,0,640,180);ctx.fillStyle='#d8bd78';ctx.font='22px Arial';ctx.fillText(`${String(index+1).padStart(2,'0')} / ${model.projects.length} ${model.projects.length===1?'PROJECT':'PROJECTS'}`,26,43);
    ctx.fillStyle='#f5f2ea';ctx.font='32px Georgia';const words=model.label.split(' ');let line='',y=99;for(const word of words){if(ctx.measureText(line+' '+word).width>580){ctx.fillText(line,26,y);line=word;y+=38;}else line+=(line?' ':'')+word;}ctx.fillText(line,26,y);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:tex,toneMapped:false});
  }
  const exhibitModels=[...modelsFor(projects,'client'),...modelsFor(projects,'concepts')].map((data)=>{
    const group=new THREE.Group();group.userData.model=data.category;group.userData.group=data.group;scene.add(group);group.position.y=3.45;
    const columns=Math.min(3,Math.ceil(Math.sqrt(data.projects.length))),rows=Math.ceil(data.projects.length/columns),w=columns*2.55+.4,d=rows*2.6+.45;
    box(group,w,.2,d,plaster,0,.1,0,.06);box(group,w+.06,.045,d+.06,gold,0,.015,0,.012);
    const roof=new THREE.Group();roof.position.y=2.3;group.add(roof);
    if(data.category==='customer-systems') {
      box(roof,w,.2,.6,plaster,0,0,d/2-.3);box(roof,w,.2,.6,plaster,0,0,-d/2+.3);box(roof,.6,.2,d,plaster,-w/2+.3);box(roof,.6,.2,d,plaster,w/2-.3);
    }else if(data.category==='websites') {
      for(let i=0;i<columns*3;i++){const panel=box(roof,w/(columns*3)-.035,.18,d,plaster,-w/2+w/(columns*3)*(i+.5));panel.rotation.z=.09;}
    }else {
      for(let i=0;i<columns;i++)box(roof,w/columns-.08,.22,d,plaster,-w/2+w/columns*(i+.5),i%2*.12,0);
      if(data.category==='applications')box(roof,.14,.32,d+.18,gold,0,.07,0,.02);
    }
    const glassMaterial=new THREE.MeshStandardMaterial({color:'#8ba8a1',roughness:.15,metalness:.35,transparent:true,opacity:.15,depthWrite:false});
    const glass=box(group,w-.18,1.75,.045,glassMaterial,0,1.18,d/2-.1,.01);
    for(const x of [-w/2+.08,w/2-.08])for(const z of [-d/2+.08,d/2-.08])box(group,.10,2.1,.10,gold,x,1.15,z,.02);
    const rooms=data.projects.map((project,index)=>{
      const node=new THREE.Group();node.userData.room=project.slug;group.add(node);
      node.position.set((index%columns-(columns-1)/2)*2.55,.22,(Math.floor(index/columns)-(rows-1)/2)*2.6);
      box(node,2.38,.08,2.40,plaster,0,.03,0,.02);
      const walls=[box(node,2.38,1.9,.075,plaster,0,.98,-1.18,.015),box(node,.075,1.35,2.36,plaster,-1.16,.72,0,.015),box(node,.075,1.35,2.36,plaster,1.16,.72,0,.015)];
      const interior=new THREE.Group();interior.visible=false;node.add(interior);
      box(interior,2.38,.08,4,charcoal,0,.02,.7);
      box(interior,2.38,2.1,.07,charcoal,0,1.05,-1.19);
      box(interior,.075,2.1,4,charcoal,1.16,1.05,.7);
      box(interior,.075,2.1,.65,charcoal,-1.16,1.05,-.875);
      box(interior,.075,2.1,2.35,charcoal,-1.16,1.05,1.525);
      for(const z of [-.55,.35])box(interior,.065,1.85,.065,glow,-1.14,.95,z,.01);
      box(interior,.065,.065,.96,glow,-1.14,1.88,-.1,.01);
      box(interior,.02,.22,3.65,gold,1.10,.15,.65,.005);
      box(interior,2.3,.025,.025,glow,0,1.94,-1.08,.005);
      const doorway=new THREE.Mesh(new THREE.PlaneGeometry(.82,1.8),new THREE.MeshBasicMaterial({color:'#d8bd78',transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));doorway.rotation.y=Math.PI/2;doorway.position.set(-1.14,.95,-.1);doorway.userData.exit=true;interior.add(doorway);
      const accent=box(node,2.25,.025,.035,glow,0,.09,1.11,.006);
      box(node,1,.075,.4,charcoal,0,.48,.43,.015);for(const x of [-.38,.38])box(node,.055,.38,.3,gold,x,.25,.43,.01);
      const frame=box(node,2.13,1.26,.08,gold,0,1.20,-1.10,.025);
      const material=new THREE.MeshBasicMaterial({map:preview(project,index),toneMapped:false});
      const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.03,1.142),material);screen.position.set(0,1.20,-1.05);node.add(screen);
      return {project,node,screen,frame,material,accent,walls,interior,doorway,loaded:false,ready:false};
    });
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w,4),.95),modelSign(data,modelsFor(projects,data.group).findIndex(m=>m.key===data.key)));sign.position.set(0,.21,d/2+.075);sign.rotation.x=-.42;group.add(sign);
    return {data,group,roof,glass,rooms,open:0,w,d,materials:[] as {material:THREE.Material;base:number}[]};
  });
  for(const model of exhibitModels){const seen=new Set<THREE.Material>();model.group.traverse(object=>{
    const material=(object as THREE.Mesh).material;if(material&&!Array.isArray(material)&&!seen.has(material)){seen.add(material);model.materials.push({material,base:material.opacity});}
  });}
  function ensureMedia(model:typeof exhibitModels[number]) {
    for(const room of model.rooms){if(room.loaded)continue;room.loaded=true;const p=room.project;if(!p.src)continue;
      if(!textureCache.has(p.src))textureCache.set(p.src,new Promise((resolve,reject)=>loader.load(p.src!,source=>{
        const image=source.image,c=document.createElement('canvas');c.width=768;c.height=432;const ctx=c.getContext('2d')!;
        const aspect=image.width/image.height,sw=aspect>16/9?image.height*16/9:image.width,sh=sw*9/16;
        ctx.drawImage(image,(image.width-sw)/2,0,sw,sh,0,0,768,432);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;source.dispose();resolve(texture);
      },undefined,reject)));
      void textureCache.get(p.src)!.then(texture=>{room.material.map?.dispose();room.material.map=texture;room.material.needsUpdate=true;room.ready=true;root.dataset.readyPreviews=String(exhibitModels.flatMap(m=>m.rooms).filter(r=>r.ready).length);draw();}).catch(()=>{room.material.map?.dispose();room.material.map=preview(p,0,'Preview unavailable');room.material.needsUpdate=true;root.dataset.previewErrors=String(Number(root.dataset.previewErrors||0)+1);draw();});
    }
  }
  let state:ShowroomState={group:'client'},hoverModel:string|undefined,hoverRoom:string|undefined;
  let paused=motion.matches,lost=false,started=false,frame=0,last=0,elapsed=0,intro=paused?0:.8,yaw=0,targetYaw=0,dragging=false,reading=false;
  let activeModel:typeof exhibitModels[number]|undefined;
  let travel=0,wheelLocked=false,wheelTimer:ReturnType<typeof setTimeout>|undefined;
  const pointerTarget=new THREE.Vector2(),pointerCurrent=new THREE.Vector2();
  const currentEye=new THREE.Vector3(-13,16,38),currentLook=new THREE.Vector3(0,4.3,0),targetEye=new THREE.Vector3(),targetLook=new THREE.Vector3();
  type Flight={curve:THREE.CatmullRomCurve3;fromLook:THREE.Vector3;toLook:THREE.Vector3;progress:number;room?:string;};
  let flight:Flight|undefined;
  function modelFor(location:ShowroomState){return exhibitModels.find(m=>m.data.group===location.group&&m.data.category===location.model);}
  function roomFor(location:ShowroomState){return modelFor(location)?.rooms.find(r=>r.project.slug===location.room);}
  function worldPoint(room:NonNullable<ReturnType<typeof roomFor>>,x:number,y:number,z:number){return room.node.localToWorld(new THREE.Vector3(x,y,z));}
  function updateLayout(){
    const visible=exhibitModels.filter(m=>m.data.group===state.group),columns=Math.min(2,visible.length),rows=Math.ceil(visible.length/columns);
    visible.forEach((model,index)=>{model.group.position.set((index%columns-(columns-1)/2)*8.4,3.45,((rows-1)/2-Math.floor(index/columns))*6.5);model.group.scale.setScalar(.84);model.group.updateMatrixWorld(true);});
    for(const model of exhibitModels)model.group.visible=model.data.group===state.group;
    activeModel=visible.find(m=>m.data.category===state.model);if(activeModel)ensureMedia(activeModel);
  }
  function basePose(location:ShowroomState){
    const eye=new THREE.Vector3(),look=new THREE.Vector3(),mobile=innerWidth<800,model=modelFor(location),room=roomFor(location);
    if(room){eye.copy(worldPoint(room,0,1.16,2.48));look.copy(worldPoint(room,0,1.08,-.9));}
    else if(model){model.group.getWorldPosition(look);look.y+=1;eye.copy(look).add(mobile?new THREE.Vector3(8.4,11.7,19.5):new THREE.Vector3(5.5,6.4,10.5));}
    else{look.set(0,4.1,0);const single=modelsFor(projects,location.group).length===1;eye.set(mobile?(single?-5:-10):(single?-8:-13),mobile?(single?21:29):(single?13:16),mobile?(single?30:40):(single?20:24));eye.z+=intro*12;}
    if(location.room)look.x+=yaw*.15;
    else{eye.sub(look).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(look);}
    return {eye,look};
  }
  function forwardLocation():ShowroomState|undefined {
    if(state.room)return;
    if(activeModel){const room=activeModel.rooms.find(r=>r.project.slug===hoverRoom)||activeModel.rooms[0];return {...state,room:room.project.slug};}
    const model=exhibitModels.find(m=>m.data.group===state.group&&m.data.category===hoverModel)||exhibitModels.find(m=>m.data.group===state.group);
    return model?{group:state.group,model:model.data.category}:undefined;
  }
  function route(from:THREE.Vector3,to:THREE.Vector3,room:NonNullable<ReturnType<typeof roomFor>>,entering:boolean){
    const outside=worldPoint(room,-1.85,1.15,-.1),inside=worldPoint(room,-.85,1.15,-.1);
    return new THREE.CatmullRomCurve3(entering?[from,outside,inside,to]:[from,inside,outside,to],false,'centripetal');
  }
  function pose(){
    const base=basePose(state);targetEye.copy(base.eye);targetLook.copy(base.look);
    if(flight){const t=THREE.MathUtils.smoothstep(flight.progress,0,1);targetEye.copy(flight.curve.getPoint(t));targetLook.lerpVectors(flight.fromLook,flight.toLook,t);}
    if(travel){
      const next=travel<0?(state.model?previousLocation(state):undefined):forwardLocation();
      if(next){const dest=basePose(next),t=Math.abs(travel),room=roomFor(state)||roomFor(next);
        if(room)targetEye.copy(route(base.eye,dest.eye,room,!!next.room).getPoint(t));else targetEye.lerp(dest.eye,t);
        targetLook.lerp(dest.look,t);
      }
    }
    if(!paused&&!reading){
      const scale=state.room ? .018 : .20,depth=state.room ? .018 : .12;
      targetEye.x+=pointerCurrent.x*scale;targetEye.y+=pointerCurrent.y*depth;
      targetLook.x+=pointerCurrent.x*scale*.3;targetLook.y+=pointerCurrent.y*depth*.2;
      if(!state.room){targetEye.x+=Math.sin(elapsed*.16)*.065;targetEye.y+=Math.sin(elapsed*.21)*.045;}
    }
  }
  function updateModels(dt:number){
    for(const model of exhibitModels){
      if(!model.group.visible)continue;
      const selected=model===activeModel,target=selected?1:(!paused&&hoverModel===model.data.category ? .06 : 0);
      model.open=paused?target:THREE.MathUtils.damp(model.open,target,5.5,dt||.016);
      model.roof.position.y=2.3+model.open*2.65;model.roof.position.z=-model.open*.8;model.roof.rotation.x=-model.open*.10;
      const dim=activeModel&&!selected ? .28 : 1;
      for(const item of model.materials){item.material.opacity=item.base*dim;item.material.transparent=item.material.opacity<.99;item.material.depthWrite=item.material.opacity>.95;}
      model.glass.material.opacity=(1-model.open)*.15*dim;model.glass.visible=model.open<.95;
      for(const room of model.rooms){
        const inside=room.project.slug===state.room||room.project.slug===flight?.room;
        room.interior.visible=inside;for(const wall of room.walls)wall.visible=!inside;
        room.screen.visible=room.project.slug!==state.room||!!flight||Math.abs(travel)>.01;room.frame.visible=room.screen.visible;
        room.accent.material.opacity=(!state.room||state.room===room.project.slug||hoverRoom===room.project.slug)?1:.2;
        room.doorway.material.opacity=.10+(!paused?Math.sin(elapsed*.7)*.025:0);
      }
    }
    root.dataset.roofOpen=activeModel?activeModel.open.toFixed(3):'0';
  }
  function draw(){
    if(lost)return;scene.updateMatrixWorld(true);composer.render();root.dataset.rendered='true';
    const settled=currentEye.distanceTo(targetEye)+currentLook.distanceTo(targetLook)<.05&&!flight&&intro<.01&&Math.abs(travel)<.01&&(!activeModel||activeModel.open>.98);
    root.dataset.transitionSettled=String(settled);root.dataset.roomReady=String(!!state.room&&settled);
    root.dataset.cameraX=currentEye.x.toFixed(4);root.dataset.cameraZ=currentEye.z.toFixed(4);root.dataset.ambientTime=elapsed.toFixed(2);
    for(const model of exhibitModels.filter(m=>m.group.visible)){
      const anchor=model.group.position.clone();anchor.y+=1.1;anchor.project(camera);
      const b=root.querySelector<HTMLElement>(`[data-showroom-model="${model.data.category}"]`);
      if(b){b.dataset.worldX=((anchor.x*.5+.5)*canvas.clientWidth).toFixed(1);b.dataset.worldY=((-anchor.y*.5+.5)*canvas.clientHeight).toFixed(1);}
    }
    if(activeModel)for(const room of activeModel.rooms){
      const anchor=room.screen.getWorldPosition(new THREE.Vector3()).project(camera),b=root.querySelector<HTMLElement>(`[data-showroom-room="${room.project.slug}"]`);
      if(b){b.dataset.worldX=((anchor.x*.5+.5)*canvas.clientWidth).toFixed(1);b.dataset.worldY=((-anchor.y*.5+.5)*canvas.clientHeight).toFixed(1);}
    }
    const room=roomFor(state),exit=root.querySelector<HTMLElement>('[data-showroom-exit]')!;
    if(room){const point=worldPoint(room,-1.14,1.05,-.1).project(camera);exit.style.setProperty('--exit-x',`${(point.x*.5+.5)*canvas.clientWidth-130}px`);exit.style.setProperty('--exit-y',`${(-point.y*.5+.5)*canvas.clientHeight}px`);}
    else{exit.style.removeProperty('--exit-x');exit.style.removeProperty('--exit-y');}
  }
  function resize(){const r=root.getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);composer.setSize(r.width,r.height);pose();if(paused||!started){currentEye.copy(targetEye);currentLook.copy(targetLook);}camera.position.copy(currentEye);camera.lookAt(currentLook);draw();if(started)sync();}
  function tick(now:number){
    frame=0;if(paused||!started||document.hidden||lost||options.isIndexOpen())return;
    if(last&&now-last<32){frame=requestAnimationFrame(tick);return;}
    const dt=last?Math.min((now-last)/1000,.1):.016;last=now;elapsed+=dt;intro=Math.max(0,intro-dt*.55);
    if(flight){flight.progress=Math.min(1,flight.progress+dt/1.7);if(flight.progress>=1)flight=undefined;}
    yaw=THREE.MathUtils.damp(yaw,targetYaw,8,dt);pointerCurrent.lerp(pointerTarget,1-Math.exp(-3.8*dt));
    updateModels(dt);pose();currentEye.lerp(targetEye,1-Math.exp(-7*dt));currentLook.lerp(targetLook,1-Math.exp(-7*dt));camera.position.copy(currentEye);camera.lookAt(currentLook);
    dust.rotation.y=elapsed*.008;key.intensity=2.3+Math.sin(elapsed*.32)*.025;draw();
    // Ambient movement remains alive, and sleeps while reading, hidden or in the index.
    if(!reading||flight||root.dataset.transitionSettled!=='true')frame=requestAnimationFrame(tick);
  }
  function sync(){cancelAnimationFrame(frame);frame=0;last=0;root.dataset.motion=paused?'paused':'playing';pause.textContent=paused?'Play motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));if(!paused&&started&&!document.hidden&&!lost&&!options.isIndexOpen())frame=requestAnimationFrame(tick);}
  function settle(){flight=undefined;updateModels(.016);pose();currentEye.copy(targetEye);currentLook.copy(targetLook);camera.position.copy(currentEye);camera.lookAt(currentLook);draw();}
  function setState(next:ShowroomState){
    if(lost){state=next;root.dataset.roomReady='true';return;}
    const previous=state,changed=previous.group!==next.group||previous.model!==next.model||previous.room!==next.room,previousRoom=roomFor(previous);
    state=next;if(changed){targetYaw=0;travel=0;root.dataset.travel='0';root.style.setProperty('--travel','0');if(next.model)intro=0;root.dataset.roomReady='false';}
    updateLayout();
    if(changed&&started&&!paused&&previous.group===next.group&&(previousRoom||roomFor(next))){
      const dest=basePose(next),room=roomFor(next)||previousRoom!;
      flight={curve:route(currentEye.clone(),dest.eye,room,!!next.room),fromLook:currentLook.clone(),toLook:dest.look,progress:0,room:room.project.slug};
    }
    if(paused||!started){yaw=targetYaw;settle();}else sync();
  }
  updateLayout();pose();currentEye.copy(targetEye);currentLook.copy(targetLook);resize();root.dataset.renderer='webgl';pause.hidden=false;
  pause.addEventListener('click',()=>{paused=!paused;if(paused){intro=0;yaw=targetYaw;settle();}sync();});
  motion.addEventListener('change',()=>{paused=motion.matches;intro=0;if(paused)settle();sync();});
  new ResizeObserver(resize).observe(root);document.addEventListener('visibilitychange',sync);document.addEventListener('aklov:showroom-index',sync);
  root.addEventListener('pointerover',event=>{const next=!!(event.target as Element).closest('[data-scene-reading],.installation-media');if(next!==reading){reading=next;if(!reading)sync();}});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function pick(x:number,y:number){
    const r=canvas.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(exhibitModels.filter(m=>m.group.visible).map(m=>m.group),true).filter(hit=>{
      let node:THREE.Object3D|null=hit.object;while(node){if(!node.visible)return false;node=node.parent;}return true;
    });if(!hits[0])return;
    let node:THREE.Object3D|null=hits[0].object,room:string|undefined,category:string|undefined,exit=false;
    while(node){room ||= node.userData.room;category ||= node.userData.model;exit ||= !!node.userData.exit;node=node.parent;}
    return {room,category,exit};
  }
  let gesture:{id:number;x:number;y:number;origin:number;dragged:boolean}|undefined;
  canvas.addEventListener('pointerdown',event=>{if(!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;gesture={id:event.pointerId,x:event.clientX,y:event.clientY,origin:targetYaw,dragged:false};});
  canvas.addEventListener('pointermove',event=>{
    if(gesture&&event.pointerId===gesture.id){const dx=event.clientX-gesture.x;if(Math.abs(dx)>7){gesture.dragged=true;dragging=true;root.dataset.dragging='';canvas.setPointerCapture(event.pointerId);targetYaw=THREE.MathUtils.clamp(gesture.origin-dx/root.clientWidth*1.5,-.8,.8);if(paused){yaw=targetYaw;settle();}else if(!frame)sync();}}
    else if(event.pointerType==='mouse'){
      const rect=canvas.getBoundingClientRect();pointerTarget.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);root.dataset.pointerX=pointerTarget.x.toFixed(3);
      const hit=pick(event.clientX,event.clientY);hoverModel=hit?.category;hoverRoom=hit?.room;canvas.style.cursor=hit?'pointer':'grab';if(!paused&&!frame)sync();
    }
  },{passive:true});
  function end(event:PointerEvent,cancelled=false){
    if(!gesture||gesture.id!==event.pointerId)return;const moved=gesture.dragged;gesture=undefined;dragging=false;delete root.dataset.dragging;
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(moved||cancelled)return;
    const hit=pick(event.clientX,event.clientY);if(hit?.exit){options.retreat();return;}if(!hit?.category||state.room)return;
    if(!activeModel||activeModel.data.category!==hit.category)options.selectModel(hit.category);else if(hit.room)options.selectRoom(hit.room);
  }
  canvas.addEventListener('pointerup',event=>end(event));canvas.addEventListener('pointercancel',event=>end(event,true));canvas.addEventListener('pointerleave',()=>{if(!dragging){hoverModel=hoverRoom=undefined;pointerTarget.set(0,0);if(!paused&&!frame)sync();}});
  root.addEventListener('wheel',event=>{
    if(event.ctrlKey||options.isIndexOpen()||(event.target as Element).closest('[data-scene-reading],.project-exhibit,button,a,.showroom-options,.showroom-toolbar,.showroom-path'))return;
    event.preventDefault();clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{wheelLocked=false;},240);
    const x=wheelDistance(event.deltaX,event.deltaMode,innerHeight),y=wheelDistance(event.deltaY,event.deltaMode,innerHeight);
    if(Math.abs(x)>Math.abs(y)){targetYaw=THREE.MathUtils.clamp(targetYaw-x*.0012,-.8,.8);if(paused){yaw=targetYaw;settle();}else if(!frame)sync();return;}
    if(wheelLocked)return;
    const next=y<0?(state.model?previousLocation(state):undefined):forwardLocation();if(!next)return;
    travel=travelProgress(travel,y);root.style.setProperty('--travel',String(Math.abs(travel)));root.dataset.travel=travel.toFixed(3);
    if(Math.abs(travel)>=1){const leaving=travel<0;wheelLocked=true;travel=0;if(leaving)options.retreat();else if(next.room)options.selectRoom(next.room);else options.selectModel(next.model!);}
    else if(paused)settle();else if(!frame)sync();
  },{passive:false});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);root.dataset.renderer='fallback';root.dataset.roomReady='true';pause.hidden=true;});
  return {setState,hover:(key?:string)=>{hoverModel=key;if(!paused&&!frame)sync();},start:()=>{started=true;if(paused)settle();sync();}};
}
