interface GestureOptions {
  position:()=>number;
  start:()=>void;
  move:(position:number)=>void;
  release:(projected:number,velocity?:number)=>void;
  tap:(x:number,y:number)=>void;
}
// Horizontal intent belongs to the catalogue; vertical intent stays with the page.
export function bindCatalogueGestures(canvas:HTMLCanvasElement,options:GestureOptions) {
  let pointer:{id:number;x:number;y:number;lastX:number;lastTime:number;origin:number;velocity:number;axis:''|'x'|'y'}|undefined;
  let wheelTimer:ReturnType<typeof setTimeout>|undefined;
  const span=()=>Math.max(180,canvas.clientWidth*(innerWidth<800?.72:.36));
  const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
  canvas.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;
    if(wheelTimer){clearTimeout(wheelTimer);wheelTimer=undefined;options.release(Math.round(options.position()));}
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastTime:performance.now(),origin:options.position(),velocity:0,axis:''};
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(!pointer.axis){
      if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
      pointer.axis=Math.abs(dx)>Math.abs(dy)*1.15?'x':'y';
      if(pointer.axis==='x'){options.start();canvas.setPointerCapture(event.pointerId);}
    }
    if(pointer.axis!=='x')return;
    const now=performance.now(),dt=Math.max(8,now-pointer.lastTime);
    const speed=-(event.clientX-pointer.lastX)/span()/dt*1000;
    pointer.velocity=pointer.velocity*.3+clamp(speed,-5,5)*.7;
    pointer.lastX=event.clientX;pointer.lastTime=now;
    options.move(pointer.origin-dx/span());
  },{passive:true});
  function finish(event:PointerEvent,cancelled=false){
    if(!pointer||event.pointerId!==pointer.id)return;
    const state=pointer;pointer=undefined;
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    if(state.axis==='x'){
      const speed=performance.now()-state.lastTime<100?state.velocity:0;
      let projected=options.position()+(cancelled?0:clamp(speed*.12,-.35,.35));
      const distance=state.x-event.clientX;
      if(!cancelled&&Math.round(projected)===Math.round(state.origin)&&(Math.abs(distance)>span()*.15||Math.abs(speed)>1)){
        projected=Math.round(state.origin)+Math.sign(distance||speed);
      }
      options.release(clamp(projected,Math.round(state.origin)-2,Math.round(state.origin)+2),cancelled?0:speed);
    }else if(!cancelled&&state.axis!== 'y'&&Math.hypot(event.clientX-state.x,event.clientY-state.y)<8){
      options.tap(event.clientX,event.clientY);
    }
  }
  canvas.addEventListener('pointerup',event=>finish(event));
  canvas.addEventListener('pointercancel',event=>finish(event,true));
  canvas.addEventListener('lostpointercapture',event=>{if(pointer?.id===event.pointerId)finish(event,true);});
  canvas.addEventListener('wheel',event=>{
    if(event.ctrlKey||Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
    event.preventDefault();
    if(!wheelTimer)options.start();else clearTimeout(wheelTimer);
    const pixels=event.deltaMode===1?16:event.deltaMode===2?canvas.clientWidth:1;
    options.move(options.position()+event.deltaX*pixels/span());
    wheelTimer=setTimeout(()=>{wheelTimer=undefined;options.release(Math.round(options.position()));},140);
  },{passive:false});
}
