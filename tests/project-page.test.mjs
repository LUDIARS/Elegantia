import assert from 'node:assert/strict';
import test from 'node:test';
import {projectPage} from '../dist/src/projects/page.js';
test('first view contains ten most recently updated registered projects',()=>{
  const projects=Array.from({length:12},(_,i)=>({code:String(i),project:'Project '+i,updatedAt:i}));
  const updates=new Map([['Project 0',100],['Unregistered',200]]);
  const first=projectPage(projects,updates,0);const second=projectPage(projects,updates,first.nextOffset);
  assert.equal(first.projects.length,10);assert.equal(first.projects[0].project,'Project 0');
  assert.equal(second.projects.length,2);assert.equal(second.nextOffset,null);
  assert.equal(new Set([...first.projects,...second.projects].map(p=>p.project)).size,12);
  assert.equal(projects[0].updatedAt,0);
});
