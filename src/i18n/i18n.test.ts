import { describe, expect, it } from 'vitest';
import { MESSAGES_EN } from './en';
import { makeI18n } from './index';

describe('i18n', () => {
  it('formats money and durations', () => {
    const { formatMoney, formatDuration } = makeI18n('en');
    expect(formatMoney(12500)).toBe('$12,500');
    expect(formatMoney(-1500)).toBe('-$1,500');
    expect(formatDuration(570)).toBe('9:30');
  });

  it('has no empty message', () => {
    for (const [key, message] of Object.entries(MESSAGES_EN)) {
      const text = typeof message === 'function' ? (message as (...a: unknown[]) => string)(1, 2, 3, 4) : message;
      expect(text.trim(), key).not.toBe('');
    }
  });
});
