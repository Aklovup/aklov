import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { modelsFor, type ShowroomModel, type ShowroomProject, type ShowroomState } from './showroomState';
import { previousLocation, routeDistance } from './showroomTravel';
import { moveOnFloor,gesturePixels } from './showroomNavigation';
import {mediaSelection} from './mediaSelection';
import {createRoomSurfaces} from './roomSurfaces';
interface Options { selectModel:(category:string)=>void; selectRoom:(slug:string)=>void; retreat:()=>void; isIndexOpen:()=>boolean; }

export function createShowroomScene(root:HTMLElement,projects:ShowroomProject[],options:Options) {
  const canvas=root.querySelector<HTMLCanvasElement>('canvas')!;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const pause=root.querySelector<HTMLButtonElement>('[data-showroom-motion]')!;
  let renderer:THREE.WebGLRenderer;
  try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch {root.dataset.renderer='fallback';root.dataset.roomReady='true';return {setState:(_state:ShowroomState)=>{},hover:(_key?:string)=>{},start:()=>{}};}
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
  const loader=new THREE.TextureLoader();
  const typeface=getComputedStyle(root),displayFont=typeface.getPropertyValue('--display'),sansFont=typeface.getPropertyValue('--sans');
  function preview(project:ShowroomProject,index:number,label=project.src?'Preview loading':'Preview pending') {
    const c=document.createElement('canvas');c.width=512;c.height=288;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#17282a';ctx.fillRect(0,0,512,288);ctx.strokeStyle='#b79d67';ctx.strokeRect(15,15,482,258);ctx.fillStyle='#dfc489';ctx.font=`100px ${displayFont}`;ctx.fillText(String(index+1).padStart(2,'0'),34,150);ctx.fillStyle='#e5e1d3';ctx.font=`16px ${sansFont}`;ctx.fillText(label,35,220);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  function modelSign(model:ShowroomModel,index:number) {
    const c=document.createElement('canvas');c.width=640;c.height=180;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#17282a';ctx.fillRect(0,0,640,180);ctx.fillStyle='#d8bd78';ctx.font=`22px ${sansFont}`;ctx.fillText(`${String(index+1).padStart(2,'0')} / ${model.projects.length} ${model.projects.length===1?'PROJECT':'PROJECTS'}`,26,43);
    ctx.fillStyle='#f5f2ea';ctx.font=`32px ${displayFont}`;const words=model.label.split(' ');let line='',y=99;for(const word of words){if(ctx.measureText(line+' '+word).width>580){ctx.fillText(line,26,y);line=word;y+=38;}else line+=(line?' ':'')+word;}ctx.fillText(line,26,y);
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
      box(interior,.075,2.1,4,charcoal,-1.16,1.05,.7);
      // Rear threshold: backing out crosses a real, finite doorway behind the visitor.
      for(const x of [-.48,.48])box(interior,.065,1.85,.065,glow,x,.95,2.7,.01);
      box(interior,1.02,.065,.065,glow,0,1.88,2.7,.01);
      for(const x of [-.85,.85])box(interior,.62,2.1,.07,charcoal,x,1.05,2.73);
      box(interior,.02,.22,3.65,gold,1.10,.15,.65,.005);
      box(interior,2.3,.025,.025,glow,0,1.99,-1.08,.005);
      const doorway=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.8),new THREE.MeshBasicMaterial({color:'#d8bd78',transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}));doorway.position.set(0,.95,2.7);doorway.userData.exit=true;interior.add(doorway);
      // A permanent frame for the story screen on the perpendicular wall.
      box(interior,.045,1.30,1.82,gold,1.14,1.18,.65,.012);
      const accent=box(node,2.25,.025,.035,glow,0,.09,1.11,.006);
      box(node,1,.075,.4,charcoal,0,.48,.43,.015);for(const x of [-.38,.38])box(node,.055,.38,.3,gold,x,.25,.43,.01);
      const frame=box(node,2.13,1.53,.08,gold,0,1.18,-1.10,.025);
      const material=new THREE.MeshBasicMaterial({map:preview(project,index),toneMapped:false});
      const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.03,2.03*760/1080),material);screen.position.set(0,1.18,-1.05);node.add(screen);
      return {project,node,screen,frame,material,accent,walls,interior,doorway,loaded:false,ready:false};
    });
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w,4),.95),modelSign(data,modelsFor(projects,data.group).findIndex(m=>m.key===data.key)));sign.position.set(0,.21,d/2+.075);sign.rotation.x=-.42;group.add(sign);
    sign.userData.exit=true;return {data,group,roof,glass,rooms,sign,shell:group.children.filter(child=>!rooms.some(room=>room.node===child)),open:0,w,d,materials:[] as {material:THREE.Material;base:number}[]};
  });
  for(const model of exhibitModels){const seen=new Set<THREE.Material>();model.group.traverse(object=>{
    const material=(object as THREE.Mesh).material;if(material&&!Array.isArray(material)&&!seen.has(material)){seen.add(material);model.materials.push({material,base:material.opacity});}
  });}
  const bitmapCache=new Map<string,Promise<HTMLImageElement>>();
  function bitmap(src:string){if(!bitmapCache.has(src))bitmapCache.set(src,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;}));return bitmapCache.get(src)!;}
  async function updatePreview(room:typeof exhibitModels[number]['rooms'][number]){
    const p=room.project,items=p.media?.filter(item=>item.src)||[];
    const layout=mediaSelection.get(p.slug,items.map(item=>item.id),p.initialMedia);
    const version=room.node.userData.previewVersion=(room.node.userData.previewVersion||0)+1;
    const ids=[layout.main,...layout.rail],media=ids.map(id=>items.find(item=>item.id===id)).filter(Boolean);
    if(!media.length){if(p.src){loader.load(p.src,texture=>{texture.colorSpace=THREE.SRGBColorSpace;room.material.map=texture;room.material.needsUpdate=true;room.ready=true;draw();});}return;}
    const images=await Promise.all(media.map(item=>bitmap(item!.src!).catch(()=>undefined)));
    if(room.node.userData.previewVersion!==version)return;
    const c=document.createElement('canvas');c.width=1080;c.height=760;const ctx=c.getContext('2d')!;ctx.fillStyle='#102124';ctx.fillRect(0,0,1080,760);
    ctx.fillStyle='#d8bd78';ctx.font=`22px ${sansFont}`;ctx.fillText(p.projectType,32,38);ctx.fillStyle='#f5f2ea';ctx.font=`40px ${displayFont}`;ctx.fillText(p.title,32,88,1000);
    function imageFit(image:HTMLImageElement|undefined,x:number,y:number,w:number,h:number){if(!image)return;const scale=Math.min(w/image.width,h/image.height);ctx.drawImage(image,x+(w-image.width*scale)/2,y,image.width*scale,image.height*scale);}
    const mainWidth=media.length>1?760:1016;imageFit(images[0],32,160,mainWidth,540);
    if(media.length>1){const h=540/(media.length-1);for(let i=1;i<media.length;i++){ctx.strokeStyle='#bfa363';ctx.strokeRect(818,160+(i-1)*h,230,h-12);imageFit(images[i],824,166+(i-1)*h,218,h-24);}}
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;room.material.map=texture;room.material.needsUpdate=true;room.ready=true;room.node.userData.previewId=layout.main;root.dataset.previewMedia=JSON.stringify(Object.fromEntries(exhibitModels.flatMap(m=>m.rooms).filter(r=>r.node.userData.previewId).map(r=>[r.project.slug,r.node.userData.previewId])));
    root.dataset.readyPreviews=String(exhibitModels.flatMap(m=>m.rooms).filter(r=>r.ready).length);draw();
  }
  function ensureMedia(model:typeof exhibitModels[number]){for(const room of model.rooms){if(room.loaded)continue;room.loaded=true;void updatePreview(room).catch(()=>{root.dataset.previewErrors=String(Number(root.dataset.previewErrors||0)+1);});}}
  root.addEventListener('aklov:media-selection',event=>{const slug=(event as CustomEvent).detail.slug;const room=exhibitModels.flatMap(m=>m.rooms).find(r=>r.project.slug===slug);if(room)void updatePreview(room).catch(()=>{});});
  const surfaces=createRoomSurfaces(root,scene,camera);
  let state:ShowroomState={group:'client'},hoverModel:string|undefined,hoverRoom:string|undefined;
  let paused=motion.matches,lost=false,started=false,frame=0,last=0,elapsed=0,intro=paused?0:.8,yaw=0,targetYaw=0,dragging=false,reading=false;
  let activeModel:typeof exhibitModels[number]|undefined;let recentRoom:string|undefined;
  const roomEye=new THREE.Vector3(0,1.18,1.95);let roomHeading=0,viewHeading=0;let travelCommit=false;
  const pointerTarget=new THREE.Vector2(),pointerCurrent=new THREE.Vector2();
  const currentEye=new THREE.Vector3(-13,16,38),currentLook=new THREE.Vector3(0,4.3,0),targetEye=new THREE.Vector3(),targetLook=new THREE.Vector3();
  type Flight={curve:THREE.CatmullRomCurve3;fromLook:THREE.Vector3;toLook:THREE.Vector3;progress:number;room?:string;};
  let flight:Flight|undefined;
  let walking:{curve:THREE.CatmullRomCurve3;length:number;distance:number;sign:number;fromLook:THREE.Vector3;toLook:THREE.Vector3;destination:ShowroomState}|undefined;
  function modelFor(location:ShowroomState){return exhibitModels.find(m=>m.data.group===location.group&&m.data.category===location.model);}
  function roomFor(location:ShowroomState){return modelFor(location)?.rooms.find(r=>r.project.slug===location.room);}
  function worldPoint(room:NonNullable<ReturnType<typeof roomFor>>,x:number,y:number,z:number){return room.node.localToWorld(new THREE.Vector3(x,y,z));}
  function updateLayout(){
    const visible=exhibitModels.filter(m=>m.data.group===state.group),columns=Math.min(2,visible.length),rows=Math.ceil(visible.length/columns);
    visible.forEach((model,index)=>{model.group.position.set((index%columns-(columns-1)/2)*8.4,3.45,((rows-1)/2-Math.floor(index/columns))*6.5);model.group.scale.setScalar(.84);model.group.updateMatrixWorld(true);});
    activeModel=visible.find(m=>m.data.category===state.model);if(activeModel)ensureMedia(activeModel);
    surfaces.bind(roomFor(state)?.node);
  }
  function basePose(location:ShowroomState){
    const eye=new THREE.Vector3(),look=new THREE.Vector3(),mobile=innerWidth<800,model=modelFor(location),room=roomFor(location);
    if(room){eye.copy(room.node.localToWorld(roomEye.clone()));look.copy(worldPoint(room,roomEye.x-Math.sin(roomHeading)*3,roomEye.y,roomEye.z-Math.cos(roomHeading)*3));}
    else if(model){model.group.getWorldPosition(look);look.y+=1;eye.copy(look).add(mobile?new THREE.Vector3(8.4,11.7,19.5):new THREE.Vector3(5.5,6.4,10.5));}
    else{look.set(0,4.1,0);const single=modelsFor(projects,location.group).length===1;eye.set(mobile?(single?-5:-10):(single?-8:-13),mobile?(single?21:29):(single?13:16),mobile?(single?30:40):(single?20:24));eye.z+=intro*12;}
    if(!location.room)eye.sub(look).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(look);
    return {eye,look};
  }
  function forwardLocation():ShowroomState|undefined {
    if(state.room)return;
    if(activeModel){const room=activeModel.rooms.find(r=>r.project.slug===hoverRoom)||activeModel.rooms.find(r=>r.project.slug===recentRoom)||activeModel.rooms[0];return {...state,room:room.project.slug};}
    const model=exhibitModels.find(m=>m.data.group===state.group&&m.data.category===hoverModel)||exhibitModels.find(m=>m.data.group===state.group);
    return model?{group:state.group,model:model.data.category}:undefined;
  }
  function route(from:THREE.Vector3,to:THREE.Vector3,room:NonNullable<ReturnType<typeof roomFor>>,entering:boolean){
    const outside=worldPoint(room,0,1.22,3.15),inside=worldPoint(room,0,1.22,2.35);
    return new THREE.CatmullRomCurve3(entering?[from,outside,inside,to]:[from,inside,outside,to],false,'centripetal');
  }
  function pose(){
    const base=basePose(state);targetEye.copy(base.eye);targetLook.copy(base.look);
    if(flight){const t=THREE.MathUtils.smoothstep(flight.progress,0,1);targetEye.copy(flight.curve.getPoint(t));targetLook.lerpVectors(flight.fromLook,flight.toLook,t);}
    if(walking){const t=walking.distance/walking.length;targetEye.copy(walking.curve.getPointAt(t));targetLook.lerpVectors(walking.fromLook,walking.toLook,t);}
    if(!state.room&&!paused&&!reading){targetEye.x+=pointerCurrent.x*.12+Math.sin(elapsed*.16)*.035;targetLook.x+=pointerCurrent.x*.06;targetEye.y+=Math.sin(elapsed*.21)*.025;}
  }
  function updateModels(dt:number){
    const activeRoom=roomFor(state),local=activeRoom?activeRoom.node.worldToLocal(currentEye.clone()):undefined;
    const inside=!!local&&local.x>-1.18&&local.x<1.18&&local.z>-.95&&local.z<2.8&&local.y<2.2;
    root.dataset.insideRoom=String(inside);root.dataset.visibleRoom=inside?activeRoom!.project.slug:'';
    for(const model of exhibitModels){
      model.group.visible=model.data.group===state.group&&(!inside||model===activeModel);if(!model.group.visible)continue;
      const selected=model===activeModel,target=selected?1:(!paused&&hoverModel===model.data.category ? .06 : 0);
      model.open=paused?target:THREE.MathUtils.damp(model.open,target,5.5,dt||.016);
      model.roof.position.y=2.3+model.open*2.65;model.roof.position.z=-model.open*.8;model.roof.rotation.x=-model.open*.10;
      for(const object of model.shell)object.visible=!inside;
      const dim=activeModel&&!selected ? .28 : 1;
      for(const item of model.materials){item.material.opacity=item.base*dim;item.material.transparent=item.material.opacity<.99;item.material.depthWrite=item.material.opacity>.95;}
      model.glass.material.opacity=(1-model.open)*.15*dim;model.glass.visible=!inside&&model.open<.95;
      for(const room of model.rooms){
        room.node.visible=!inside||room===activeRoom;
        const interior=room.project.slug===state.room||room.project.slug===flight?.room;room.interior.visible=interior;for(const wall of room.walls)wall.visible=!interior;
        room.screen.visible=true;room.frame.visible=true;
        room.doorway.material.opacity=.07+(!paused?Math.sin(elapsed*.7)*.02:0);
      }
    }
    root.dataset.roofOpen=activeModel?activeModel.open.toFixed(3):'0';
  }
  function draw(){
    if(lost)return;
    scene.updateMatrixWorld(true);surfaces.render();
    if(state.room){scene.background=null;renderer.setClearColor('#18292b',0);renderer.render(scene,camera);}
    else{scene.background=new THREE.Color('#18292b');renderer.setClearColor('#18292b',1);composer.render();}
    root.dataset.rendered='true';
    const settled=currentEye.distanceTo(targetEye)+currentLook.distanceTo(targetLook)<.06&&!flight&&intro<.01;
    root.dataset.transitionSettled=String(settled);root.dataset.roomReady=String(!!state.room&&settled);
    root.dataset.roomX=roomEye.x.toFixed(4);root.dataset.roomZ=roomEye.z.toFixed(4);root.dataset.roomHeading=roomHeading.toFixed(4);
    root.dataset.cameraX=currentEye.x.toFixed(4);root.dataset.cameraZ=currentEye.z.toFixed(4);root.dataset.ambientTime=elapsed.toFixed(2);
    for(const model of exhibitModels.filter(m=>m.group.visible)){
      const anchor=model.group.position.clone();anchor.y+=1.1;anchor.project(camera);const b=root.querySelector<HTMLElement>(`[data-showroom-model="${model.data.category}"]`);
      if(b){b.dataset.worldX=((anchor.x*.5+.5)*canvas.clientWidth).toFixed(1);b.dataset.worldY=((-anchor.y*.5+.5)*canvas.clientHeight).toFixed(1);}
    }
    if(activeModel)for(const room of activeModel.rooms){const anchor=room.screen.getWorldPosition(new THREE.Vector3()).project(camera),b=root.querySelector<HTMLElement>(`[data-showroom-room="${room.project.slug}"]`);if(b){b.dataset.worldX=((anchor.x*.5+.5)*canvas.clientWidth).toFixed(1);b.dataset.worldY=((-anchor.y*.5+.5)*canvas.clientHeight).toFixed(1);}}
    const room=roomFor(state);root.dataset.exitDistance=room?(Math.hypot(roomEye.x,Math.max(0,2.80-roomEye.z))*.84).toFixed(3):walking?(walking.length-walking.distance).toFixed(3):'0';
  }
  function resize(){const r=root.getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);composer.setSize(r.width,r.height);surfaces.resize(r.width,r.height);pose();if(paused||!started){currentEye.copy(targetEye);currentLook.copy(targetLook);}camera.position.copy(currentEye);camera.lookAt(currentLook);updateModels(.016);draw();if(started)sync();}
  function needsFrame(){return !!flight||surfaces.animating()||currentEye.distanceTo(targetEye)+currentLook.distanceTo(targetLook)>.002||Math.abs(yaw-targetYaw)>.001||(!paused&&!reading&&root.dataset.mediaLift!=='open');}
  function tick(now:number){
    frame=0;if(!started||document.hidden||lost||options.isIndexOpen())return;
    if(last&&now-last<15){frame=requestAnimationFrame(tick);return;}
    const dt=last?Math.min((now-last)/1000,.04):1/60;last=now;
    if(!paused){elapsed+=dt;intro=Math.max(0,intro-dt*.55);}
    const lifting=root.dataset.mediaLift==='open'||root.dataset.mediaLift==='closing';
    if(!lifting){
      if(flight){flight.progress=Math.min(1,flight.progress+dt/1.7);if(flight.progress>=1)flight=undefined;}
      yaw=THREE.MathUtils.damp(yaw,targetYaw,10,dt);pointerCurrent.lerp(pointerTarget,1-Math.exp(-5*dt));pose();
      currentEye.lerp(targetEye,1-Math.exp(-11*dt));
      const room=roomFor(state);
      if(room&&!flight&&!walking){viewHeading=THREE.MathUtils.damp(viewHeading,roomHeading,12,dt);const direction=new THREE.Vector3(-Math.sin(viewHeading),0,-Math.cos(viewHeading)).applyQuaternion(room.node.getWorldQuaternion(new THREE.Quaternion()));currentLook.copy(currentEye).addScaledVector(direction,3*.84);}
      else currentLook.lerp(targetLook,1-Math.exp(-10*dt));
      camera.position.copy(currentEye);camera.lookAt(currentLook);
    }
    surfaces.update(dt);updateModels(dt);dust.rotation.y=elapsed*.008;key.intensity=2.3+Math.sin(elapsed*.32)*.025;draw();
    if(walking&&walking.distance>=walking.length&&currentEye.distanceTo(targetEye)<.025)finishWalking();
    if(needsFrame())frame=requestAnimationFrame(tick);
  }
  function sync(){
    root.dataset.motion=paused?'paused':'playing';pause.textContent=paused?'Play motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));
    if((!started||document.hidden||lost||options.isIndexOpen())){cancelAnimationFrame(frame);frame=0;return;}
    if(!frame){last=0;frame=requestAnimationFrame(tick);}
  }
  function settle(){flight=undefined;viewHeading=roomHeading;pose();currentEye.copy(targetEye);currentLook.copy(targetLook);camera.position.copy(currentEye);camera.lookAt(currentLook);updateModels(1/60);draw();}
  function respond(){if(motion.matches)settle();else{pose();sync();}}
  function setState(next:ShowroomState){
    if(lost){state=next;root.dataset.roomReady='true';return;}
    const previous=state,changed=previous.group!==next.group||previous.model!==next.model||previous.room!==next.room,previousRoom=roomFor(previous);
    if(previous.room&&!next.room)recentRoom=previous.room;state=next;if(changed){targetYaw=0;walking=undefined;root.style.setProperty('--travel','0');if(next.model)intro=0;root.dataset.roomReady='false';roomEye.set(0,1.18,1.95);roomHeading=0;viewHeading=0;root.dataset.roomStation='overview';}
    updateLayout();canvas.style.pointerEvents=next.room?'none':'auto';root.querySelector<HTMLElement>('[data-showroom-exit]')!.hidden=root.dataset.surfaceMode==='flat'?!next.model:true;
    if(changed&&!travelCommit&&started&&!motion.matches&&previous.group===next.group&&(previousRoom||roomFor(next))){const dest=basePose(next),room=roomFor(next)||previousRoom!;flight={curve:route(currentEye.clone(),dest.eye,room,!!next.room),fromLook:currentLook.clone(),toLook:dest.look,progress:0,room:room.project.slug};}
    if(motion.matches||!started||travelCommit){yaw=targetYaw;settle();}else sync();
  }
  function station(name:string){
    const room=roomFor(state);if(!room)return;
    root.dataset.roomStation=name;walking=undefined;
    if(name==='story'){roomEye.set(-1,1.18,.65);roomHeading=-Math.PI/2;}
    else if(name==='door'){roomEye.set(0,1.2,1.7);roomHeading=Math.PI;}
    else{roomEye.set(0,1.18,1.95);roomHeading=0;}
    flight=undefined;respond();
  }
  function walkRoom(pixels:number,strafe=0){
    const room=roomFor(state);if(!room)return;
    if(flight&&root.dataset.insideRoom!=='true'){if(pixels<0)options.retreat();return;}
    flight=undefined;
    const next=moveOnFloor(roomEye.x,roomEye.z,roomHeading,pixels,strafe);roomEye.set(next.x,1.18,next.z);root.dataset.roomStation='walking';
    if(next.exit){options.retreat();return;}
    respond();
  }
  function finishWalking(){
    if(!walking)return;const destination=walking.destination;walking=undefined;travelCommit=true;if(destination.model)options.selectModel(destination.model);else options.retreat();travelCommit=false;
  }
  function walkOutside(pixels:number){
    if(!pixels)return;
    if(!walking){
      const destination=pixels<0?(state.model?previousLocation(state):undefined):forwardLocation();if(!destination)return;
      if(destination.room){options.selectRoom(destination.room);return;}
      const dest=basePose(destination),from=currentEye.clone(),points=[from,from.clone().lerp(dest.eye,.5),dest.eye];flight=undefined;
      const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');walking={curve,length:Math.max(curve.getLength(),.01),distance:0,sign:Math.sign(pixels),fromLook:currentLook.clone(),toLook:dest.look,destination};
    }
    walking.distance=routeDistance(walking.distance,pixels*walking.sign,walking.length);root.style.setProperty('--travel',String(walking.distance/walking.length));
    const complete=walking.distance>=walking.length,atStart=walking.distance===0&&pixels*walking.sign<0,destination=walking.destination;
    respond();if(complete&&motion.matches)finishWalking();else if(atStart)walking=undefined;
  }
  updateLayout();pose();currentEye.copy(targetEye);currentLook.copy(targetLook);resize();root.dataset.renderer='webgl';pause.hidden=false;
  pause.addEventListener('click',()=>{paused=!paused;if(paused){intro=0;yaw=targetYaw;settle();}sync();});
  motion.addEventListener('change',()=>{paused=motion.matches;intro=0;if(paused)settle();sync();});
  new ResizeObserver(resize).observe(root);document.addEventListener('visibilitychange',sync);document.addEventListener('aklov:showroom-index',sync);
  root.addEventListener('aklov:room-station',event=>station((event as CustomEvent).detail));root.addEventListener('aklov:room-exit',()=>options.retreat());
  root.addEventListener('aklov:media-lift',event=>{
    if((event as CustomEvent).detail.open){flight=undefined;walking=undefined;const room=roomFor(state);if(room){roomEye.copy(room.node.worldToLocal(currentEye.clone()));roomHeading=viewHeading;targetEye.copy(currentEye);targetLook.copy(currentLook);}}
    sync();
  });
  root.addEventListener('pointerover',event=>{const next=!!(event.target as Element).closest('.story-wall');if(next!==reading){reading=next;sync();}});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function pick(x:number,y:number){const r=canvas.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(exhibitModels.filter(m=>m.group.visible).map(m=>m.group),true).filter(hit=>{let n:THREE.Object3D|null=hit.object;while(n){if(!n.visible)return false;n=n.parent;}return true;});if(!hits[0])return;let n:THREE.Object3D|null=hits[0].object,room:string|undefined,category:string|undefined,exit=false;while(n){room ||= n.userData.room;category ||= n.userData.model;exit ||= !!n.userData.exit;n=n.parent;}return {room,category,exit};}
  let gesture:{id:number;x:number;y:number;lastX:number;lastY:number;dragged:boolean;target:Element}|undefined,keyboardNavigation=false,suppressClickUntil=0;
  const interactive=(e:Event)=>(e.target as Element).closest('button,a,input,select,textarea,video');
  const lifted=()=>root.dataset.mediaLift==='open'||root.dataset.mediaLift==='closing';
  const flat=()=>root.dataset.surfaceMode==='flat'||root.dataset.renderer==='fallback';
  function clearGesture(){if(gesture&&root.hasPointerCapture(gesture.id))root.releasePointerCapture(gesture.id);gesture=undefined;dragging=false;delete root.dataset.dragging;}
  root.addEventListener('pointerdown',event=>{
    keyboardNavigation=false;if(lifted()||flat()||(event.pointerType==='mouse'&&event.button!==0)||(event.target as Element).closest('input,select,textarea'))return;
    clearGesture();gesture={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,dragged:false,target:event.target as Element};
  });
  root.addEventListener('pointermove',event=>{
    if(lifted())return;
    if(gesture&&event.pointerId===gesture.id){
      const dx=event.clientX-gesture.lastX,dy=gesture.lastY-event.clientY;
      if(!gesture.dragged&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<7)return;
      gesture.dragged=true;dragging=true;root.dataset.dragging='';if(!root.hasPointerCapture(event.pointerId))root.setPointerCapture(event.pointerId);
      gesture.lastX=event.clientX;gesture.lastY=event.clientY;event.preventDefault();flight=undefined;
      if(state.room){roomHeading-=dx*.0032;if(Math.abs(dy)>Math.abs(dx)*.5)walkRoom(dy);else respond();}
      else{targetYaw=THREE.MathUtils.clamp(targetYaw-dx*.003,-1.25,1.25);if(Math.abs(dy)>Math.abs(dx)*.5)walkOutside(dy);else respond();}
    }else if(event.pointerType==='mouse'){
      pointerTarget.set(event.clientX/root.clientWidth*2-1,1-event.clientY/root.clientHeight*2);root.dataset.pointerX=pointerTarget.x.toFixed(3);
      if(!state.room){const hit=pick(event.clientX,event.clientY);hoverModel=hit?.category;hoverRoom=hit?.room;}if(!paused)sync();
    }
  },{passive:false});
  function end(event:PointerEvent,cancelled=false){
    if(!gesture||gesture.id!==event.pointerId)return;const moved=gesture.dragged;clearGesture();if(moved){suppressClickUntil=performance.now()+350;return;}
    if(cancelled||interactive(event)||state.room||lifted())return;
    const hit=pick(event.clientX,event.clientY);if(!hit?.category)return;if(hit.exit&&activeModel?.data.category===hit.category)options.retreat();else if(!activeModel||activeModel.data.category!==hit.category)options.selectModel(hit.category);else if(hit.room)options.selectRoom(hit.room);
  }
  root.addEventListener('pointerup',event=>end(event));root.addEventListener('pointercancel',event=>end(event,true));root.addEventListener('lostpointercapture',event=>{if(gesture?.id===event.pointerId){gesture=undefined;dragging=false;delete root.dataset.dragging;}});
  window.addEventListener('blur',clearGesture);
  document.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
  root.addEventListener('wheel',event=>{
    if(event.ctrlKey||options.isIndexOpen()||lifted()||flat()||(event.target as Element).closest('input,select,textarea'))return;
    event.preventDefault();clearGesture();
    const x=gesturePixels(event.deltaX,event.deltaMode,innerHeight),y=gesturePixels(event.deltaY,event.deltaMode,innerHeight);
    if(Math.abs(x)>Math.abs(y)){flight=undefined;if(state.room){if(event.shiftKey)walkRoom(0,x);else{roomHeading-=x*.0025;respond();}}else{targetYaw=THREE.MathUtils.clamp(targetYaw-x*.0016,-1.25,1.25);respond();}return;}
    if(state.room)walkRoom(y);else walkOutside(y);
  },{passive:false});
  root.addEventListener('click',event=>{
    if(!state.room||lifted()||flat()||!(event.target as Element).closest('[data-wall-story]')||(event.target as Element).closest('a'))return;
    const angle=Math.atan2(Math.sin(roomHeading+Math.PI/2),Math.cos(roomHeading+Math.PI/2));
    if(Math.abs(angle)>.08||Math.abs(roomEye.z-.65)>.12||roomEye.x>-.5)station('story');
  });
  root.addEventListener('focusin',event=>{if(!keyboardNavigation||!state.room||lifted()||root.dataset.restoringFocus)return;const target=(event.target as Element).closest('[data-wall-story],[data-wall-media]');const name=target?.hasAttribute('data-wall-story')?'story':'media';if(target&&root.dataset.roomStation!==name)station(name);});
  root.addEventListener('keydown',event=>{
    if(event.key==='Tab')keyboardNavigation=true;if(!state.room||lifted()||flat()||(event.target as Element).closest('input,select,textarea'))return;
    const key=event.key.toLowerCase();if(key==='arrowleft'||key==='arrowright'){event.preventDefault();roomHeading+=(key==='arrowleft'?1:-1)*.18;flight=undefined;respond();}
    else if(key==='arrowup'||key==='arrowdown'||key==='w'||key==='s'){event.preventDefault();walkRoom(key==='arrowup'||key==='w'?65:-65);}
    else if(key==='a'||key==='d'){event.preventDefault();walkRoom(0,key==='a'?-65:65);}
  });
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);surfaces.fallback();root.dataset.renderer='fallback';root.dataset.roomReady='true';root.querySelector<HTMLElement>('[data-showroom-exit]')!.hidden=!state.model;pause.hidden=true;});
  return {setState,hover:(key?:string)=>{hoverModel=key;if(!paused&&!frame)sync();},start:()=>{started=true;for(const model of exhibitModels){model.sign.material=modelSign(model.data,modelsFor(projects,model.data.group).findIndex(m=>m.key===model.data.key));if(model===activeModel)for(const room of model.rooms)void updatePreview(room).catch(()=>{});}if(paused)settle();sync();}};
}
