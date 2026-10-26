import * as THREE from 'three';
import {CSS3DRenderer,CSS3DObject} from 'three/addons/renderers/CSS3DRenderer.js';
/** HTML lies behind the WebGL layer. Depth-tested alpha apertures expose only the real wall surfaces. */
export function createRoomSurfaces(root:HTMLElement,scene:THREE.Scene,camera:THREE.Camera){
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
  let node:THREE.Object3D|undefined;let flat=innerWidth<800,failed=false;
  function detach(){for(const s of surfaces){s.mask.visible=false;exhibit.append(s.element);s.element.style.removeProperty('transform');s.element.style.removeProperty('position');s.element.style.removeProperty('display');}renderer.domElement.hidden=true;root.dataset.surfaceMode='flat';root.dataset.wallMounted='false';}
  function bind(room?:THREE.Object3D){
    node=room;for(const s of surfaces){s.mask.visible=!!room;s.object.visible=!!room;}
    if(!room)return;
    room.updateWorldMatrix(true,false);const scale=room.getWorldScale(new THREE.Vector3()).x;
    for(const s of surfaces){
      const position=room.localToWorld(new THREE.Vector3(s.spec.x,s.spec.y,s.spec.z));
      const rotation=room.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),s.spec.rotation));
      s.object.position.copy(position);s.object.quaternion.copy(rotation);s.object.scale.setScalar(s.spec.w*scale/s.spec.pixels);
      s.mask.position.copy(position);s.mask.quaternion.copy(rotation);s.mask.scale.setScalar(scale);
    }
    root.dataset.wallAngle='90';root.dataset.wallMounted='true';root.dataset.surfaceMode='world';renderer.domElement.hidden=false;if(flat||failed)detach();
  }
  function render(){
    if(!node||flat||failed)return;
    renderer.render(htmlScene,camera);
  }
  function resize(w:number,h:number){renderer.setSize(w,h);const next=w<800;if(next!==flat){flat=next;bind(node);}if(flat||failed)detach();}
  function fallback(){failed=true;detach();}
  return {bind,render,resize,fallback};
}
