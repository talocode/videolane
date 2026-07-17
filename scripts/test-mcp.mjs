#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const MCP = join(ROOT, 'dist', 'mcp', 'server.js');

console.log('Testing MCP server...');

const proc = spawn('node', [MCP], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';

proc.stdout.on('data', (data) => {
  stdout += data.toString();
});

proc.stderr.on('data', (data) => {
  stderr += data.toString();
});

// Send initialize request
const initReq = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0' },
  },
});

proc.stdin.write(initReq + '\n');

// Send tools/list request
const listReq = JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
});

proc.stdin.write(listReq + '\n');

setTimeout(() => {
  proc.kill();

  console.log('STDOUT:', stdout.slice(0, 500));
  if (stderr) console.log('STDERR:', stderr.slice(0, 200));

  try {
    const responses = stdout.trim().split('\n').map(JSON.parse);
    const initResp = responses.find(r => r.id === 1);
    const listResp = responses.find(r => r.id === 2);

    if (initResp?.result?.serverInfo) {
      console.log('PASS: initialize returned server info');
    } else {
      console.log('FAIL: initialize did not return server info');
    }

    if (listResp?.result?.tools?.length > 0) {
      console.log(`PASS: tools/list returned ${listResp.result.tools.length} tools`);
    } else {
      console.log('FAIL: tools/list did not return tools');
    }
  } catch (err) {
    console.log('FAIL: could not parse responses');
  }

  process.exit(0);
}, 3000);
