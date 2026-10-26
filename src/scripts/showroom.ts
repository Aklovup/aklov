import { createShowroomScene } from './showroomScene';
import { createProjectExhibit } from './projectExhibit';
import { modelsFor, stateFromUrl, urlForState, type ShowroomProject, type ShowroomState } from './showroomState';

export function mountShowroom(root:HTMLElement) {
  const projects:ShowroomProject[]=JSON.parse(root.querySelector('#showroom-data')!.textContent!);
  const index=document.querySelector<HTMLElement>('[data-showroom-index]')!;
  const indexOpen=root.querySelector<HTMLButtonElement>('[data-showroom-index-open]')!;
  const indexClose=index.querySelector<HTMLButtonElement>('[data-showroom-index-close]')!;
  const options=root.querySelector<HTMLElement>('[data-showroom-options]')!;
  const heading=root.querySelector<HTMLElement>('[data-showroom-heading]')!;
  const description=root.querySelector<HTMLElement>('[data-showroom-description]')!;
  const eyebrow=root.querySelector<HTMLElement>('[data-showroom-eyebrow]')!;
  const home=root.querySelector<HTMLButtonElement>('[data-showroom-home]')!;
  const back=root.querySelector<HTMLButtonElement>('[data-showroom-back]')!;
  const category=root.querySelector<HTMLButtonElement>('[data-showroom-category]')!;
  const exit=root.querySelector<HTMLButtonElement>('[data-showroom-exit]')!;
  const status=root.querySelector<HTMLElement>('[data-showroom-status]')!;
  const exhibit=createProjectExhibit(root);
  let state=stateFromUrl(new URL(location.href),projects);
  let scene:ReturnType<typeof createShowroomScene>|undefined;
  index.hidden=true;indexClose.hidden=false;

  function setIndex(open:boolean,focus=true){
    index.hidden=!open;root.inert=open;root.dataset.indexOpen=String(open);
    if(open){index.dataset.userOpen='';if(focus)indexClose.focus({preventScroll:true});}
    else{delete index.dataset.userOpen;if(focus)indexOpen.focus({preventScroll:true});}
    document.dispatchEvent(new CustomEvent('aklov:showroom-index'));
  }
  function apply(focus=false){
    const models=modelsFor(projects,state.group),model=models.find(m=>m.category===state.model),room=model?.projects.find(p=>p.slug===state.room);
    root.dataset.view=room?'project':model?'category':'showroom';root.dataset.collection=state.group;
    root.dataset.model=model?.category||'';root.dataset.room=room?.slug||'';
    for(const button of root.querySelectorAll<HTMLButtonElement>('[data-showroom-type]'))button.setAttribute('aria-pressed',String(button.dataset.showroomType===state.group));
    root.querySelector<HTMLElement>('[data-model-path]')!.hidden=!model;category.textContent=model?.label||'';back.hidden=!model;exit.hidden=!model;
    back.textContent=room?'← Category':'← Showroom';exit.querySelector('[data-exit-label]')!.textContent=room?'Leave room':'Leave building';
    const collection=projects.filter(p=>(p.projectType==='Independent Concept')===(state.group==='concepts'));
    eyebrow.textContent=room?room.projectType:model?`${model.projects.length} project rooms`:`${collection.length} ${state.group==='concepts'?'independent concepts':'client projects'}`;
    heading.textContent=room?.title||model?.label||'Select a model.';
    description.textContent=room?.description||(model?'Select a project room, or scroll forward to enter. Reverse your gesture to return to the showroom.':'Move to look around. Select a model, or scroll forward to approach.');
    const entries=model?model.projects.map((p,i)=>({id:p.slug,label:p.title,count:'',number:i+1,room:true})):models.map((m,i)=>({id:m.category,label:m.label,count:String(m.projects.length).padStart(2,'0'),number:i+1,room:false}));
    options.setAttribute('aria-label',model?'Choose a project room':'Choose a category model');options.style.gridTemplateColumns=innerWidth>800?`repeat(${Math.min(4,entries.length)},minmax(0,1fr))`:'';
    options.replaceChildren(...entries.map(item=>{
      const button=document.createElement('button');button.type='button';button.dataset[item.room?'showroomRoom':'showroomModel']=item.id;
      button.setAttribute('aria-pressed',String(item.room&&item.id===room?.slug));button.setAttribute('aria-label',`${item.room?'Enter project room':'Open category model'}: ${item.label}`);
      const number=document.createElement('span');number.className='option-number';number.textContent=String(item.number).padStart(2,'0');
      const label=document.createElement('span');label.textContent=item.label;const count=document.createElement('span');count.className='option-count';count.textContent=item.count;
      button.append(number,label,count);return button;
    }));
    exhibit.setProject(room?.slug);scene?.setState(state);
    status.textContent=room?`${room.title}. Project exhibition.`:model?`${model.label}. ${model.projects.length} project rooms.`:`${state.group==='concepts'?'Independent concepts':'Client projects'}. ${models.length} category models.`;
    if(focus){if(room)exhibit.focus();else if(model){heading.tabIndex=-1;heading.focus({preventScroll:true});}else options.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});}
  }
  function navigate(next:ShowroomState){
    state=next;setIndex(false,false);
    const url=urlForState(new URL(location.href),state);if(url.href!==location.href)history.pushState(null,'',url);
    window.dispatchEvent(new PopStateEvent('popstate'));apply(true);
  }
  function selectModel(id:string){const model=modelsFor(projects,state.group).find(m=>m.category===id);if(model)navigate({group:state.group,model:model.category});}
  function selectRoom(slug:string){const project=projects.find(p=>p.slug===slug);if(project)navigate({group:project.projectType==='Independent Concept'?'concepts':'client',model:project.primaryCategory,room:slug});}
  function retreat(){if(state.room)navigate({group:state.group,model:state.model});else if(state.model)navigate({group:state.group});}
  window.addEventListener('popstate',()=>{state=stateFromUrl(new URL(location.href),projects);apply();});
  options.addEventListener('click',event=>{const button=(event.target as Element).closest<HTMLButtonElement>('button');if(button?.dataset.showroomModel)selectModel(button.dataset.showroomModel);else if(button?.dataset.showroomRoom)selectRoom(button.dataset.showroomRoom);});
  options.addEventListener('pointerover',event=>scene?.hover((event.target as Element).closest<HTMLElement>('[data-showroom-model]')?.dataset.showroomModel));
  options.addEventListener('pointerleave',()=>scene?.hover());
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-showroom-type]'))button.addEventListener('click',()=>navigate({group:button.dataset.showroomType==='concepts'?'concepts':'client'}));
  home.addEventListener('click',()=>navigate({group:state.group}));category.addEventListener('click',()=>navigate({group:state.group,model:state.model}));back.addEventListener('click',retreat);exit.addEventListener('click',retreat);
  indexOpen.addEventListener('click',()=>setIndex(true));indexClose.addEventListener('click',()=>{state=stateFromUrl(new URL(location.href),projects);setIndex(false);apply();});
  // The original index now enters the same spatial exhibit; it never creates a dialog.
  for(const button of index.querySelectorAll<HTMLButtonElement>('[data-project-open]')){
    button.hidden=false;button.removeAttribute('aria-haspopup');button.removeAttribute('aria-controls');button.textContent='Enter project room ↗';
    const card=button.closest<HTMLElement>('[data-project]')!;card.dataset.canOpen='true';const pending=card.querySelector<HTMLElement>('.details-pending');if(pending)pending.hidden=true;
    button.addEventListener('click',()=>selectRoom(button.dataset.projectOpen!));
    card.addEventListener('click',event=>{if(!(event.target as Element).closest('a,button,video,input,select,textarea'))selectRoom(button.dataset.projectOpen!);});
  }
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||(event.target as Element)?.closest?.('#site-header'))return;
    if(!index.hidden){setIndex(false);return;}
    if(exhibit.collapse())return;retreat();
  });
  const rescue=root.querySelector<HTMLAnchorElement>('[data-arrival-rescue]')!;
  rescue.addEventListener('click',event=>{event.preventDefault();root.dataset.arrival='ready';setIndex(true);});
  const rescueTimer=setTimeout(()=>{rescue.hidden=false;},10000);
  apply();
  scene=createShowroomScene(root,projects,{selectModel,selectRoom,retreat,isIndexOpen:()=>!index.hidden});scene.setState(state);
  root.dataset.ready='true';
  Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,2500))]).then(()=>{
    requestAnimationFrame(()=>{root.dataset.arrival='ready';clearTimeout(rescueTimer);scene?.start();});
  });
  const initial=new URL(location.href);
  if(initial.searchParams.has('category')&&!initial.searchParams.has('model')&&!initial.searchParams.has('room')&&!initial.searchParams.has('project'))setIndex(true,false);
  window.addEventListener('resize',()=>{options.style.gridTemplateColumns=innerWidth>800?`repeat(${Math.min(4,options.children.length)},minmax(0,1fr))`:'';});
}
