/** Keep layout, camera framing and physical render size in agreement. */
export function compactShowroom(width:number,height:number,coarse=false){
  return width<=1000||height<=600||(coarse&&width<=1200);
}
export function showroomQuality(width:number,height:number,dpr:number,compact:boolean){
  const pixels=Math.max(1,width)*Math.max(1,height),budget=compact?3_000_000:6_000_000;
  return {pixelRatio:Math.min(Math.max(.5,dpr||1),compact?2.5:2,Math.sqrt(budget/pixels)),postProcessing:!compact};
}
/** Extents have already been projected onto the camera's horizontal/vertical axes. */
export function framingDistance(horizontal:number,vertical:number,depth:number,aspect:number,fov=42){
  const tangent=Math.tan(fov*Math.PI/360);
  return Math.max(horizontal/(2*tangent*Math.max(.1,aspect)),vertical/(2*tangent))*1.16+depth/2;
}
