import {mediaSelection} from './mediaSelection';
import {gesturePixels} from './showroomNavigation';
/** Wall covers and continuous editorial stories share the spatial media lift. */
export function createProjectExhibit(root:HTMLElement) {
  const exhibit=root.querySelector<HTMLElement>('[data-exhibit]')!;
  const title=exhibit.querySelector<HTMLElement>('[data-exhibit-title]')!;
  const story=exhibit.querySelector<HTMLElement>('[data-story-launch]')!;
  const stage=exhibit.querySelector<HTMLElement>('[data-exhibit-stage]')!;
  const rail=exhibit.querySelector<HTMLElement>('[data-exhibit-media-controls]')!;
  const lifted=exhibit.querySelector<HTMLElement>('[data-lift-display]')!;
  const liftScroll=exhibit.querySelector<HTMLElement>('[data-media-lift-scroll]')!;
  let restoreLiftFocus=true,returnTarget=stage;
  let storyArticle:HTMLElement|undefined;
  let liftTimer:ReturnType<typeof setTimeout>|undefined;
  function finishLift(){
    clearTimeout(liftTimer);lifted.hidden=true;liftScroll.replaceChildren();root.dataset.mediaLift='closed';returnTarget.setAttribute('aria-expanded','false');
    if(restoreLiftFocus&&!exhibit.hidden){root.dataset.restoringFocus='true';returnTarget.focus({preventScroll:true});delete root.dataset.restoringFocus;}
  }
  function closeLift(immediate=false){
    if(!root.dataset.mediaLift||root.dataset.mediaLift==='closed')return false;
    restoreLiftFocus=!immediate;root.dataset.mediaLift='closing';root.dispatchEvent(new CustomEvent('aklov:media-lift',{detail:{open:false,immediate}}));
    if(root.dataset.mediaLift==='closed')return true;
    if(immediate||root.dataset.surfaceMode!=='world')finishLift();else liftTimer=setTimeout(finishLift,900);
    return true;
  }
  function openLift(kind:'media'|'story'='media'){
    if(root.dataset.mediaLift==='open'||root.dataset.mediaLift==='closing')return;
    let content:HTMLElement;
    if(kind==='story'){
      if(!storyArticle)return;content=storyArticle.cloneNode(true) as HTMLElement;returnTarget=story;
    }else{
      const selected=assets.find(a=>a.dataset.id===exhibit.dataset.mainMedia);if(selected?.dataset.available!=='true')return;
      content=selected.cloneNode(true) as HTMLElement;returnTarget=stage;
      const image=content.querySelector<HTMLImageElement>('.project-media>img');
      if(image&&selected.dataset.source){image.removeAttribute('srcset');image.removeAttribute('sizes');image.src=selected.dataset.source;image.loading='eager';}
    }
    stopMedia();root.dataset.liftKind=kind;lifted.dataset.kind=kind;lifted.setAttribute('aria-label',kind==='story'?`${title.textContent}: complete project story`:'Full project media');
    liftScroll.setAttribute('aria-label',kind==='story'?'Complete case study; scroll to read':'Full project image; scroll to explore');
    liftScroll.replaceChildren(content);liftScroll.scrollTop=0;lifted.hidden=false;root.dataset.mediaLift='open';returnTarget.setAttribute('aria-expanded','true');
    root.dispatchEvent(new CustomEvent('aklov:media-lift',{detail:{open:true,kind}}));
    document.dispatchEvent(new CustomEvent('aklov:project-open',{detail:{root:liftScroll}}));liftScroll.focus({preventScroll:true});
  }
  window.addEventListener('resize',()=>closeLift(true));
  // A projected CSS3D surface is not consistently included in native scroll chaining.
  // Route reading gestures explicitly, keeping them separate from room navigation.
  document.addEventListener('wheel',event=>{
    if(root.dataset.mediaLift!=='open'||event.ctrlKey)return;
    const box=lifted.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)return;
    event.preventDefault();liftScroll.scrollTop+=gesturePixels(event.deltaY,event.deltaMode,liftScroll.clientHeight);
  },{passive:false,capture:true});
  let readingTouch:{id:number;y:number;origin:number;moved:boolean}|undefined;
  liftScroll.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse')return;readingTouch={id:event.pointerId,y:event.clientY,origin:event.clientY,moved:false};});
  liftScroll.addEventListener('pointermove',event=>{
    if(!readingTouch||readingTouch.id!==event.pointerId)return;
    const distance=readingTouch.y-event.clientY;readingTouch.y=event.clientY;
    if(Math.abs(event.clientY-readingTouch.origin)>6)readingTouch.moved=true;
    if(readingTouch.moved){if(!liftScroll.hasPointerCapture(event.pointerId))liftScroll.setPointerCapture(event.pointerId);event.preventDefault();liftScroll.scrollTop+=distance;}
  },{passive:false});
  liftScroll.addEventListener('pointerup',event=>{if(readingTouch?.id!==event.pointerId)return;if(readingTouch.moved){const suppress=(click:MouseEvent)=>{click.preventDefault();click.stopImmediatePropagation();};liftScroll.addEventListener('click',suppress,{once:true,capture:true});setTimeout(()=>liftScroll.removeEventListener('click',suppress,true),0);}readingTouch=undefined;});
  liftScroll.addEventListener('pointercancel',()=>{readingTouch=undefined;});
  liftScroll.addEventListener('keydown',event=>{
    if((event.target as Element).closest('button,video,a'))return;
    const steps:Record<string,number>={ArrowDown:48,ArrowUp:-48,PageDown:liftScroll.clientHeight*.85,PageUp:-liftScroll.clientHeight*.85,' ':liftScroll.clientHeight*.85,Home:-liftScroll.scrollHeight,End:liftScroll.scrollHeight};
    if(event.key in steps){event.preventDefault();liftScroll.scrollTop+=steps[event.key];}
  });
  root.addEventListener('aklov:media-lift-settled',event=>{if(!(event as CustomEvent).detail.open)finishLift();});
  exhibit.querySelector('[data-media-lift-close]')!.addEventListener('click',()=>closeLift());
  stage.addEventListener('click',event=>{if(!(event.target as Element).closest('button,a,video'))openLift('media');});
  stage.addEventListener('keydown',event=>{if(event.target===stage&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openLift();}});
  story.addEventListener('click',()=>openLift('story'));
  story.addEventListener('keydown',event=>{if(event.target===story&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openLift('story');}});
  document.addEventListener('click',event=>{if(root.dataset.mediaLift!=='open'||lifted.contains(event.target as Node)||returnTarget.contains(event.target as Node))return;event.preventDefault();event.stopImmediatePropagation();closeLift();},true);
  document.addEventListener('keydown',event=>{
    if(root.dataset.mediaLift!=='open'||event.key!=='Tab')return;
    const controls=[...lifted.querySelectorAll<HTMLElement>('button:not([hidden]),a[href],video[controls],[tabindex="0"]')];
    const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
  let slug='',assets:HTMLElement[]=[];
  const stopMedia=()=>stage.querySelectorAll('video').forEach(v=>v.pause());
  function emitSelection(){
    const layout=mediaSelection.get(slug,assets.map(a=>a.dataset.id!));
    const asset=assets.find(a=>a.dataset.id===layout.main);
    root.dispatchEvent(new CustomEvent('aklov:media-selection',{detail:{slug,id:layout.main,src:asset?.dataset.preview}}));
  }
  function renderMedia(){
    const layout=mediaSelection.get(slug,assets.map(a=>a.dataset.id!));stopMedia();stage.replaceChildren();
    const selected=assets.find(a=>a.dataset.id===layout.main);if(selected)stage.append(selected.cloneNode(true));stage.dataset.available=selected?.dataset.available||'false';stage.setAttribute('aria-disabled',String(selected?.dataset.available!=='true'));
    exhibit.querySelector('[data-media-position]')!.textContent=selected?.dataset.available==='true'?`${assets.indexOf(selected)+1} / ${assets.length} media`:'Media pending';
    exhibit.querySelector<HTMLElement>('[data-media-layout]')!.dataset.single=String(!layout.rail.length);rail.hidden=!layout.rail.length;
    rail.style.gridTemplateRows=`repeat(${Math.max(1,layout.rail.length)},minmax(0,1fr))`;
    rail.replaceChildren(...layout.rail.map(id=>{
      const asset=assets.find(a=>a.dataset.id===id)!,button=document.createElement('button');button.type='button';button.dataset.mediaChoice=id;
      button.setAttribute('aria-label',`Show media: ${asset.dataset.label}`);
      if(asset.dataset.preview){const image=document.createElement('img');image.src=asset.dataset.preview;image.alt=asset.dataset.label||'';image.decoding='async';image.width=240;image.height=140;button.append(image);}
      const label=document.createElement('span');label.textContent=asset.dataset.label||id;button.append(label);
      button.addEventListener('click',()=>{mediaSelection.swap(slug,id);renderMedia();emitSelection();});return button;
    }));
    exhibit.dataset.mainMedia=layout.main;
    document.dispatchEvent(new CustomEvent('aklov:project-open',{detail:{root:stage}}));
  }
  exhibit.querySelector('[data-room-door]')!.addEventListener('click',()=>root.dispatchEvent(new CustomEvent('aklov:room-exit')));
  return {
    setProject(nextSlug?:string){
      if(nextSlug!==slug)closeLift(true);
      if(!nextSlug){stopMedia();stage.replaceChildren();exhibit.hidden=true;slug='';return;}
      if(nextSlug===slug)return;
      const source=document.querySelector<HTMLElement>(`[data-exhibit-template="${nextSlug}"]`);if(!source)return;
      slug=nextSlug;const content=source.cloneNode(true) as HTMLElement,meta=content.querySelector<HTMLElement>('[data-exhibit-metadata]')!;
      title.textContent=meta.dataset.title!;title.style.setProperty('--project-title-size',meta.dataset.title!.length>30?'34px':'48px');exhibit.querySelector('[data-exhibit-type]')!.textContent=meta.dataset.type!;
      exhibit.querySelector('[data-story-type]')!.textContent=meta.dataset.type!;
      exhibit.querySelector('[data-story-project]')!.textContent=meta.dataset.title!;
      const headline=exhibit.querySelector<HTMLElement>('[data-story-headline]')!;headline.textContent=meta.dataset.intro!;
      headline.style.setProperty('--cover-headline-size',meta.dataset.intro!.length>85?'78px':'96px');
      exhibit.querySelector('[data-story-intro]')!.textContent=meta.dataset.summary!;
      storyArticle=document.createElement('article');storyArticle.className='case-article';
      const header=document.createElement('header');
      for(const [tag,className,text] of [['p','case-type',meta.dataset.type],['p','case-project',meta.dataset.title],['h2','',meta.dataset.intro],['p','case-intro',meta.dataset.summary]]){const element=document.createElement(tag!);element.className=className!;element.textContent=text!;header.append(element);}
      const categories=document.createElement('div');categories.className='case-categories';categories.append(...[...content.querySelector('[data-exhibit-category-copy]')!.childNodes].map(n=>n.cloneNode(true)));header.append(categories);
      const copy=document.createElement('div');copy.className='case-copy';copy.append(...[...content.querySelector('[data-exhibit-copy]')!.childNodes].map(n=>n.cloneNode(true)));
      const links=document.createElement('nav');links.className='case-links';links.setAttribute('aria-label','External project links');links.append(...[...content.querySelector('[data-exhibit-external]')!.childNodes].map(n=>n.cloneNode(true)));
      storyArticle.append(header,copy,links);
      assets=[...content.querySelectorAll<HTMLElement>('[data-exhibit-asset]')];const available=assets.filter(a=>a.dataset.available==='true');assets=available.length?available:assets.slice(0,1);
      mediaSelection.get(slug,assets.map(a=>a.dataset.id!),meta.dataset.initialMedia);
      exhibit.hidden=false;renderMedia();emitSelection();
    },
    focus(){title.focus({preventScroll:true});},
    collapse(){return closeLift();},

  };
}
