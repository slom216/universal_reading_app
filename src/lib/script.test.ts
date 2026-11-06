import { stripHarakat } from './script';

it('strips Arabic vowel marks but keeps letters and hamza', () => {
  expect(stripHarakat('هٰذِهِ مَدْرَسَةٌ كَبِيرَةٌ، أَلَيْسَ كَذٰلِكَ؟')).toBe(
    'هذه مدرسة كبيرة، أليس كذلك؟',
  );
});
