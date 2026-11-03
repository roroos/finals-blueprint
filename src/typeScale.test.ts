import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The interface has four text sizes (src/index.css): text-small 11, text-body 12, text-title 14, text-heading 16 px.
// Any other size (Tailwind's text-xs / text-sm..., text-[10px], an inline fontSize) is rejected.
const OTHER_SIZE = /\btext-(xs|sm|base|lg|[2-9]?xl)\b|\btext-\[[\d.]+(px|rem|em)\]|fontSize/;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.tsx$/.test(entry.name) ? [file] : [];
  });
}

describe('type scale', () => {
  it('defines exactly the four sizes 11 / 12 / 14 / 16 px', () => {
    const css = fs.readFileSync('src/index.css', 'utf8');
    const sizes = [...css.matchAll(/--text-(\w+):\s*(\d+)px/g)].map(([, name, px]) => `${name}=${px}`);
    expect(sizes).toEqual(['small=11', 'body=12', 'title=14', 'heading=16']);
  });

  it('uses only the four text sizes of the scale in components', () => {
    const offenders = sourceFiles('src').flatMap((file) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => [`${file}:${i + 1}`, line.match(OTHER_SIZE)?.[0]] as const)
        .filter(([, match]) => match),
    );
    expect(offenders).toEqual([]);
  });
});
