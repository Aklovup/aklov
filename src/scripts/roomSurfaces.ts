import * as THREE from 'three';
import {CSS3DRenderer,CSS3DObject} from 'three/addons/renderers/CSS3DRenderer.js';
/** Semantic HTML sits behind depth-tested WebGL apertures in the room's real coordinate system. */
export function createRoomSurfaces(root:HTMLElement,scene:THREE.Scene,camera:THREE.PerspectiveCamera){
  const exhibit=root.querySelector<HTMLElement>('[data-exhibit]')!;
  const renderer=new CSS3DRenderer();renderer.domElement.className='world-surfaces';exhibit.append(renderer.domElement);
  const htmlScene=new THREE.Scene();
  const aperture=new THREE.ShaderMaterial({vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'void main(){gl_FragColor=vec4(0.0);}',blending:THREE.NoBlending,depthWrite:true,depthTest:true,side:THREE.FrontSide});
  const specs=[
    {selector:'[data-wall-media]',w:2.03,h:2.03*760/1080,x:0,y:1.18,z:-1.035,rotation:0,pixels:1080},
    {selector:'[data-wall-story]',w:1.72,h:1.72*760/1080,x:1.102,y:1.18,z:.65,rotation:-Math.PI/2,pixels:1080},
    {selector:'[data-wall-door]',w:.32,h:.32*180/500,x:0,y:1.6,z:2.674,rotation:Math.PI,pixels:500},
  ];
  const surfaces=specs.map(spec=>{
    const element=exhibit.querySelector<HTMLElement>(spec.selector)!,object=new CSS3DObject(element);
    htmlScene.add(object);const mask=new THREE.Mesh(new THREE.PlaneGeometry(spec.w,spec.h),aperture);mask.visible=false;scene.add(mask);
    return {spec,element,object,mask};
  });
  const lifted=exhibit.querySelector<HTMLElement>('[data-lift-display]')!,liftObject=new CSS3DObject(lifted);
  htmlScene.add(liftObject);liftObject.visible=false;
  const liftMask=new THREE.Mesh(new THREE.PlaneGeometry(1000,700),aperture);liftMask.visible=false;scene.add(liftMask);
  let node:THREE.Object3D|undefined,flat=innerWidth<800,failed=false;
  let parked=false,savedLiftStyle='';
  let lift:{progress:number;target:number;from:THREE.Vector3;to:THREE.Vector3;rotation:THREE.Quaternion;facing:THREE.Quaternion;scale:THREE.Vector3;targetScale:THREE.Vector3}|undefined;
  function detach(){for(const s of surfaces){s.mask.visible=false;exhibit.append(s.element);s.element.style.removeProperty('display');}liftMask.visible=false;exhibit.append(lifted);lifted.style.removeProperty('display');renderer.domElement.hidden=true;root.dataset.surfaceMode='flat';root.dataset.wallMounted='false';}
  function bind(room?:THREE.Object3D){
    node=room;for(const s of surfaces){s.mask.visible=!!room;s.object.visible=!!room;}
    if(!room){liftMask.visible=false;liftObject.visible=false;lift=undefined;return;}
    room.updateWorldMatrix(true,false);const scale=room.getWorldScale(new THREE.Vector3()).x;
    for(const s of surfaces){
      const position=room.localToWorld(new THREE.Vector3(s.spec.x,s.spec.y,s.spec.z));
      const rotation=room.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),s.spec.rotation));
      s.object.position.copy(position);s.object.quaternion.copy(rotation);s.object.scale.setScalar(s.spec.w*scale/s.spec.pixels);
      s.mask.position.copy(position);s.mask.quaternion.copy(rotation);s.mask.scale.setScalar(scale);
    }
    root.dataset.wallAngle='90';root.dataset.wallMounted='true';root.dataset.surfaceMode='world';renderer.domElement.hidden=false;if(flat||failed)detach();
  }
  // Use a screen-aligned HTML surface once the spatial flight has reached the camera.
  // This keeps long-form text crisp and prevents other CSS3D walls painting over it.
  function park(){
    if(parked||!lift)return;
    liftObject.updateWorldMatrix(true,false);
    const top=liftObject.localToWorld(new THREE.Vector3(-500,350,0)).project(camera),bottom=liftObject.localToWorld(new THREE.Vector3(500,-350,0)).project(camera);
    const x=(top.x+1)*root.clientWidth/2,y=(1-top.y)*root.clientHeight/2,width=(bottom.x-top.x)*root.clientWidth/2;
    const focused=lifted.contains(document.activeElement)?document.activeElement as HTMLElement:undefined;
    savedLiftStyle=lifted.style.cssText;htmlScene.remove(liftObject);root.append(lifted);lifted.style.removeProperty('display');lifted.dataset.resting='true';
    lifted.style.left='0';lifted.style.top='0';lifted.style.transformOrigin='0 0';lifted.style.transform=`translate(${x}px,${y}px) scale(${width/1000})`;
    parked=true;liftMask.visible=false;root.dataset.liftResting='true';focused?.focus({preventScroll:true});
  }
  function unpark(){
    if(!parked)return;
    delete lifted.dataset.resting;lifted.style.cssText=savedLiftStyle;lifted.style.removeProperty('display');htmlScene.add(liftObject);exhibit.append(lifted);parked=false;liftMask.visible=true;root.dataset.liftResting='false';
  }
  function liftPose(){
    if(!lift)return;const t=lift.progress*lift.progress*(3-2*lift.progress);
    liftObject.position.lerpVectors(lift.from,lift.to,t);liftObject.quaternion.slerpQuaternions(lift.rotation,lift.facing,t);liftObject.scale.lerpVectors(lift.scale,lift.targetScale,t);
    // A short, continuous departure along the wall normal, rather than an overlay cut.
    const normal=new THREE.Vector3(0,0,1).applyQuaternion(lift.rotation);liftObject.position.addScaledVector(normal,Math.sin(t*Math.PI)*.06);
    liftMask.position.copy(liftObject.position);liftMask.quaternion.copy(liftObject.quaternion);liftMask.scale.copy(liftObject.scale);
  }
  root.addEventListener('aklov:media-lift',event=>{
    const {open,immediate,kind}=(event as CustomEvent).detail;
    if(!open)unpark();else root.dataset.liftResting='false';
    if(flat||failed||!node){root.dispatchEvent(new CustomEvent('aklov:media-lift-settled',{detail:{open}}));return;}
    if(open){
      const wall=surfaces[kind==='story'?1:0],source=root.querySelector<HTMLElement>(kind==='story'?'[data-wall-story]':'[data-exhibit-stage]')!;
      let x=0,y=0,element:HTMLElement|null=source;
      while(element&&element!==wall.element){x+=element.offsetLeft;y+=element.offsetTop;element=element.offsetParent as HTMLElement|null;}
      wall.object.updateWorldMatrix(true,false);const scale=wall.object.getWorldScale(new THREE.Vector3()).x;
      const from=wall.object.localToWorld(new THREE.Vector3(x+source.offsetWidth/2-540,-(y+source.offsetHeight/2-380),4));
      const distance=1.05,frustumHeight=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      const width=Math.min(frustumHeight*camera.aspect*.86,frustumHeight*Math.max(.35,(root.clientHeight-230)/root.clientHeight)*1000/700);
      const to=new THREE.Vector3(0,-25/root.clientHeight*frustumHeight,-distance).applyQuaternion(camera.quaternion).add(camera.position);
      lift={progress:0,target:1,from,to,rotation:wall.object.quaternion.clone(),facing:camera.quaternion.clone(),scale:new THREE.Vector3(source.offsetWidth*scale/1000,source.offsetHeight*scale/700,scale),targetScale:new THREE.Vector3(width/1000,width/1000,width/1000)};
      liftObject.visible=true;liftMask.visible=true;
    }else if(lift)lift.target=0;
    if(lift&&(immediate||matchMedia('(prefers-reduced-motion: reduce)').matches)){lift.progress=lift.target;liftPose();if(open)park();if(!open){liftObject.visible=false;liftMask.visible=false;}root.dispatchEvent(new CustomEvent('aklov:media-lift-settled',{detail:{open}}));}
  });
  function update(dt:number){
    if(!lift||lift.progress===lift.target)return;
    const direction=Math.sign(lift.target-lift.progress);lift.progress=Math.max(0,Math.min(1,lift.progress+direction*dt/.55));liftPose();
    if(lift.progress===lift.target){if(lift.target)park();if(!lift.target){liftObject.visible=false;liftMask.visible=false;}root.dispatchEvent(new CustomEvent('aklov:media-lift-settled',{detail:{open:!!lift.target}}));}
  }
  function render(){if(node&&!flat&&!failed)renderer.render(htmlScene,camera);}
  function resize(w:number,h:number){renderer.setSize(w,h);const next=w<800;if(next!==flat){flat=next;bind(node);}if(flat||failed)detach();}
  function fallback(){failed=true;detach();}
  return {bind,render,resize,fallback,update,animating:()=>!!lift&&lift.progress!==lift.target};
}
