#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const CLI = join(ROOT, 'dist', 'cli.js');

const tests = [
  { name: 'help', cmd: `node ${CLI} --help` },
  { name: 'version', cmd: `node ${CLI} --version` },
  { name: 'doctor', cmd: `node ${CLI} doctor` },
  { name: 'demo', cmd: `node ${CLI} demo --out /tmp/videolane-demo-test` },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    console.log(`\n--- ${test.name} ---`);
    execSync(test.cmd, { cwd: ROOT, stdio: 'inherit', timeout: 30000 });
    passed++;
    console.log(`PASS: ${test.name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL: ${test.name}`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
