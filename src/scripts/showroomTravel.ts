import type { ShowroomState } from './showroomState';
export function previousLocation(state:ShowroomState):ShowroomState {
  return state.room?{group:state.group,model:state.model}:{group:state.group};
}
export function wheelDistance(delta:number,mode:number,height:number):number {
  return delta*(mode===1?16:mode===2?height:1);
}
export function travelProgress(current:number,pixels:number):number {
  return Math.max(-1,Math.min(1,current+pixels/650));
}
