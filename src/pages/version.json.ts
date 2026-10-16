import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Written on every build. /beheer polls this after publishing to know when the
// new commit is live. Reads .git directly because the build image may not have git.
function currentCommit(): string | null {
  try {
    const gitDir = join(process.cwd(), '.git');
    const head = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim();
    if (!head.startsWith('ref: ')) return head;
    const ref = head.slice(5);
    const loose = join(gitDir, ref);
    if (existsSync(loose)) return readFileSync(loose, 'utf8').trim();
    const packed = readFileSync(join(gitDir, 'packed-refs'), 'utf8');
    const line = packed.split('\n').find((l) => l.endsWith(` ${ref}`));
    return line ? line.split(' ')[0] : null;
  } catch {
    return null;
  }
}

export function GET() {
  return new Response(
    JSON.stringify({ commit: currentCommit(), builtAt: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
