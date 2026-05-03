import { spawn } from 'node:child_process';

const commands = [
  ['api', 'npm.cmd run dev:api'],
  ['web', 'npm.cmd run dev'],
];

const children = commands.map(([name, command]) => {
  const child = spawn('cmd.exe', ['/d', '/s', '/c', command], { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
  child.stdout.on('data', (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on('exit', (code) => {
    if (code && code !== 0) process.exitCode = code;
  });
  return child;
});

function stopAll() {
  for (const child of children) child.kill();
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
