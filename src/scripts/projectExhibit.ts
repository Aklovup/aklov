import {mediaSelection} from './mediaSelection';
/** Real HTML stays on the wall; all approved text is paged at existing paragraph boundaries. */
export function createProjectExhibit(root:HTMLElement) {
  const exhibit=root.querySelector<HTMLElement>('[data-exhibit]')!;
  const title=exhibit.querySelector<HTMLElement>('[data-exhibit-title]')!;
  const chapter=exhibit.querySelector<HTMLElement>('[data-exhibit-chapter]')!;
  const chapters=exhibit.querySelector<HTMLElement>('[data-exhibit-chapters]')!;
  const stage=exhibit.querySelector<HTMLElement>('[data-exhibit-stage]')!;
  const rail=exhibit.querySelector<HTMLElement>('[data-exhibit-media-controls]')!;
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
    const selected=assets.find(a=>a.dataset.id===layout.main);if(selected)stage.append(selected.cloneNode(true));
    exhibit.querySelector('[data-media-position]')!.textContent=selected?.dataset.available==='true'?`${assets.indexOf(selected)+1} / ${assets.length} media`:'Media pending';
    exhibit.querySelector<HTMLElement>('[data-media-layout]')!.dataset.single=String(!layout.rail.length);rail.hidden=!layout.rail.length;
    rail.style.setProperty('--rail-count',String(layout.rail.length));
    rail.replaceChildren(...layout.rail.map(id=>{
      const asset=assets.find(a=>a.dataset.id===id)!,button=document.createElement('button');button.type='button';button.dataset.mediaChoice=id;
      button.setAttribute('aria-label',`Show media: ${asset.dataset.label}`);
      if(asset.dataset.preview){const image=document.createElement('img');image.src=asset.dataset.preview;image.alt=asset.dataset.label||'';image.decoding='async';button.append(image);}
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
      if(!nextSlug){stopMedia();stage.replaceChildren();exhibit.hidden=true;slug='';return;}
      if(nextSlug===slug)return;
      const source=document.querySelector<HTMLElement>(`[data-exhibit-template="${nextSlug}"]`);if(!source)return;
      slug=nextSlug;const content=source.cloneNode(true) as HTMLElement,meta=content.querySelector<HTMLElement>('[data-exhibit-metadata]')!;
      title.textContent=meta.dataset.title!;exhibit.querySelector('[data-exhibit-type]')!.textContent=meta.dataset.type!;
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
    collapse(){return false;},
    nextChapter(direction:number){activeChapter=Math.max(0,Math.min(sections.length-1,activeChapter+direction));page=0;renderPage(true);},
  };
}
