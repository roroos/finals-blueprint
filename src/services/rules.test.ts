import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS, RULES, RULES_VERIFIED_ON, boxValue, cashoutDurationS, vaultPair } from './rules';

describe('rules', () => {
  it('box values by vault pair, from the wiki: $10k / $15k / $22k, final $25k', () => {
    expect([1, 2, 3, 4, 5, 6].map((v) => boxValue('round1', v))).toEqual([10_000, 10_000, 15_000, 15_000, 22_000, 22_000]);
    expect(boxValue('round2', 9)).toBe(22_000); // past the last vault: the last value
    expect(boxValue('final', 1)).toBe(25_000);
    expect([1, 2, 3, 4, 5, 6].map(vaultPair)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('cashout length: full in regular time, shortened late, never under 1 min (assumption)', () => {
    expect(cashoutDurationS('round1', 400)).toBe(130);
    expect(cashoutDurationS('final', 400)).toBe(120);
    expect(cashoutDurationS('round1', 30)).toBe(90); // 30 s left + 60 s overtime
    expect(cashoutDurationS('round1', -30)).toBe(60); // the minimum
    expect(cashoutDurationS('round1', 30, { ...DEFAULT_ASSUMPTIONS, lateCashoutShortens: false })).toBe(130);
  });

  it('docs/RULES.md has the same verification date and every rule number the code uses', () => {
    const doc = fs.readFileSync('docs/RULES.md', 'utf8');
    expect(doc).toContain(`Pages read on **${RULES_VERIFIED_ON}**`);
    for (const n of ['$10,000', '$15,000', '$22,000', '$25,000', '$50,000', '20 %', '15 %', '50 %', '27 s', '25 s', '$500', '$1,000', '2:10', '2:00', '7 s', '6 s']) {
      expect(doc, n).toContain(n);
    }
    expect(RULES.FINAL_TARGET_CASH).toBe(50_000);
    expect(fs.readFileSync('README.md', 'utf8')).toContain(`Rules last verified: **${RULES_VERIFIED_ON}**`);
  });

  it('every assumption is documented as UNKNOWN in rules.ts', () => {
    const source = fs.readFileSync('src/services/rules.ts', 'utf8');
    const block = source.slice(source.indexOf('export interface Assumptions'), source.indexOf('export const DEFAULT_ASSUMPTIONS'));
    for (const key of Object.keys(DEFAULT_ASSUMPTIONS)) {
      const doc = block.slice(0, block.indexOf(`  ${key}:`)).split('/**').pop() ?? '';
      expect(doc, key).toContain('UNKNOWN');
    }
  });
});
