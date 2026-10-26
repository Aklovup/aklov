import {mediaSelection} from './mediaSelection';
/** Real HTML stays on the wall; all approved text is paged at existing paragraph boundaries. */
export function createProjectExhibit(root:HTMLElement) {
  const exhibit=root.querySelector<HTMLElement>('[data-exhibit]')!;
  const title=exhibit.querySelector<HTMLElement>('[data-exhibit-title]')!;
  const chapter=exhibit.querySelector<HTMLElement>('[data-exhibit-chapter]')!;
  const chapters=exhibit.querySelector<HTMLElement>('[data-exhibit-chapters]')!;
  const stage=exhibit.querySelector<HTMLElement>('[data-exhibit-stage]')!;
  const rail=exhibit.querySelector<HTMLElement>('[data-exhibit-media-controls]')!;
  const lifted=exhibit.querySelector<HTMLElement>('[data-lift-display]')!;
  const liftScroll=exhibit.querySelector<HTMLElement>('[data-media-lift-scroll]')!;
  let restoreLiftFocus=true;
  let liftTimer:ReturnType<typeof setTimeout>|undefined;
  function finishLift(){
    clearTimeout(liftTimer);lifted.hidden=true;liftScroll.replaceChildren();root.dataset.mediaLift='closed';stage.setAttribute('aria-expanded','false');
    if(restoreLiftFocus&&!exhibit.hidden){root.dataset.restoringFocus='true';stage.focus({preventScroll:true});delete root.dataset.restoringFocus;}
  }
  function closeLift(immediate=false){
    if(!root.dataset.mediaLift||root.dataset.mediaLift==='closed')return false;
    restoreLiftFocus=!immediate;root.dataset.mediaLift='closing';root.dispatchEvent(new CustomEvent('aklov:media-lift',{detail:{open:false,immediate}}));
    if(root.dataset.mediaLift==='closed')return true;
    if(immediate||root.dataset.surfaceMode!=='world')finishLift();else liftTimer=setTimeout(finishLift,900);
    return true;
  }
  function openLift(){
    if(root.dataset.mediaLift==='open'||root.dataset.mediaLift==='closing')return;
    const selected=assets.find(a=>a.dataset.id===exhibit.dataset.mainMedia);if(selected?.dataset.available!=='true')return;
    const content=selected.cloneNode(true) as HTMLElement;
    const image=content.querySelector<HTMLImageElement>('.project-media>img');
    if(image&&selected.dataset.source){image.removeAttribute('srcset');image.removeAttribute('sizes');image.src=selected.dataset.source;image.loading='eager';}
    stopMedia();liftScroll.replaceChildren(content);liftScroll.scrollTop=0;lifted.hidden=false;root.dataset.mediaLift='open';stage.setAttribute('aria-expanded','true');
    root.dispatchEvent(new CustomEvent('aklov:media-lift',{detail:{open:true}}));
    document.dispatchEvent(new CustomEvent('aklov:project-open',{detail:{root:liftScroll}}));liftScroll.focus({preventScroll:true});
  }
  window.addEventListener('resize',()=>closeLift(true));
  root.addEventListener('aklov:media-lift-settled',event=>{if(!(event as CustomEvent).detail.open)finishLift();});
  exhibit.querySelector('[data-media-lift-close]')!.addEventListener('click',()=>closeLift());
  stage.addEventListener('click',event=>{if(!(event.target as Element).closest('button,a,video'))openLift();});
  stage.addEventListener('keydown',event=>{if(event.target===stage&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openLift();}});
  document.addEventListener('click',event=>{if(root.dataset.mediaLift!=='open'||lifted.contains(event.target as Node)||stage.contains(event.target as Node))return;event.preventDefault();event.stopImmediatePropagation();closeLift();},true);
  document.addEventListener('keydown',event=>{
    if(root.dataset.mediaLift!=='open'||event.key!=='Tab')return;
    const controls=[...lifted.querySelectorAll<HTMLElement>('button:not([hidden]),a[href],video[controls],[tabindex="0"]')];
    const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
  const previous=exhibit.querySelector<HTMLButtonElement>('[data-story-prev]')!,next=exhibit.querySelector<HTMLButtonElement>('[data-story-next]')!;
  let slug='',activeChapter=0,page=0,sections:{title:string;pages:Node[][]}[]=[],assets:HTMLElement[]=[];
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
  function renderPage(focus=false){
    const section=sections[activeChapter];if(!section)return;
    chapter.replaceChildren();const heading=document.createElement('h3');heading.textContent=section.title;chapter.append(heading,...section.pages[page].map(n=>n.cloneNode(true)));
    const length=chapter.textContent?.length||0;chapter.style.setProperty('--reading-size',length>700?'24px':length>520?'27px':'30px');
    exhibit.querySelector('[data-story-position]')!.textContent=`${page+1} / ${section.pages.length}`;
    previous.disabled=page===0;next.disabled=page===section.pages.length-1;
    for(const [i,b]of [...chapters.querySelectorAll('button')].entries())b.setAttribute('aria-pressed',String(i===activeChapter));
    if(focus)chapter.focus({preventScroll:true});
  }
  previous.addEventListener('click',()=>{if(page>0){page--;renderPage();}});next.addEventListener('click',()=>{if(page<sections[activeChapter].pages.length-1){page++;renderPage();}});
  for(const button of exhibit.querySelectorAll<HTMLButtonElement>('[data-room-station]'))button.addEventListener('click',()=>root.dispatchEvent(new CustomEvent('aklov:room-station',{detail:button.dataset.roomStation})));
  exhibit.querySelector('[data-room-door]')!.addEventListener('click',()=>root.dispatchEvent(new CustomEvent('aklov:room-exit')));
  return {
    setProject(nextSlug?:string){
      if(nextSlug!==slug)closeLift(true);
      if(!nextSlug){stopMedia();stage.replaceChildren();exhibit.hidden=true;slug='';return;}
      if(nextSlug===slug)return;
      const source=document.querySelector<HTMLElement>(`[data-exhibit-template="${nextSlug}"]`);if(!source)return;
      slug=nextSlug;const content=source.cloneNode(true) as HTMLElement,meta=content.querySelector<HTMLElement>('[data-exhibit-metadata]')!;
      title.textContent=meta.dataset.title!;title.style.setProperty('--project-title-size',meta.dataset.title!.length>30?'34px':'48px');exhibit.querySelector('[data-exhibit-type]')!.textContent=meta.dataset.type!;
      sections=[];let current:{title:string;pages:Node[][]}|undefined;
      for(const node of [...content.querySelector('[data-exhibit-copy]')!.childNodes]){
        if(node instanceof HTMLElement&&node.tagName==='H3'){current={title:node.textContent||'',pages:[[]]};sections.push(current);continue;}
        if(!current||!node.textContent?.trim())continue;
        const currentPage=current.pages.at(-1)!;
        if(currentPage.length&&currentPage.reduce((n,item)=>n+(item.textContent?.length||0),0)+(node.textContent?.length||0)>420)current.pages.push([]);
        current.pages.at(-1)!.push(node.cloneNode(true));
      }
      // Preserve the approved headline and card introduction in the overview as well.
      if(sections.length){const intro=[meta.dataset.intro,meta.dataset.summary].filter(Boolean).map(text=>{const p=document.createElement('p');p.textContent=text!;return p;});sections[0].pages.unshift(intro);}
      chapters.replaceChildren(...sections.map((section,i)=>{const b=document.createElement('button');b.type='button';b.textContent=section.title;b.addEventListener('click',()=>{activeChapter=i;page=0;renderPage(true);});return b;}));
      assets=[...content.querySelectorAll<HTMLElement>('[data-exhibit-asset]')];const available=assets.filter(a=>a.dataset.available==='true');assets=available.length?available:assets.slice(0,1);
      mediaSelection.get(slug,assets.map(a=>a.dataset.id!),meta.dataset.initialMedia);
      exhibit.querySelector('[data-exhibit-links]')!.replaceChildren(...[...content.querySelector('[data-exhibit-external]')!.childNodes].map(n=>n.cloneNode(true)));
      exhibit.hidden=false;activeChapter=0;page=0;renderPage();renderMedia();emitSelection();
    },
    focus(){title.focus({preventScroll:true});},
    collapse(){return closeLift();},
    nextChapter(direction:number){activeChapter=Math.max(0,Math.min(sections.length-1,activeChapter+direction));page=0;renderPage(true);},
  };
}
