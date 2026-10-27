import { execFileSync } from 'node:child_process';

function git(args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    if (allowFail) return '';
    throw err;
  }
}

export function repoRoot() {
  return git(['rev-parse', '--show-toplevel']).trim();
}

export function refExists(ref) {
  return git(['rev-parse', '--verify', '--quiet', ref], { allowFail: true }).trim() !== '';
}

/** Best-effort base ref: explicit > upstream > origin/main > main. */
export function resolveBase(explicit) {
  const candidates = [explicit, '@{upstream}', 'origin/main', 'main'].filter(Boolean);
  for (const ref of candidates) if (refExists(ref)) return ref;
  return null;
}

function parseNameStatus(output) {
  const files = [];
  for (const line of output.split('\n')) {
    if (!line.trim()) continue;
    const [status, ...rest] = line.split('\t');
    // Renames: "R100\told\tnew" → use the new path.
    const path = rest[rest.length - 1];
    files.push({ status: status[0], path });
  }
  return files;
}

/** Files staged for commit. */
export function stagedFiles() {
  return parseNameStatus(git(['diff', '--cached', '--name-status', '--diff-filter=ACMR']));
}

/** Files changed between base and HEAD (merge-base aware). */
export function rangeFiles(base) {
  return parseNameStatus(git(['diff', '--name-status', '--diff-filter=ACMR', `${base}...HEAD`]));
}

/** Added lines of one file for the given mode. */
export function addedLines(path, { mode, base }) {
  const args =
    mode === 'staged'
      ? ['diff', '--cached', '--unified=0', '--', path]
      : ['diff', '--unified=0', `${base}...HEAD`, '--', path];
  const diff = git(args, { allowFail: true });
  return diff
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1));
}

/** Commits in base..HEAD with their messages and touched files (oldest first). */
export function commitsInRange(base) {
  const sep = '\u0000';
  const log = git(['log', '--reverse', `--format=%H${sep}%B${sep}`, `${base}..HEAD`], {
    allowFail: true,
  });
  const commits = [];
  const parts = log.split(sep);
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const hash = parts[i].trim();
    const message = parts[i + 1] ?? '';
    if (!hash) continue;
    const files = git(['show', '--pretty=format:', '--name-only', hash], { allowFail: true })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    commits.push({ hash, message, files });
  }
  return commits;
}

/** Reads a `Key: value` trailer from a commit message (case-insensitive key). */
export function readTrailer(message, key) {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'im');
  const m = message.match(re);
  return m ? m[1].trim() : null;
}
