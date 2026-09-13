import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {connectDatabase} from '../dist/src/db/connect.js';
import {HumanReviews} from '../dist/src/db/human-reviews.js';

test('human OK/NG keeps comments and retry identity across reopen', async () => {
  const dir = await mkdtemp(join(tmpdir(),'el-human-')); let database;
  try {
    const path = join(dir,'reviews.sqlite');
    const migration = fileURLToPath(new URL('../migrations/001_results.sql',import.meta.url));
    database = await connectDatabase(path,migration);
    let reviews = new HumanReviews(database.db,()=>new Date('2026-09-13T00:00:00Z'));
    const input = {requestId:'00000000-0000-4000-8000-000000000001',project:'Example',itemId:'C01',verdict:'NG',comment:'Input response is delayed'};
    reviews.append(input); reviews.append(input);
    assert.throws(()=>reviews.append({...input,verdict:'OK'}));
    reviews.append({...input,requestId:'00000000-0000-4000-8000-000000000002',verdict:'OK',comment:'Response verified'});
    await database.close(); database=undefined;
    database=await connectDatabase(path,migration); reviews=new HumanReviews(database.db,()=>new Date());
    const history=reviews.history('Example','C01');
    assert.deepEqual(history.map(row=>row.verdict),['OK','NG']);
    assert.deepEqual(history.map(row=>row.comment),['Response verified','Input response is delayed']);
    assert.equal(reviews.history('Other','C01').length,0);
    assert.equal(reviews.history('Example','C02').length,0);
  } finally {if(database)await database.close();await rm(dir,{recursive:true,force:true});}
});
