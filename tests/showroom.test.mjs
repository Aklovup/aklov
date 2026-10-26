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
