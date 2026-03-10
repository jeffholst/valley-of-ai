#!/usr/bin/env node

import { spawn } from 'child_process';

process.stdout.write('\x1Bc');

console.log("\n📌 Don't forget to run 'npm run generate:apps' if an app has been added\n");

const vite = spawn('node', ['./node_modules/vite/bin/vite.js', '--clearScreen', 'false'], {
  stdio: 'inherit',
  shell: false,
});

vite.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
