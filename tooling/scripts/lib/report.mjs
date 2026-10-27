const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (useColor ? `\u001b[${code}m${s}\u001b[0m` : s);
export const c = {
  red: paint('31'),
  green: paint('32'),
  yellow: paint('33'),
  blue: paint('34'),
  dim: paint('2'),
  bold: paint('1'),
};

export class Report {
  constructor(title) {
    this.title = title;
    this.errors = [];
    this.warnings = [];
    this.infos = [];
  }
  error(msg, hint) {
    this.errors.push({ msg, hint });
  }
  warn(msg, hint) {
    this.warnings.push({ msg, hint });
  }
  info(msg) {
    this.infos.push({ msg });
  }
  /** Prints the report and returns the process exit code. */
  finish({ warningsAsErrors = false } = {}) {
    const out = [];
    out.push(c.bold(`\n${this.title}`));
    for (const i of this.infos) out.push(`  ${c.dim('·')} ${i.msg}`);
    for (const w of this.warnings) {
      out.push(`  ${c.yellow('⚠')} ${w.msg}`);
      if (w.hint) out.push(`    ${c.dim(w.hint)}`);
    }
    for (const e of this.errors) {
      out.push(`  ${c.red('✖')} ${e.msg}`);
      if (e.hint) out.push(`    ${c.dim(e.hint)}`);
    }
    const failed = this.errors.length > 0 || (warningsAsErrors && this.warnings.length > 0);
    out.push(
      failed
        ? c.red(`\n✖ ${this.errors.length} error(s), ${this.warnings.length} warning(s)\n`)
        : c.green(`\n✔ ok (${this.warnings.length} warning(s))\n`),
    );
    console.log(out.join('\n'));
    return failed ? 1 : 0;
  }
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}
