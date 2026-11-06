import { toCyrillic } from './isvCyrillic';

describe('toCyrillic', () => {
  it('maps letters and digraphs and keeps case', () => {
    expect(toCyrillic('Ljubljana je lěpa, konj i džem.')).toBe('Љубљана је лєпа, коњ и џем.');
    expect(toCyrillic('ČĆĐŠŽ y')).toBe('ЧЋЂШЖ ы');
    expect(toCyrillic('NJ 42!')).toBe('Њ 42!');
  });
});
