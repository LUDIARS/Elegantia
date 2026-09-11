import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
const root = new URL('../', import.meta.url);
const metadata = JSON.parse(await readFile(new URL('config/catalog.json', root), 'utf8'));
const fields = [['ポイント', 'title'], ['実装内容', 'implementation'], ['達成しうるUX', 'experience'], ['品質達成要件', 'requiredCriteria'], ['追加達成要件', 'additionalCriteria']];
const source = new URL('spec/quality/items/', root);
const files = (await readdir(source)).filter(name => name.endsWith('.md')).sort();
const items = [];
const policy = await readFile(new URL('spec/quality/assessment-policy.md', root), 'utf8');
for (const file of files) {
  const raw = (await readFile(new URL(file, source), 'utf8')).replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) throw new Error(file + ': OKF frontmatter missing');
  const front = parse(match[1]); const extension = front['x-elegantia'];
  if (front.type !== 'feature' || front.service !== 'elegantia' || !extension ||
      !/^[CALGE]\d{2}$/.test(extension.id) || file !== extension.id + '.md' ||
      !Number.isSafeInteger(extension.revision) || extension.revision < 1) throw new Error(file + ': invalid OKF metadata');
  const headings = [...match[2].matchAll(/^## (.+)$/gm)];
  if (headings.length !== fields.length || headings.some((heading, index) => heading[1] !== fields[index][0]))
    throw new Error(file + ': expected five standard headings in order');
  const item = { id: extension.id, categoryId: extension.category, revision: extension.revision };
  for (let i = 0; i < headings.length; i++) {
    const value = match[2].slice(headings[i].index + headings[i][0].length, headings[i + 1]?.index).trim();
    if (!value) throw new Error(file + ': empty section');
    item[fields[i][1]] = value;
  }
  if (front.title !== item.title) throw new Error(file + ': title mismatch');
  items.push(item);
}
if (new Set(items.map(item => item.id)).size !== items.length) throw new Error('Duplicate criterion IDs');
for (const category of metadata.categories)
  if (items.filter(item => item.categoryId === category.id).length !== category.count) throw new Error('Category count mismatch: ' + category.id);
if (items.some(item => !metadata.categories.some(category => category.id === item.categoryId))) throw new Error('Unknown category');
const order = new Map(metadata.categories.map((category, index) => [category.id, index]));
items.sort((a, b) => order.get(a.categoryId) - order.get(b.categoryId) || a.id.localeCompare(b.id));
const fingerprint = createHash('sha256').update(JSON.stringify({ metadata, items, policy })).digest('hex').slice(0, 12);
const catalog = { schemaVersion: 1, ...metadata, version: metadata.version + '+' + fingerprint, items };
const index = ['# Elegantia 品質基準', '', '個別OKF Markdownが正本です。JSONとこの総覧は生成物です。', '', '基準版: ' + catalog.version, ''];
index.push('[共通の評価条件・数値案](assessment-policy.md)', '');
const overview = [...index, policy.replace(/^---[\s\S]*?---\s*/, ''), ''];
for (const category of metadata.categories) {
  index.push('## ' + category.name, '');
  overview.push('## ' + category.name, '');
  for (const item of items.filter(item => item.categoryId === category.id)) {
    index.push('- [' + item.id + ' ' + item.title + '](items/' + item.id + '.md)');
    overview.push('### ' + item.id + ' ' + item.title, '');
    for (const [label, key] of fields) overview.push('#### ' + label, '', item[key], '');
  }
  index.push('');
}
await mkdir(new URL('data/', root), { recursive: true });
await writeFile(new URL('data/catalog.json', root), JSON.stringify(catalog, null, 2) + '\n', 'utf8');
await writeFile(new URL('spec/quality/index.md', root), index.join('\n').trimEnd() + '\n', 'utf8');
await writeFile(new URL('spec/quality/catalog.md', root), overview.join('\n').trimEnd() + '\n', 'utf8');
process.stdout.write(items.length + ' OKF criteria compiled; version ' + catalog.version + '\n');
