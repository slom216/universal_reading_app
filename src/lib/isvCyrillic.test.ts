import { toCyrillic, toLatin } from './isvCyrillic';

describe('toCyrillic', () => {
  it('maps letters and digraphs and keeps case', () => {
    expect(toCyrillic('Ljubljana je lěpa, konj i džem.')).toBe(
      'Љубљана је лєпа, коњ и џем.',
    );
    expect(toCyrillic('ČĆĐŠŽ y')).toBe('ЧЋЂШЖ ы');
    expect(toCyrillic('NJ 42!')).toBe('Њ 42!');
  });
});

describe('toLatin', () => {
  it('maps Serbian Cyrillic to Latin, digraphs included', () => {
    expect(toLatin('Љубав, њива и џем у Ђурђевдан. Ћао!')).toBe(
      'Ljubav, njiva i džem u Đurđevdan. Ćao!',
    );
    expect(toLatin('ЉУБАВ Џ 42')).toBe('LJUBAV Dž 42');
  });
});
