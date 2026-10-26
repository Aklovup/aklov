import * as THREE from 'three';
// Neighbours soften within their own surface; the architecture remains in focus.
export function catalogueMaterial(texture:THREE.Texture) {
  return new THREE.ShaderMaterial({
    transparent:true,depthWrite:true,toneMapped:false,
    uniforms:{uMap:{value:texture},uTexel:{value:new THREE.Vector2(1/512,1/288)},uBlur:{value:0},uOpacity:{value:1},uCrop:{value:new THREE.Vector4(1,1,0,0)},uFog:{value:new THREE.Color('#3d4b4a')}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`
      precision highp float;
      uniform sampler2D uMap;
      uniform vec2 uTexel;
      uniform float uBlur;
      uniform float uOpacity;
      uniform vec4 uCrop;
      uniform vec3 uFog;
      varying vec2 vUv;
      void main(){
        vec2 uv=vUv*uCrop.xy+uCrop.zw;
        vec2 d=uTexel*uBlur;
        vec3 c=texture2D(uMap,uv).rgb*.25;
        c+=(texture2D(uMap,uv+vec2(d.x,0.)).rgb+texture2D(uMap,uv-vec2(d.x,0.)).rgb+texture2D(uMap,uv+vec2(0.,d.y)).rgb+texture2D(uMap,uv-vec2(0.,d.y)).rgb)*.125;
        c+=(texture2D(uMap,uv+d).rgb+texture2D(uMap,uv-d).rgb+texture2D(uMap,uv+vec2(d.x,-d.y)).rgb+texture2D(uMap,uv+vec2(-d.x,d.y)).rgb)*.0625;
        c=mix(c,uFog,(1.-uOpacity)*.2);
        gl_FragColor=vec4(c,uOpacity);
      }
    `
  });
}
