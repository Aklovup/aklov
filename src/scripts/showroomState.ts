import { categoryIds, conceptCategoryIds, categoryLabel, type ProjectCategory } from '../data/projectCategories.ts';
export type CollectionGroup='client'|'concepts';
export interface ShowroomProject { slug:string; title:string; description:string; projectType:string; primaryCategory:ProjectCategory; aliases?:string[]; src?:string; initialMedia?:string; media?:{id:string;type:string;label:string;src?:string}[]; }
export interface ShowroomModel { key:string; category:ProjectCategory; label:string; group:CollectionGroup; projects:ShowroomProject[]; }
export interface ShowroomState { group:CollectionGroup; model?:ProjectCategory; room?:string; }
export function modelsFor(projects:ShowroomProject[],group:CollectionGroup):ShowroomModel[] {
  return (group==='concepts'?conceptCategoryIds:categoryIds).map(category=>({
    key:`${group}:${category}`,category,label:categoryLabel(category),group,
    projects:projects.filter(p=>(p.projectType==='Independent Concept')===(group==='concepts')&&p.primaryCategory===category),
  })).filter(model=>model.projects.length>0);
}
export function stateFromUrl(url:URL,projects:ShowroomProject[]):ShowroomState {
  let group:CollectionGroup=url.searchParams.get('type')==='concepts'?'concepts':'client';
  const find=(slug:string|null)=>projects.find(p=>p.slug===slug||p.aliases?.includes(slug||''));
  const direct=find(url.searchParams.get('project'));
  if(direct)group=direct.projectType==='Independent Concept'?'concepts':'client';
  const candidate=direct||find(url.searchParams.get('room'));
  const room=candidate&&(candidate.projectType==='Independent Concept')===(group==='concepts')?candidate:undefined;
  const models=modelsFor(projects,group);
  const wanted=room?.primaryCategory||url.searchParams.get('model')||url.searchParams.get('category');
  const model=models.find(m=>m.category===wanted);
  return {group,model:model?.category,room:room&&model?.projects.includes(room)?room.slug:undefined};
}
export function urlForState(current:URL,state:ShowroomState):URL {
  const url=new URL(current.href);
  for(const key of ['model','room','project','category'])url.searchParams.delete(key);
  url.searchParams.set('type',state.group);
  if(state.model)url.searchParams.set('model',state.model);
  if(state.room)url.searchParams.set('room',state.room);
  return url;
}
