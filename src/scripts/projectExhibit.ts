/** Approved Markdown is rendered by Astro, then divided at its existing headings. */
export function createProjectExhibit(root:HTMLElement) {
  const exhibit=root.querySelector<HTMLElement>('[data-exhibit]')!;
  const title=exhibit.querySelector<HTMLElement>('[data-exhibit-title]')!;
  const chapter=exhibit.querySelector<HTMLElement>('[data-exhibit-chapter]')!;
  const chapters=exhibit.querySelector<HTMLElement>('[data-exhibit-chapters]')!;
  const stage=exhibit.querySelector<HTMLElement>('[data-exhibit-stage]')!;
  const mediaControls=exhibit.querySelector<HTMLElement>('[data-exhibit-media-controls]')!;
  let slug='',activeChapter=0,mediaIndex=0,sections:HTMLElement[]=[],assets:HTMLElement[]=[];
  const stopMedia=()=>{stage.querySelectorAll('video').forEach(v=>v.pause());};
  function showMedia(index:number){
    stopMedia();mediaIndex=index;stage.replaceChildren();
    if(assets[index])stage.append(assets[index].cloneNode(true));
    exhibit.querySelector('[data-media-position]')!.textContent=assets.length?`${String(index+1).padStart(2,'0')} / ${String(assets.length).padStart(2,'0')}`:'Media pending';
    mediaControls.replaceChildren(...assets.map((asset,i)=>{
      const button=document.createElement('button');button.type='button';button.textContent=String(i+1).padStart(2,'0');button.setAttribute('aria-label',`Show media: ${asset.dataset.label}`);button.setAttribute('aria-pressed',String(i===index));button.addEventListener('click',()=>showMedia(i));return button;
    }));
    document.dispatchEvent(new CustomEvent('aklov:project-open',{detail:{root:stage}}));
  }
  function showChapter(index:number,focus=false){
    activeChapter=index;chapter.replaceChildren(sections[index].cloneNode(true));chapter.scrollTop=0;
    for(const [i,b]of [...chapters.querySelectorAll('button')].entries())b.setAttribute('aria-pressed',String(i===index));
    if(focus)chapter.focus({preventScroll:true});
  }
  return {
    setProject(next?:string){
      if(!next){stopMedia();stage.replaceChildren();exhibit.hidden=true;slug='';return;}
      if(next===slug)return;
      const template=document.querySelector<HTMLTemplateElement>(`[data-exhibit-template="${next}"]`);if(!template)return;
      slug=next;const content=template.content.cloneNode(true) as DocumentFragment;
      const meta=content.querySelector<HTMLElement>('[data-exhibit-metadata]')!;
      title.textContent=meta.dataset.title!;exhibit.querySelector('[data-exhibit-type]')!.textContent=meta.dataset.type!;exhibit.querySelector('[data-exhibit-intro]')!.textContent=meta.dataset.intro!;exhibit.querySelector('[data-exhibit-summary]')!.textContent=meta.dataset.summary!;
      sections=[];let current:HTMLElement|undefined;
      for(const node of [...content.querySelector('[data-exhibit-copy]')!.childNodes]){
        if(node instanceof HTMLElement&&node.tagName==='H3'){current=document.createElement('section');sections.push(current);}
        if(current)current.append(node.cloneNode(true));
      }
      chapters.replaceChildren(...sections.map((section,i)=>{const b=document.createElement('button');b.type='button';b.textContent=section.querySelector('h3')!.textContent;b.addEventListener('click',()=>showChapter(i,true));return b;}));
      assets=[...content.querySelectorAll<HTMLElement>('[data-exhibit-asset]')];
      const available=assets.filter(a=>a.dataset.available==='true');if(available.length)assets=available;
      exhibit.querySelector('[data-exhibit-links]')!.replaceChildren(...[...content.querySelector('[data-exhibit-external]')!.childNodes].map(n=>n.cloneNode(true)));
      exhibit.hidden=false;if(sections.length)showChapter(0);showMedia(0);
    },
    focus(){title.focus({preventScroll:true});},
    nextChapter(direction:number){const index=Math.max(0,Math.min(sections.length-1,activeChapter+direction));if(sections.length)showChapter(index,true);},
    get mediaIndex(){return mediaIndex;},
  };
}
