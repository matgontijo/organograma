import { describe, expect, it } from 'vitest';
import { compactKey, normalize, parsePercent, parsePropertyRef } from '@/lib/normalize';

describe('normalize', () => {
  it('strips accents and lowercases', () => {
    expect(normalize('Maracujá')).toBe('maracuja');
    expect(normalize('  TÁRIK  ')).toBe('tarik');
  });

  it('compactKey removes separators', () => {
    expect(compactKey('Vila Raiô R104')).toBe('vilaraior104');
    expect(compactKey('Shis QI 13-Banca')).toBe('shisqi13banca');
  });
});

describe('parsePropertyRef', () => {
  it('parses percentage, name and matrícula', () => {
    const r = parsePropertyRef('18,06% Maracujá[7.814]');
    expect(r.percentual).toBeCloseTo(18.06);
    expect(r.nameKey).toBe('maracuja');
    expect(r.matricula).toBe('7814');
  });

  it('handles refs without matrícula', () => {
    const r = parsePropertyRef('100% Vila Raiô R104');
    expect(r.percentual).toBe(100);
    expect(r.nameKey).toBe('vilaraior104');
    expect(r.matricula).toBeUndefined();
  });

  it('handles compound matrícula', () => {
    const r = parsePropertyRef('100% Golf[25.978/26.223]');
    expect(r.matricula).toBe('25978/26223');
    expect(r.nameKey).toBe('golf');
  });
});

describe('parsePercent', () => {
  it('extracts a percentage', () => {
    expect(parsePercent('57,5%')).toBeCloseTo(57.5);
    expect(parsePercent('100')).toBe(100);
    expect(parsePercent('abc')).toBeUndefined();
  });
});
