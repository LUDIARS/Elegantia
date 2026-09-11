// @spec 審査checkoutの型検査準備
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function run(args, timeout) {
  const result = spawnSync(process.execPath, args, {
    cwd: root, stdio: 'inherit', windowsHide: true, timeout,
  });
  if (result.error) {
    process.stderr.write('Typecheck preparation could not complete: ' + result.error.message + '\n');
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const compiler = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url));
const sharedConfig = fileURLToPath(new URL('../node_modules/@ludiars/vestigium/tsconfig.json', import.meta.url));
if (!existsSync(compiler) || !existsSync(sharedConfig)) {
  const npm = process.env.npm_execpath;
  if (!npm || !existsSync(npm)) throw new Error('Run npm run typecheck so npm can prepare locked dependencies.');
  process.stdout.write('Preparing locked dependencies for this checkout.\n');
  run([npm, 'ci', '--ignore-scripts', '--include=dev', '--no-audit', '--no-fund'], 90000);
}
run([compiler, '-p', sharedConfig, '--typeRoots', 'node_modules/@types'], 30000);
