/** Per-page exhibition state; no storage survives a document reload. */
export interface MediaLayout { main:string; rail:string[]; }
export class MediaSelection {
  private projects=new Map<string,MediaLayout>();
  get(slug:string,ids:string[],initial?:string):MediaLayout {
    const saved=this.projects.get(slug);
    if(saved&&ids.includes(saved.main)&&[saved.main,...saved.rail].length===ids.length)return saved;
    const main=initial&&ids.includes(initial)?initial:ids[0]||'';
    const layout={main,rail:ids.filter(id=>id!==main)};this.projects.set(slug,layout);return layout;
  }
  swap(slug:string,id:string):MediaLayout|undefined {
    const layout=this.projects.get(slug),slot=layout?.rail.indexOf(id)??-1;
    if(!layout||slot<0)return layout;
    const outgoing=layout.main;layout.main=id;layout.rail[slot]=outgoing;return layout;
  }
}
export const mediaSelection=new MediaSelection();
