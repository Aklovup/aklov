import { createShowroomScene } from './showroomScene';
import { modelsFor, stateFromUrl, urlForState, type ShowroomProject, type ShowroomState } from './showroomState';
export function mountShowroom(root:HTMLElement) {
  const projects:ShowroomProject[]=JSON.parse(root.querySelector('#showroom-data')!.textContent!);
  const index=document.querySelector<HTMLDialogElement>('[data-showroom-index]')!;
  const indexOpen=root.querySelector<HTMLButtonElement>('[data-showroom-index-open]')!;
  const indexClose=index.querySelector<HTMLButtonElement>('[data-showroom-index-close]')!;
  const dialog=document.querySelector<HTMLDialogElement>('[data-project-dialog]')!;
  const options=root.querySelector<HTMLElement>('[data-showroom-options]')!;
  const heading=root.querySelector<HTMLElement>('[data-showroom-heading]')!;
  const description=root.querySelector<HTMLElement>('[data-showroom-description]')!;
  const eyebrow=root.querySelector<HTMLElement>('[data-showroom-eyebrow]')!;
  const caseButton=root.querySelector<HTMLButtonElement>('[data-showroom-case]')!;
  const home=root.querySelector<HTMLButtonElement>('[data-showroom-home]')!;
  const back=root.querySelector<HTMLButtonElement>('[data-showroom-back]')!;
  const category=root.querySelector<HTMLButtonElement>('[data-showroom-category]')!;
  const status=root.querySelector<HTMLElement>('[data-showroom-status]')!;
  let state=stateFromUrl(new URL(location.href),projects),worldOpener=false;
  let scene:{setState:(state:ShowroomState)=>void;hover:(key?:string)=>void}|undefined;
  if(index.open)index.close();indexClose.hidden=false;
  function apply(focus=false) {
    const models=modelsFor(projects,state.group),model=models.find(m=>m.category===state.model),room=model?.projects.find(p=>p.slug===state.room);
    root.dataset.view=room?'project':model?'category':'showroom';root.dataset.collection=state.group;
    root.dataset.model=model?.category||'';root.dataset.room=room?.slug||'';
    for(const button of root.querySelectorAll<HTMLButtonElement>('[data-showroom-type]'))button.setAttribute('aria-pressed',String(button.dataset.showroomType===state.group));
    root.querySelector<HTMLElement>('[data-model-path]')!.hidden=!model;category.textContent=model?.label||'';back.hidden=!model;
    back.textContent=room?'← Category':'← Showroom';
    const collection=projects.filter(p=>(p.projectType==='Independent Concept')===(state.group==='concepts'));
    eyebrow.textContent=room?room.projectType:model?`${model.projects.length} ${model.projects.length===1?'project room':'project rooms'}`:`${collection.length} ${state.group==='concepts'?'independent concepts':'client projects'}`;
    heading.textContent=room?.title||model?.label||'Select a model.';
    description.textContent=room?.description||(model?'The roof opens to reveal its project rooms. Select a room to inspect the project.':'Choose a category model to explore its project rooms.');
    caseButton.hidden=!room;caseButton.setAttribute('aria-label',room?`View project: ${room.title}`:'View project');
    const entries=model?model.projects.map((p,i)=>({id:p.slug,label:p.title,count:'',number:i+1,room:true})):models.map((m,i)=>({id:m.category,label:m.label,count:String(m.projects.length).padStart(2,'0'),number:i+1,room:false}));
    options.setAttribute('aria-label',model?'Choose a project room':'Choose a category model');options.style.gridTemplateColumns=innerWidth>800?`repeat(${Math.min(4,entries.length)},minmax(0,1fr))`:'';
    options.replaceChildren(...entries.map(item=>{
      const button=document.createElement('button');button.type='button';button.dataset[item.room?'showroomRoom':'showroomModel']=item.id;
      button.setAttribute('aria-pressed',String(item.room&&item.id===room?.slug));button.setAttribute('aria-label',`${item.room?'Inspect project room':'Open category model'}: ${item.label}`);
      const number=document.createElement('span');number.className='option-number';number.textContent=String(item.number).padStart(2,'0');
      const label=document.createElement('span');label.textContent=item.label;const count=document.createElement('span');count.className='option-count';count.textContent=item.count;
      button.append(number,label,count);return button;
    }));
    scene?.setState(state);
    status.textContent=room?`${room.title}. Project room selected.`:model?`${model.label}. ${model.projects.length} project rooms.`:`${state.group==='concepts'?'Independent concepts':'Client projects'}. ${models.length} category models.`;
    if(focus){if(model){heading.tabIndex=-1;heading.focus({preventScroll:true});}else options.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});}
  }
  function navigate(next:ShowroomState) {
    state=next;const url=urlForState(new URL(location.href),state);
    if(url.href!==location.href)history.pushState(null,'',url);
    window.dispatchEvent(new PopStateEvent('popstate'));apply(true);
  }
  function selectModel(id:string){const model=modelsFor(projects,state.group).find(m=>m.category===id);if(model)navigate({group:state.group,model:model.category});}
  function selectRoom(slug:string){const model=modelsFor(projects,state.group).find(m=>m.category===state.model);if(model?.projects.some(p=>p.slug===slug))navigate({...state,room:slug});}
  function openProject(){if(!state.room)return;const trigger=document.querySelector<HTMLButtonElement>(`[data-project-open="${state.room}"]`);if(trigger&&!trigger.hidden){worldOpener=true;trigger.click();}}
  function returnFocus(){if(!worldOpener||dialog.open||new URL(location.href).searchParams.has('project'))return;worldOpener=false;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!dialog.open)caseButton.focus({preventScroll:true});}));}
  dialog.addEventListener('close',returnFocus);
  window.addEventListener('popstate',()=>{state=stateFromUrl(new URL(location.href),projects);apply();returnFocus();});
  options.addEventListener('click',event=>{const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button)return;if(button.dataset.showroomModel)selectModel(button.dataset.showroomModel);else if(button.dataset.showroomRoom)selectRoom(button.dataset.showroomRoom);});
  options.addEventListener('pointerover',event=>{const button=(event.target as Element).closest<HTMLElement>('[data-showroom-model]');scene?.hover(button?.dataset.showroomModel);});
  options.addEventListener('pointerleave',()=>scene?.hover());
  for(const button of root.querySelectorAll<HTMLButtonElement>('[data-showroom-type]'))button.addEventListener('click',()=>navigate({group:button.dataset.showroomType==='concepts'?'concepts':'client'}));
  home.addEventListener('click',()=>navigate({group:state.group}));category.addEventListener('click',()=>navigate({group:state.group,model:state.model}));
  back.addEventListener('click',()=>navigate(state.room?{group:state.group,model:state.model}:{group:state.group}));caseButton.addEventListener('click',openProject);
  indexOpen.addEventListener('click',()=>{index.dataset.userOpen='';index.showModal();document.dispatchEvent(new CustomEvent('aklov:showroom-index'));indexClose.focus();});
  indexClose.addEventListener('click',()=>index.close());
  index.addEventListener('close',()=>{delete index.dataset.userOpen;state=stateFromUrl(new URL(location.href),projects);apply();});
  let outside=false;
  const isOutside=(e:MouseEvent)=>{const b=index.getBoundingClientRect();return e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom;};
  index.addEventListener('pointerdown',event=>{outside=event.target===index&&isOutside(event);});
  index.addEventListener('click',event=>{if(event.target===index&&outside&&isOutside(event))index.close();outside=false;});
  document.addEventListener('keydown',event=>{if(event.key!=='Escape'||dialog.open||index.open||(event.target as Element)?.closest?.('#site-header'))return;if(state.room)navigate({group:state.group,model:state.model});else if(state.model)navigate({group:state.group});});
  apply();
  scene=createShowroomScene(root,projects,{selectModel,selectRoom,openProject,projectDialog:dialog});scene.setState(state);
  root.dataset.ready='true';
  window.addEventListener('resize',()=>{const count=options.children.length;options.style.gridTemplateColumns=innerWidth>800?`repeat(${Math.min(4,count)},minmax(0,1fr))`:'';});
  // Secondary-category links retain the original indexed filtering route.
  const initial=new URL(location.href);if(initial.searchParams.has('category')&&!state.model&&!dialog.open){index.dataset.userOpen='';index.showModal();}
}
