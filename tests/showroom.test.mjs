import test from 'node:test';
import assert from 'node:assert/strict';
import { readProjects } from './project-content.mjs';
import { modelsFor,stateFromUrl,urlForState } from '../src/scripts/showroomState.ts';
const projects=readProjects();
test('primary-category buildings give every project one room and omit empty categories',()=>{
 const client=modelsFor(projects,'client'),concepts=modelsFor(projects,'concepts');
 assert.deepEqual(client.map(m=>m.category),['applications','websites','customer-systems','automation']);
 assert.deepEqual(client.map(m=>m.projects.length),[2,3,1,2]);
 assert.deepEqual(concepts.map(m=>m.category),['websites']);assert.equal(concepts[0].projects.length,2);
 const rooms=[...client,...concepts].flatMap(m=>m.projects.map(p=>p.slug));assert.equal(rooms.length,10);assert.equal(new Set(rooms).size,10);
});
test('room, category, legacy category and project links resolve real exhibits',()=>{
 assert.deepEqual(stateFromUrl(new URL('https://aklov.pages.dev/work/?model=applications&room=impex-automotive'),projects),{group:'client',model:'applications',room:'impex-automotive'});
 assert.equal(stateFromUrl(new URL('https://aklov.pages.dev/work/?category=websites'),projects).model,'websites');
 assert.equal(stateFromUrl(new URL('https://aklov.pages.dev/work/?project=vera-skincare-concept'),projects).group,'concepts');
 assert.equal(stateFromUrl(new URL('https://aklov.pages.dev/work/?type=client&room=vera-skincare-concept'),projects).room,undefined);
 assert.deepEqual(stateFromUrl(new URL('https://aklov.pages.dev/work/?model=nope&room=nope'),projects),{group:'client',model:undefined,room:undefined});
});
test('showroom navigation round-trips its state and preserves unrelated parameters',()=>{
 const state={group:'client',model:'applications',room:'impex-automotive'};
 const url=urlForState(new URL('https://aklov.pages.dev/work/?utm_source=review&category=websites&project=jaycor-commerce#main'),state);
 assert.equal(url.searchParams.get('utm_source'),'review');assert.equal(url.hash,'#main');assert.equal(url.searchParams.has('project'),false);assert.equal(url.searchParams.has('category'),false);
 assert.deepEqual(stateFromUrl(url,projects),state);
});

const {previousLocation,wheelDistance,routeDistance,roomExitPixels}=await import('../src/scripts/showroomTravel.ts');
test('spatial back navigation removes exactly one level and retains the collection',()=>{
 assert.deepEqual(previousLocation({group:'client',model:'applications',room:'impex-automotive'}),{group:'client',model:'applications'});
 assert.deepEqual(previousLocation({group:'concepts',model:'websites'}),{group:'concepts'});
});
test('travel follows finite measured distances, reverses and clamps at the physical endpoint',()=>{
 assert.equal(wheelDistance(2,1,900),32);assert.equal(wheelDistance(1,2,900),900);
 assert.equal(routeDistance(0,100,20),7.5);assert.equal(routeDistance(7.5,-50,20),3.75);
 assert.equal(routeDistance(19,100,20),20);assert.equal(routeDistance(1,-100,20),0);
 assert.ok(roomExitPixels(-.12,1.95)<150);assert.equal(roomExitPixels(0,2.82),0);
});

const {MediaSelection}=await import('../src/scripts/mediaSelection.ts');
test('media selection swaps only the clicked slot and remembers each project until reload',()=>{
 const selection=new MediaSelection();
 assert.deepEqual(selection.get('impex',['a','b','c'],'a'),{main:'a',rail:['b','c']});
 assert.deepEqual(selection.swap('impex','c'),{main:'c',rail:['b','a']});
 selection.get('xans',['x','y'],'x');selection.swap('xans','y');
 assert.deepEqual(selection.get('impex',['a','b','c'],'a'),{main:'c',rail:['b','a']});
 assert.deepEqual(new MediaSelection().get('impex',['a','b','c'],'a'),{main:'a',rail:['b','c']});
});
test('one through five media have one primary item and no duplicate or empty thumbnail slots',()=>{
 for(let n=1;n<=5;n++){
  const selection=new MediaSelection(),ids=Array.from({length:n},(_,i)=>String(i));
  const state=selection.get('project',ids);assert.equal(state.rail.length,n-1);
  for(const id of ids){selection.swap('project',id);assert.equal(new Set([state.main,...state.rail]).size,n);assert.deepEqual([...new Set([state.main,...state.rail])].sort(),ids);}
 }
});

const {moveOnFloor,gesturePixels}=await import('../src/scripts/showroomNavigation.ts');
test('backward movement follows the viewing direction; the side wall can be faced and approached squarely',()=>{
 const backing=moveOnFloor(.1,.65,-Math.PI/2,-200);
 assert.ok(backing.x<.1);assert.ok(Math.abs(backing.z-.65)<.0001);assert.equal(backing.exit,false);
 const forwards=moveOnFloor(backing.x,backing.z,-Math.PI/2,100);assert.ok(forwards.x>backing.x);
 for(const heading of [0,Math.PI/2,Math.PI,-Math.PI/2]){const p=moveOnFloor(0,1,heading,100);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));}
 assert.equal(moveOnFloor(0,2.6,0,-100).exit,true);
 assert.equal(moveOnFloor(.8,2.6,0,-100).exit,false,'The rear wall outside the opening is not an exit');
 assert.equal(moveOnFloor(0,1,Math.PI,600).exit,true,'Walking forward toward the doorway also exits');
 assert.equal(gesturePixels(.25,0,900),.25);assert.equal(gesturePixels(2,1,900),32);assert.equal(gesturePixels(3000,0,900),600);
});
