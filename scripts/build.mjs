#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

console.log('Building VideoLane...');
try {
  execSync('npx tsc', { cwd: ROOT, stdio: 'inherit' });
  console.log('Build complete');
} catch {
  console.error('Build failed');
  process.exit(1);
}
