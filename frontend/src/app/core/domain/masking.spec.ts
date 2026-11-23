import { maskDocument } from './masking';

describe('maskDocument', () => {
  it.each([
    ['1020304050', '•••••••050'],
    ['12.345.678-5', '••.•••.•78-5'],
    ['10.000.013-K', '••.•••.•13-K'],
    ['123', '•••'],
    ['', ''],
  ])('US-03-AC-02 %s → %s', (input, expected) => {
    expect(maskDocument(input)).toBe(expected);
  });
});
