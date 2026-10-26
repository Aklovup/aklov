/** Camera-relative floor movement. Only crossing the physical rear opening exits. */
export const ROOM_BOUNDS={left:-1,right:1,front:-.64,back:2.86,doorZ:2.80,doorHalfWidth:.46};
export function moveOnFloor(x:number,z:number,heading:number,pixels:number,strafe=0){
  const distance=pixels*.0032,side=strafe*.0032;
  const nextX=x-Math.sin(heading)*distance+Math.cos(heading)*side;
  const nextZ=z-Math.cos(heading)*distance-Math.sin(heading)*side;
  const crosses=nextZ>=ROOM_BOUNDS.doorZ&&Math.abs(nextX)<ROOM_BOUNDS.doorHalfWidth&&nextZ>z;
  return {x:Math.max(ROOM_BOUNDS.left,Math.min(ROOM_BOUNDS.right,nextX)),z:Math.max(ROOM_BOUNDS.front,Math.min(ROOM_BOUNDS.back,nextZ)),exit:crosses};
}
/** Limit a pathological event without rounding away normal high-resolution trackpad input. */
export function gesturePixels(delta:number,mode:number,height:number){
  return Math.max(-600,Math.min(600,delta*(mode===1?16:mode===2?height:1)));
}
