import type { ShowroomState } from './showroomState';
export function previousLocation(state:ShowroomState):ShowroomState {
  return state.room?{group:state.group,model:state.model}:{group:state.group};
}
export function wheelDistance(delta:number,mode:number,height:number):number {
  return delta*(mode===1?16:mode===2?height:1);
}
export function routeDistance(current:number,pixels:number,length:number,speed=.075):number {
  return Math.max(0,Math.min(length,current+pixels*speed));
}
export function roomExitPixels(x:number,z:number):number {
  return (Math.abs(x)+Math.max(0,2.82-z))*.84/.0065;
}
