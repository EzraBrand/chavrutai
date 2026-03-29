import { describe, it, expect, beforeAll } from 'vitest';
import {
  removeNikud,
  splitHebrewText,
  processHebrewTextCore,
  replaceTerms,
  splitEnglishText,
  processEnglishText,
  containsHebrew,
  normalizeApiText,
  TEXT_PROCESSING_VERSION
} from '../shared/text-processing';
import { parseNumbers, tryParseCardinal } from '../shared/number-parser';

describe('Text Processing Module', () => {
  
  describe('removeNikud', () => {
    it('removes vowel points from Hebrew text', () => {
      const withNikud = 'שָׁלוֹם';
      const withoutNikud = 'שלום';
      expect(removeNikud(withNikud)).toBe(withoutNikud);
    });

    it('preserves text without nikud', () => {
      const text = 'שלום עולם';
      expect(removeNikud(text)).toBe(text);
    });

    it('handles empty string', () => {
      expect(removeNikud('')).toBe('');
    });

    it('removes cantillation marks', () => {
      const withCantillation = 'בְּרֵאשִׁ֖ית';
      const result = removeNikud(withCantillation);
      expect(result).not.toMatch(/[\u0591-\u05AF]/);
    });
  });

  describe('splitHebrewText', () => {
    it('splits on periods', () => {
      const text = 'משפט ראשון. משפט שני.';
      const result = splitHebrewText(text);
      expect(result).toContain('\n');
    });

    it('preserves ellipses without splitting (issue #74)', () => {
      const text = 'הרי הוא אומר ״כי ימצא חלל באדמה ... ויצאו זקניך ושופטיך״.';
      const result = splitHebrewText(text);
      expect(result).toContain('...');
      expect(result).not.toMatch(/\.\n\.\n\./);
    });

    it('splits on colons', () => {
      const text = 'אמר רבי יהודה: הלכה כמותו';
      const result = splitHebrewText(text);
      expect(result).toContain('\n');
    });

    it('handles Mishnah markers', () => {
      const text = 'מתני׳ מאימתי קורין';
      const result = splitHebrewText(text);
      expect(result).toContain('מתני׳\n');
    });

    it('handles Gemara markers', () => {
      const text = 'גמ׳ מנא הני מילי';
      const result = splitHebrewText(text);
      expect(result).toContain('גמ׳\n');
    });

    it('handles empty string', () => {
      expect(splitHebrewText('')).toBe('');
    });

    it('preserves HTML tags', () => {
      const text = '<b>טקסט מודגש</b>. טקסט רגיל.';
      const result = splitHebrewText(text);
      expect(result).toContain('<b>');
      expect(result).toContain('</b>');
    });
  });

  describe('processHebrewTextCore', () => {
    it('removes nikud and splits text', () => {
      const text = 'שָׁלוֹם. עוֹלָם.';
      const result = processHebrewTextCore(text);
      expect(result).not.toMatch(/[\u05B0-\u05BD]/);
      expect(result).toContain('\n');
    });

    it('normalizes whitespace', () => {
      const text = 'טקסט   עם   רווחים';
      const result = processHebrewTextCore(text);
      expect(result).not.toContain('  ');
    });

    it('handles empty string', () => {
      expect(processHebrewTextCore('')).toBe('');
    });
  });

  describe('replaceTerms', () => {
    it('replaces Rabbi with R\'', () => {
      const text = 'Rabbi Akiva said';
      const result = replaceTerms(text);
      expect(result).toContain("R'");
      expect(result).not.toContain('Rabbi');
    });

    it('handles Rabbi vocative (comma) as exclamation', () => {
      const text = 'Rabbi, help me!';
      const result = replaceTerms(text);
      expect(result).toBe('Rabbi! help me!');
    });

    it('preserves Rabbis (plural)', () => {
      const text = 'The Rabbis taught';
      const result = replaceTerms(text);
      expect(result).toContain('Rabbis');
    });

    it('replaces Gemara with Talmud', () => {
      const text = 'The Gemara states';
      const result = replaceTerms(text);
      expect(result).toContain('Talmud');
    });

    it('replaces "The Sages taught" with "A baraita states"', () => {
      const text = 'The Sages taught in a mishna';
      const result = replaceTerms(text);
      expect(result).toContain('A baraita states');
    });

    it('removes redundant "in a baraita" after replacement', () => {
      const text = 'The Sages taught in a baraita';
      const result = replaceTerms(text);
      expect(result).toBe('A baraita states');
      expect(result).not.toContain('in a baraita');
    });

    it('replaces Divine Presence with Shekhina', () => {
      const text = 'The Divine Presence rested';
      const result = replaceTerms(text);
      expect(result).toContain('Shekhina');
    });

    it('replaces phylacteries with tefillin', () => {
      const text = 'He put on his phylacteries';
      const result = replaceTerms(text);
      expect(result).toContain('tefillin');
    });

    it('replaces gentile with non-Jew', () => {
      const text = 'A gentile came';
      const result = replaceTerms(text);
      expect(result).toContain('non-Jew');
    });

    it('replaces unambiguous ordinal numbers', () => {
      // "twentieth" → "20th" via ordinals_basic lookup
      expect(replaceTerms('the twentieth day')).toContain('20th');
      expect(replaceTerms('the sixtieth year')).toContain('60th');
      // "third", "first", "second", "fifth", "tenth" are intentionally NOT
      // converted globally — they are ambiguous (ordinal vs fractional, or
      // produce awkward output like "1st opinion"). They are only converted
      // in specific time-context patterns via time_ordinals.
      expect(replaceTerms('the third time')).toContain('third');
    });

    it('replaces fractional ordinals', () => {
      const text = 'one-third of the amount';
      const result = replaceTerms(text);
      expect(result).toContain('1/3rd');
    });

    it('replaces improper fractional ordinals like five-fourths', () => {
      expect(replaceTerms('five-fourths')).toContain('5/4ths');
      expect(replaceTerms('five fourths')).toContain('5/4ths');
    });

    it('replaces three-eighths fraction', () => {
      expect(replaceTerms('three-eighths')).toContain('3/8ths');
      expect(replaceTerms('three eighths')).toContain('3/8ths');
    });

    it('replaces three-and-one-third mixed number', () => {
      expect(replaceTerms('three-and-one-third')).toContain('3⅓');
      expect(replaceTerms('three and one-third')).toContain('3⅓');
    });

    it('replaces thirty-three and one-third', () => {
      expect(replaceTerms('thirty-three and one-third')).toContain('33⅓');
    });

    it('replaces ninety-three and one-third', () => {
      expect(replaceTerms('ninety-three and one-third')).toContain('93⅓');
    });

    it('replaces one and one-half', () => {
      expect(replaceTerms('one-and-one-half')).toContain('1½');
      expect(replaceTerms('one and one-half')).toContain('1½');
    });

    it('replaces one hundred dinars', () => {
      expect(replaceTerms('one hundred dinars')).toContain('100 dinars');
    });

    it('replaces capitalized One and one half', () => {
      expect(replaceTerms('One and one half')).toContain('1½');
    });

    it('replaces one hundred thirty', () => {
      expect(replaceTerms('one hundred thirty')).toContain('130');
    });

    it('replaces A quarter', () => {
      expect(replaceTerms('A quarter')).toContain('1/4th');
    });

    it('replaces five and twenty', () => {
      expect(replaceTerms('five and twenty')).toContain('25');
    });

    it('replaces two hundred ten', () => {
      expect(replaceTerms('two hundred ten')).toContain('210');
    });

    it('replaces fifth year without the', () => {
      expect(replaceTerms('fifth year')).toContain('5th year');
    });

    it('replaces seven-twentieths', () => {
      expect(replaceTerms('seven-twentieths')).toContain('7/20ths');
      expect(replaceTerms('seven twentieths')).toContain('7/20ths');
    });

    it('replaces hour-and-a-quarter', () => {
      expect(replaceTerms('hour-and-a-quarter')).toContain('1¼ hours');
    });

    it('replaces nine-and-a-half', () => {
      expect(replaceTerms('nine-and-a-half')).toContain('9½');
    });

    it('replaces six-and-a-half', () => {
      expect(replaceTerms('six-and-a-half')).toContain('6½');
    });

    it('replaces twenty-nine and a half', () => {
      expect(replaceTerms('twenty-nine and a half')).toContain('29½');
    });

    it('replaces compound ordinals', () => {
      const text = 'the twenty-first day';
      const result = replaceTerms(text);
      expect(result).toContain('21st');
    });

    it('handles empty string', () => {
      expect(replaceTerms('')).toBe('');
    });

    it('is case insensitive for most terms', () => {
      const text = 'GEMARA says and gemara states';
      const result = replaceTerms(text);
      expect(result.match(/Talmud/g)?.length).toBe(2);
    });

    it('handles punctuation-terminated terms correctly', () => {
      expect(replaceTerms('Master of the Universe, help us')).toBe('God! help us');
      expect(replaceTerms('the Holy One, Blessed be He, said')).toBe('God said');
    });
  });

  describe('splitEnglishText', () => {
    it('splits on periods', () => {
      const text = 'First sentence. Second sentence.';
      const result = splitEnglishText(text);
      expect(result.split('\n').length).toBeGreaterThan(1);
    });

    it('splits on question marks', () => {
      const text = 'Is this true? Yes it is.';
      const result = splitEnglishText(text);
      expect(result).toContain('?\n');
    });

    it('splits on semicolons', () => {
      const text = 'First part; second part.';
      const result = splitEnglishText(text);
      expect(result).toContain(';\n');
    });

    it('preserves abbreviations like i.e.', () => {
      const text = 'This is true, i.e. it is correct.';
      const result = splitEnglishText(text);
      expect(result).toContain('i.e.');
    });

    it('preserves abbreviations like e.g.', () => {
      const text = 'Fruits, e.g. apples and oranges.';
      const result = splitEnglishText(text);
      expect(result).toContain('e.g.');
    });

    it('preserves abbreviations like etc.', () => {
      const text = 'Apples, oranges, etc. are fruits.';
      const result = splitEnglishText(text);
      expect(result).toContain('etc.');
    });

    it('protects "son of" patterns', () => {
      const text = 'Rabbi Yosef, son of Rabbi Hiyya, said';
      const result = splitEnglishText(text);
      expect(result).toContain('son of Rabbi Hiyya');
    });

    it('protects "father-in-law of" patterns', () => {
      const text = "Agra, the father-in-law of R' Abba, had";
      const result = splitEnglishText(text);
      expect(result).toContain("the father-in-law of R' Abba");
      expect(result).not.toMatch(/Agra,\s*\n/);
    });

    it('protects "father of" patterns', () => {
      const text = "Shmuel, the father of R' Yitzchak, said";
      const result = splitEnglishText(text);
      expect(result).toContain("the father of R' Yitzchak");
      expect(result).not.toMatch(/Shmuel,\s*\n/);
    });

    it('protects "brother of" patterns', () => {
      const text = "Rav Huna, the brother of R' Yosi, taught";
      const result = splitEnglishText(text);
      expect(result).toContain("the brother of R' Yosi");
      expect(result).not.toMatch(/Rav Huna,\s*\n/);
    });

    it('splits on bolded colons', () => {
      const text = '<b>MISHNA:</b> The text begins';
      const result = splitEnglishText(text);
      expect(result).toContain(':\n');
    });

    it('preserves ellipses', () => {
      const text = 'And so... the story continues.';
      const result = splitEnglishText(text);
      expect(result).toContain('...');
    });

    it('handles period + quote as unit', () => {
      const text = 'He said "hello." Then left.';
      const result = splitEnglishText(text);
      expect(result).toContain('."');
    });

    it('handles empty string', () => {
      expect(splitEnglishText('')).toBe('');
    });

    it('converts br tags to newlines', () => {
      const text = 'Line one<br>Line two';
      const result = splitEnglishText(text);
      expect(result).toContain('\n');
    });
  });

  describe('processEnglishText', () => {
    it('applies term replacements and splits', () => {
      const text = 'Rabbi Akiva said. The Gemara explains.';
      const result = processEnglishText(text);
      expect(result).toContain("R'");
      expect(result).toContain('Talmud');
      expect(result).toContain('\n');
    });

    it('normalizes whitespace', () => {
      const text = 'Text   with   extra   spaces.';
      const result = processEnglishText(text);
      expect(result).not.toContain('  ');
    });

    it('handles empty string', () => {
      expect(processEnglishText('')).toBe('');
    });
  });

  describe('containsHebrew', () => {
    it('returns true for Hebrew text', () => {
      expect(containsHebrew('שלום')).toBe(true);
    });

    it('returns false for English text', () => {
      expect(containsHebrew('Hello')).toBe(false);
    });

    it('returns true for mixed text', () => {
      expect(containsHebrew('Hello שלום')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(containsHebrew('')).toBe(false);
    });
  });

  describe('normalizeApiText', () => {
    it('joins array with double newlines', () => {
      const arr = ['First', 'Second', 'Third'];
      const result = normalizeApiText(arr);
      expect(result).toBe('First\n\nSecond\n\nThird');
    });

    it('returns string as-is', () => {
      const text = 'Single string';
      expect(normalizeApiText(text)).toBe(text);
    });

    it('handles empty array', () => {
      expect(normalizeApiText([])).toBe('');
    });

    it('handles empty string', () => {
      expect(normalizeApiText('')).toBe('');
    });
  });

  describe('TEXT_PROCESSING_VERSION', () => {
    it('exports version string', () => {
      expect(['v1', 'v2']).toContain(TEXT_PROCESSING_VERSION);
    });
  });
});

describe('Known Bug Regression Tests', () => {
  
  describe('Bug #40: Baraita duplication', () => {
    it('does not produce "A baraita states in a baraita"', () => {
      const text = 'The Sages taught in a baraita: The rule is...';
      const result = replaceTerms(text);
      expect(result).not.toContain('A baraita states in a baraita');
      expect(result).toContain('A baraita states');
    });

    it('handles italic baraita', () => {
      const text = 'The Sages taught in a <i>baraita</i>: The rule';
      const result = replaceTerms(text);
      expect(result).not.toContain('in a');
    });
  });

  describe('Bug #99: punctuation cluster splitting', () => {
    it('keeps ?\'\" together as a unit (Berakhot 7b.1)', () => {
      const text = 'is it?\'"';
      const result = splitEnglishText(text);
      expect(result).toContain('it?\'"');
      expect(result).not.toMatch(/\?\'\n"/);
    });

    it('keeps .\'\" together as a unit', () => {
      const text = 'said it.\'"';
      const result = splitEnglishText(text);
      expect(result).toContain('.\'"');
    });

    it('keeps ,\'\" together as a unit', () => {
      const text = 'said it,\'"';
      const result = splitEnglishText(text);
      expect(result).toContain(',\'"');
    });

    it('keeps ;\'\" together as a unit', () => {
      const text = 'said it;\'"';
      const result = splitEnglishText(text);
      expect(result).toContain(';\'"');
    });

    it('still splits single quote patterns correctly', () => {
      const text = 'he said." Then left.';
      const result = splitEnglishText(text);
      expect(result).toContain('."\n');
    });
  });

  describe('Intentionally excluded ambiguous words', () => {
    // These words are NOT converted — they are ambiguous in prose context.
    // Ordinals "first/second/third/fifth/tenth" read better as words.
    // "one" is often a pronoun ("does one recite", "one must").
    // "two" reads more naturally in prose ("recites two blessings").
    // Both "one" and "two" were absent from the original static lookup table.
    it('does not convert standalone "first"', () => {
      expect(replaceTerms('the first opinion')).toContain('first');
    });
    it('does not convert standalone "second"', () => {
      expect(replaceTerms('the second opinion')).toContain('second');
    });
    it('does not convert standalone "third" (non-time context)', () => {
      expect(replaceTerms('a third approach')).toContain('third');
    });
    it('does not convert standalone "fifth"', () => {
      expect(replaceTerms('the fifth view')).toContain('fifth');
    });
    it('does not convert standalone "tenth"', () => {
      expect(replaceTerms('the tenth position')).toContain('tenth');
    });
    it('does not convert standalone "one" — pronoun usage', () => {
      expect(replaceTerms('does one recite a blessing')).toContain('one recite');
    });
    it('does not convert standalone "one" — "one must"', () => {
      expect(replaceTerms('one must be careful')).toContain('one must');
    });
    it('does not convert standalone "two" — prose usage', () => {
      expect(replaceTerms('recites two blessings')).toContain('two blessings');
    });
    it('does not convert standalone "two" — "these two"', () => {
      expect(replaceTerms('these two opinions differ')).toContain('two opinions');
    });
    // But "one" and "two" as part of a larger number still convert:
    it('still converts "one hundred" (one is not standalone)', () => {
      expect(replaceTerms('one hundred')).toContain('100');
    });
    it('still converts "two thousand" (two is not standalone)', () => {
      expect(replaceTerms('two thousand')).toContain('2,000');
    });
    it('still converts "one thousand" (one is not standalone)', () => {
      expect(replaceTerms('one thousand')).toContain('1,000');
    });
    it('still converts "twenty-one" (one is not standalone)', () => {
      expect(replaceTerms('twenty-one')).toContain('21');
    });
    it('still converts "twenty-two" (two is not standalone)', () => {
      expect(replaceTerms('twenty-two')).toContain('22');
    });
  });

  describe('Bug #78: etc., splitting', () => {
    it('does not split etc. when followed by comma', () => {
      const text = 'apples, oranges, etc., and more.';
      const result = splitEnglishText(text);
      expect(result).toContain('etc.,');
    });
  });
});

// =============================================================================
// NUMBER PARSER — UNIT TESTS (shared/number-parser.ts)
// =============================================================================

describe('Number Parser — tryParseCardinal', () => {
  describe('single number words', () => {
    it('parses zero', () => expect(tryParseCardinal('zero')).toBe(0));
    it('parses one', () => expect(tryParseCardinal('one')).toBe(1));
    it('parses two', () => expect(tryParseCardinal('two')).toBe(2));
    it('parses three', () => expect(tryParseCardinal('three')).toBe(3));
    it('parses four', () => expect(tryParseCardinal('four')).toBe(4));
    it('parses five', () => expect(tryParseCardinal('five')).toBe(5));
    it('parses six', () => expect(tryParseCardinal('six')).toBe(6));
    it('parses seven', () => expect(tryParseCardinal('seven')).toBe(7));
    it('parses eight', () => expect(tryParseCardinal('eight')).toBe(8));
    it('parses nine', () => expect(tryParseCardinal('nine')).toBe(9));
    it('parses ten', () => expect(tryParseCardinal('ten')).toBe(10));
    it('parses eleven', () => expect(tryParseCardinal('eleven')).toBe(11));
    it('parses twelve', () => expect(tryParseCardinal('twelve')).toBe(12));
    it('parses thirteen', () => expect(tryParseCardinal('thirteen')).toBe(13));
    it('parses fourteen', () => expect(tryParseCardinal('fourteen')).toBe(14));
    it('parses fifteen', () => expect(tryParseCardinal('fifteen')).toBe(15));
    it('parses sixteen', () => expect(tryParseCardinal('sixteen')).toBe(16));
    it('parses seventeen', () => expect(tryParseCardinal('seventeen')).toBe(17));
    it('parses eighteen', () => expect(tryParseCardinal('eighteen')).toBe(18));
    it('parses nineteen', () => expect(tryParseCardinal('nineteen')).toBe(19));
    it('parses twenty', () => expect(tryParseCardinal('twenty')).toBe(20));
    it('parses thirty', () => expect(tryParseCardinal('thirty')).toBe(30));
    it('parses forty', () => expect(tryParseCardinal('forty')).toBe(40));
    it('parses fifty', () => expect(tryParseCardinal('fifty')).toBe(50));
    it('parses sixty', () => expect(tryParseCardinal('sixty')).toBe(60));
    it('parses seventy', () => expect(tryParseCardinal('seventy')).toBe(70));
    it('parses eighty', () => expect(tryParseCardinal('eighty')).toBe(80));
    it('parses ninety', () => expect(tryParseCardinal('ninety')).toBe(90));
    it('parses hundred', () => expect(tryParseCardinal('hundred')).toBe(100));
    it('parses thousand', () => expect(tryParseCardinal('thousand')).toBe(1000));
    it('parses million', () => expect(tryParseCardinal('million')).toBe(1_000_000));
    it('parses billion', () => expect(tryParseCardinal('billion')).toBe(1_000_000_000));
  });

  describe('tens + units (hyphenated and spaced)', () => {
    it('parses twenty-one', () => expect(tryParseCardinal('twenty-one')).toBe(21));
    it('parses twenty one (spaced)', () => expect(tryParseCardinal('twenty one')).toBe(21));
    it('parses twenty-three', () => expect(tryParseCardinal('twenty-three')).toBe(23));
    it('parses twenty three (spaced)', () => expect(tryParseCardinal('twenty three')).toBe(23));
    it('parses twenty-nine', () => expect(tryParseCardinal('twenty-nine')).toBe(29));
    it('parses thirty-nine', () => expect(tryParseCardinal('thirty-nine')).toBe(39));
    it('parses forty-two', () => expect(tryParseCardinal('forty-two')).toBe(42));
    it('parses fifty-five', () => expect(tryParseCardinal('fifty-five')).toBe(55));
    it('parses sixty-six', () => expect(tryParseCardinal('sixty-six')).toBe(66));
    it('parses seventy-seven', () => expect(tryParseCardinal('seventy-seven')).toBe(77));
    it('parses eighty-eight', () => expect(tryParseCardinal('eighty-eight')).toBe(88));
    it('parses ninety-nine', () => expect(tryParseCardinal('ninety-nine')).toBe(99));
  });

  describe('hundreds', () => {
    it('parses one hundred', () => expect(tryParseCardinal('one hundred')).toBe(100));
    it('parses two hundred', () => expect(tryParseCardinal('two hundred')).toBe(200));
    it('parses three hundred', () => expect(tryParseCardinal('three hundred')).toBe(300));
    it('parses six hundred', () => expect(tryParseCardinal('six hundred')).toBe(600));
    it('parses nine hundred', () => expect(tryParseCardinal('nine hundred')).toBe(900));
    it('parses one hundred and ten', () => expect(tryParseCardinal('one hundred and ten')).toBe(110));
    it('parses one hundred and twenty', () => expect(tryParseCardinal('one hundred and twenty')).toBe(120));
    it('parses one hundred and fifty', () => expect(tryParseCardinal('one hundred and fifty')).toBe(150));
    it('parses two hundred and ten', () => expect(tryParseCardinal('two hundred and ten')).toBe(210));
    it('parses three hundred and sixty-five', () => expect(tryParseCardinal('three hundred and sixty-five')).toBe(365));
    it('parses six hundred and thirteen', () => expect(tryParseCardinal('six hundred and thirteen')).toBe(613));
    it('parses nine hundred and ninety-nine', () => expect(tryParseCardinal('nine hundred and ninety-nine')).toBe(999));
  });

  describe('compound hundreds + units (formerly broken by partial matching)', () => {
    it('parses one hundred and three', () => expect(tryParseCardinal('one hundred and three')).toBe(103));
    it('parses one hundred and twenty three', () => expect(tryParseCardinal('one hundred and twenty three')).toBe(123));
    it('parses a hundred and twenty three', () => expect(tryParseCardinal('a hundred and twenty three')).toBe(123));
    it('parses seven hundred and forty five', () => expect(tryParseCardinal('seven hundred and forty five')).toBe(745));
    it('parses eight hundred and thirty two', () => expect(tryParseCardinal('eight hundred and thirty two')).toBe(832));
    it('parses two hundred and forty eight', () => expect(tryParseCardinal('two hundred and forty eight')).toBe(248));
    it('parses three hundred and eighteen', () => expect(tryParseCardinal('three hundred and eighteen')).toBe(318));
    it('parses four hundred and thirty', () => expect(tryParseCardinal('four hundred and thirty')).toBe(430));
  });

  describe('"a"/"an" prefix', () => {
    it('parses a hundred', () => expect(tryParseCardinal('a hundred')).toBe(100));
    it('parses a thousand', () => expect(tryParseCardinal('a thousand')).toBe(1000));
    it('parses a million', () => expect(tryParseCardinal('a million')).toBe(1_000_000));
    it('parses a hundred and twenty', () => expect(tryParseCardinal('a hundred and twenty')).toBe(120));
    it('parses a hundred and twenty three', () => expect(tryParseCardinal('a hundred and twenty three')).toBe(123));
    it('returns null for "a twenty" — invalid usage', () => expect(tryParseCardinal('a twenty')).toBeNull());
    it('returns null for "a one" — invalid usage', () => expect(tryParseCardinal('a one')).toBeNull());
    it('returns null for "a five" — invalid usage', () => expect(tryParseCardinal('a five')).toBeNull());
  });

  describe('thousands', () => {
    it('parses one thousand', () => expect(tryParseCardinal('one thousand')).toBe(1_000));
    it('parses two thousand', () => expect(tryParseCardinal('two thousand')).toBe(2_000));
    it('parses ten thousand', () => expect(tryParseCardinal('ten thousand')).toBe(10_000));
    it('parses twenty thousand', () => expect(tryParseCardinal('twenty thousand')).toBe(20_000));
    it('parses one hundred thousand', () => expect(tryParseCardinal('one hundred thousand')).toBe(100_000));
    it('parses six hundred thousand', () => expect(tryParseCardinal('six hundred thousand')).toBe(600_000));
    it('parses one thousand two hundred', () => expect(tryParseCardinal('one thousand two hundred')).toBe(1_200));
    it('parses four thousand three hundred and twenty', () => expect(tryParseCardinal('four thousand three hundred and twenty')).toBe(4_320));
    it('parses five thousand eight hundred and eighty-eight', () => expect(tryParseCardinal('five thousand eight hundred and eighty-eight')).toBe(5_888));
    it('parses forty-two thousand three hundred and sixty', () => expect(tryParseCardinal('forty-two thousand three hundred and sixty')).toBe(42_360));
  });

  describe('millions and billions', () => {
    it('parses one million', () => expect(tryParseCardinal('one million')).toBe(1_000_000));
    it('parses four million', () => expect(tryParseCardinal('four million')).toBe(4_000_000));
    it('parses forty million', () => expect(tryParseCardinal('forty million')).toBe(40_000_000));
    it('parses six million five thousand and two', () => expect(tryParseCardinal('six million five thousand and two')).toBe(6_005_002));
    it('parses one billion', () => expect(tryParseCardinal('one billion')).toBe(1_000_000_000));
  });

  describe('biblical inversion patterns (small and large)', () => {
    it('parses five and twenty (5+20 = 25)', () => expect(tryParseCardinal('five and twenty')).toBe(25));
    it('parses two and twenty (2+20 = 22)', () => expect(tryParseCardinal('two and twenty')).toBe(22));
    it('parses three and twenty (3+20 = 23)', () => expect(tryParseCardinal('three and twenty')).toBe(23));
    it('parses six and thirty (6+30 = 36)', () => expect(tryParseCardinal('six and thirty')).toBe(36));
    it('parses two and twenty thousand (22×1000 = 22,000)', () => expect(tryParseCardinal('two and twenty thousand')).toBe(22_000));
    it('parses forty and two thousand three hundred and sixty (42,360)', () => {
      expect(tryParseCardinal('forty and two thousand three hundred and sixty')).toBe(42_360);
    });
  });

  describe('case insensitivity', () => {
    it('parses uppercase ONE', () => expect(tryParseCardinal('ONE')).toBe(1));
    it('parses title-case A Hundred', () => expect(tryParseCardinal('A Hundred')).toBe(100));
    it('parses mixed-case A Hundred And Twenty', () => expect(tryParseCardinal('A Hundred And Twenty')).toBe(120));
    it('parses Nine Hundred', () => expect(tryParseCardinal('Nine Hundred')).toBe(900));
  });
});

describe('Number Parser — parseNumbers (in-sentence replacement)', () => {
  it('replaces a single number word in a sentence', () => {
    expect(parseNumbers('He had seven sheep')).toBe('He had 7 sheep');
  });

  it('replaces a compound number in a sentence', () => {
    expect(parseNumbers('He lived a hundred and twenty years')).toBe('He lived 120 years');
  });

  it('replaces multiple numbers in one string', () => {
    expect(parseNumbers('There were seven hundred men and three hundred women')).toBe('There were 700 men and 300 women');
  });

  it('replaces a large compound number', () => {
    expect(parseNumbers('forty and two thousand three hundred and sixty returned')).toBe('42,360 returned');
  });

  it('leaves non-number text unchanged', () => {
    expect(parseNumbers('He went to the market')).toBe('He went to the market');
  });

  it('leaves already-digit strings unchanged', () => {
    expect(parseNumbers('There were 120 men')).toBe('There were 120 men');
  });

  it('handles empty string', () => {
    expect(parseNumbers('')).toBe('');
  });

  // Standalone exclusions — "one" and "two" left as prose words
  it('leaves standalone "one" unchanged — pronoun usage', () => {
    expect(parseNumbers('does one recite a blessing')).toBe('does one recite a blessing');
  });
  it('leaves standalone "one" unchanged — "one must"', () => {
    expect(parseNumbers('one must be careful')).toBe('one must be careful');
  });
  it('leaves standalone "two" unchanged — prose usage', () => {
    expect(parseNumbers('recites two blessings')).toBe('recites two blessings');
  });
  it('leaves standalone "two" unchanged — "these two"', () => {
    expect(parseNumbers('these two opinions differ')).toBe('these two opinions differ');
  });
  // But "one"/"two" as part of a larger number phrase are still converted
  it('still converts "one hundred" — one is not standalone', () => {
    expect(parseNumbers('one hundred')).toBe('100');
  });
  it('still converts "two thousand" — two is not standalone', () => {
    expect(parseNumbers('two thousand')).toBe('2,000');
  });
  it('still converts "twenty-one" — one is not standalone', () => {
    expect(parseNumbers('twenty-one')).toBe('21');
  });
  it('still converts "twenty-two" — two is not standalone', () => {
    expect(parseNumbers('twenty-two')).toBe('22');
  });

  it('is case-insensitive (all caps)', () => {
    expect(parseNumbers('A HUNDRED AND TWENTY THREE')).toBe('123');
  });

  it('formats numbers below 1,000 without commas', () => {
    expect(parseNumbers('nine hundred and ninety-nine')).toBe('999');
  });

  it('formats thousands with commas', () => {
    expect(parseNumbers('one thousand')).toBe('1,000');
    expect(parseNumbers('forty-two thousand three hundred and sixty')).toBe('42,360');
  });

  it('formats millions with commas', () => {
    expect(parseNumbers('one million')).toBe('1,000,000');
    expect(parseNumbers('six hundred thousand')).toBe('600,000');
  });
});

// =============================================================================
// NUMBER PARSER — REGRESSION: every formerly hard-coded entry still works
// =============================================================================

describe('Number Parser — regression against former lookup table entries', () => {
  it('forty million', () => expect(replaceTerms('forty million')).toContain('40,000,000'));
  it('four million', () => expect(replaceTerms('four million')).toContain('4,000,000'));
  it('one million', () => expect(replaceTerms('one million')).toContain('1,000,000'));
  it('eight hundred thousand', () => expect(replaceTerms('eight hundred thousand')).toContain('800,000'));
  it('six hundred thousand', () => expect(replaceTerms('six hundred thousand')).toContain('600,000'));
  it('one hundred thousand', () => expect(replaceTerms('one hundred thousand')).toContain('100,000'));
  it('eighty thousand', () => expect(replaceTerms('eighty thousand')).toContain('80,000'));
  it('seventy thousand', () => expect(replaceTerms('seventy thousand')).toContain('70,000'));
  it('sixty thousand', () => expect(replaceTerms('sixty thousand')).toContain('60,000'));
  it('fifty thousand', () => expect(replaceTerms('fifty thousand')).toContain('50,000'));
  it('forty thousand', () => expect(replaceTerms('forty thousand')).toContain('40,000'));
  it('twenty-four thousand', () => expect(replaceTerms('twenty-four thousand')).toContain('24,000'));
  it('twenty thousand', () => expect(replaceTerms('twenty thousand')).toContain('20,000'));
  it('eighteen thousand', () => expect(replaceTerms('eighteen thousand')).toContain('18,000'));
  it('sixteen thousand', () => expect(replaceTerms('sixteen thousand')).toContain('16,000'));
  it('fifteen thousand', () => expect(replaceTerms('fifteen thousand')).toContain('15,000'));
  it('thirteen thousand', () => expect(replaceTerms('thirteen thousand')).toContain('13,000'));
  it('twelve thousand', () => expect(replaceTerms('twelve thousand')).toContain('12,000'));
  it('ten thousand', () => expect(replaceTerms('ten thousand')).toContain('10,000'));
  it('nine thousand', () => expect(replaceTerms('nine thousand')).toContain('9,000'));
  it('eight thousand', () => expect(replaceTerms('eight thousand')).toContain('8,000'));
  it('seven thousand', () => expect(replaceTerms('seven thousand')).toContain('7,000'));
  it('six thousand', () => expect(replaceTerms('six thousand')).toContain('6,000'));
  it('five thousand eight hundred and eighty-eight', () => expect(replaceTerms('five thousand eight hundred and eighty-eight')).toContain('5,888'));
  it('five thousand', () => expect(replaceTerms('five thousand')).toContain('5,000'));
  it('four thousand', () => expect(replaceTerms('four thousand')).toContain('4,000'));
  it('three thousand', () => expect(replaceTerms('three thousand')).toContain('3,000'));
  it('two thousand', () => expect(replaceTerms('two thousand')).toContain('2,000'));
  it('one thousand', () => expect(replaceTerms('one thousand')).toContain('1,000'));
  it('a thousand', () => expect(replaceTerms('a thousand')).toContain('1,000'));
  it('thousand (standalone)', () => expect(replaceTerms('thousand')).toContain('1,000'));
  it('nine hundred', () => expect(replaceTerms('nine hundred')).toContain('900'));
  it('eight hundred', () => expect(replaceTerms('eight hundred')).toContain('800'));
  it('seven hundred', () => expect(replaceTerms('seven hundred')).toContain('700'));
  it('six hundred and thirteen', () => expect(replaceTerms('six hundred and thirteen')).toContain('613'));
  it('six hundred', () => expect(replaceTerms('six hundred')).toContain('600'));
  it('five hundred', () => expect(replaceTerms('five hundred')).toContain('500'));
  it('four hundred and thirty', () => expect(replaceTerms('four hundred and thirty')).toContain('430'));
  it('four hundred', () => expect(replaceTerms('four hundred')).toContain('400'));
  it('three hundred and sixty-five', () => expect(replaceTerms('three hundred and sixty-five')).toContain('365'));
  it('three hundred and sixty', () => expect(replaceTerms('three hundred and sixty')).toContain('360'));
  it('three hundred and fifty', () => expect(replaceTerms('three hundred and fifty')).toContain('350'));
  it('three hundred and eighteen', () => expect(replaceTerms('three hundred and eighteen')).toContain('318'));
  it('three hundred', () => expect(replaceTerms('three hundred')).toContain('300'));
  it('two hundred and fifty', () => expect(replaceTerms('two hundred and fifty')).toContain('250'));
  it('two hundred and forty-eight', () => expect(replaceTerms('two hundred and forty-eight')).toContain('248'));
  it('two hundred and forty', () => expect(replaceTerms('two hundred and forty')).toContain('240'));
  it('two hundred and ten', () => expect(replaceTerms('two hundred and ten')).toContain('210'));
  it('two hundred ten', () => expect(replaceTerms('two hundred ten')).toContain('210'));
  it('two hundred', () => expect(replaceTerms('two hundred')).toContain('200'));
  it('one hundred and eighty', () => expect(replaceTerms('one hundred and eighty')).toContain('180'));
  it('one hundred and fifty', () => expect(replaceTerms('one hundred and fifty')).toContain('150'));
  it('one hundred and twenty-five', () => expect(replaceTerms('one hundred and twenty-five')).toContain('125'));
  it('one hundred and forty-one', () => expect(replaceTerms('one hundred and forty-one')).toContain('141'));
  it('one hundred and thirty', () => expect(replaceTerms('one hundred and thirty')).toContain('130'));
  it('one hundred and twenty', () => expect(replaceTerms('one hundred and twenty')).toContain('120'));
  it('a hundred and twenty', () => expect(replaceTerms('a hundred and twenty')).toContain('120'));
  it('a hundred and sixteen', () => expect(replaceTerms('a hundred and sixteen')).toContain('116'));
  it('a hundred and twenty-seven', () => expect(replaceTerms('a hundred and twenty-seven')).toContain('127'));
  it('a hundred and thirty-seven', () => expect(replaceTerms('a hundred and thirty-seven')).toContain('137'));
  it('a hundred and thirty', () => expect(replaceTerms('a hundred and thirty')).toContain('130'));
  it('a hundred and seven', () => expect(replaceTerms('a hundred and seven')).toContain('107'));
  it('one hundred and thirteen', () => expect(replaceTerms('one hundred and thirteen')).toContain('113'));
  it('one hundred and ten', () => expect(replaceTerms('one hundred and ten')).toContain('110'));
  it('one hundred and six', () => expect(replaceTerms('one hundred and six')).toContain('106'));
  it('one hundred and four', () => expect(replaceTerms('one hundred and four')).toContain('104'));
  it('one hundred and three', () => expect(replaceTerms('one hundred and three')).toContain('103'));
  it('one hundred and one', () => expect(replaceTerms('one hundred and one')).toContain('101'));
  it('one hundred', () => expect(replaceTerms('one hundred')).toContain('100'));
  it('ninety-nine', () => expect(replaceTerms('ninety-nine')).toContain('99'));
  it('ninety', () => expect(replaceTerms('ninety')).toContain('90'));
  it('eighty-one', () => expect(replaceTerms('eighty-one')).toContain('81'));
  it('eighty', () => expect(replaceTerms('eighty')).toContain('80'));
  it('seventy-five', () => expect(replaceTerms('seventy-five')).toContain('75'));
  it('seventy', () => expect(replaceTerms('seventy')).toContain('70'));
  it('sixty', () => expect(replaceTerms('sixty')).toContain('60'));
  it('fifty', () => expect(replaceTerms('fifty')).toContain('50'));
  it('forty-five', () => expect(replaceTerms('forty-five')).toContain('45'));
  it('forty', () => expect(replaceTerms('forty')).toContain('40'));
  it('thirty', () => expect(replaceTerms('thirty')).toContain('30'));
  it('twenty-nine', () => expect(replaceTerms('twenty-nine')).toContain('29'));
  it('twenty-five', () => expect(replaceTerms('twenty-five')).toContain('25'));
  it('twenty-four', () => expect(replaceTerms('twenty-four')).toContain('24'));
  it('twenty-three', () => expect(replaceTerms('twenty-three')).toContain('23'));
  it('twenty-two', () => expect(replaceTerms('twenty-two')).toContain('22'));
  it('twenty-one', () => expect(replaceTerms('twenty-one')).toContain('21'));
  it('twenty', () => expect(replaceTerms('twenty')).toContain('20'));
  it('nineteen', () => expect(replaceTerms('nineteen')).toContain('19'));
  it('eighteen', () => expect(replaceTerms('eighteen')).toContain('18'));
  it('seventeen', () => expect(replaceTerms('seventeen')).toContain('17'));
  it('sixteen', () => expect(replaceTerms('sixteen')).toContain('16'));
  it('fifteen', () => expect(replaceTerms('fifteen')).toContain('15'));
  it('fourteen', () => expect(replaceTerms('fourteen')).toContain('14'));
  it('thirteen', () => expect(replaceTerms('thirteen')).toContain('13'));
  it('twelve', () => expect(replaceTerms('twelve')).toContain('12'));
  it('eleven', () => expect(replaceTerms('eleven')).toContain('11'));
  it('ten', () => expect(replaceTerms('ten')).toContain('10'));
  it('nine', () => expect(replaceTerms('nine')).toContain('9'));
  it('eight', () => expect(replaceTerms('eight')).toContain('8'));
  it('seven', () => expect(replaceTerms('seven')).toContain('7'));
  it('six', () => expect(replaceTerms('six')).toContain('6'));
  it('five', () => expect(replaceTerms('five')).toContain('5'));
  it('four', () => expect(replaceTerms('four')).toContain('4'));
  it('three', () => expect(replaceTerms('three')).toContain('3'));
  it('five and twenty (biblical)', () => expect(replaceTerms('five and twenty')).toContain('25'));
  it('two and twenty (biblical)', () => expect(replaceTerms('two and twenty')).toContain('22'));
  it('two and twenty thousand (biblical)', () => expect(replaceTerms('two and twenty thousand')).toContain('22,000'));
  it('forty and two thousand three hundred and sixty', () => {
    expect(replaceTerms('forty and two thousand three hundred and sixty')).toContain('42,360');
  });
  it('one hundred dinars (special case preserved)', () => {
    expect(replaceTerms('one hundred dinars')).toContain('100 dinars');
  });
});

// =============================================================================
// NUMBER PARSER — NEW CAPABILITY: compound numbers formerly broken
// =============================================================================

describe('Number Parser — compound numbers formerly broken by partial lookup matching', () => {
  it('a hundred and twenty three → 123', () => {
    expect(replaceTerms('a hundred and twenty three')).toContain('123');
  });

  it('A hundred and twenty three (capitalised) → 123', () => {
    expect(replaceTerms('A hundred and twenty three')).toContain('123');
  });

  it('seven hundred and forty five → 745', () => {
    expect(replaceTerms('seven hundred and forty five')).toContain('745');
  });

  it('four thousand three hundred and twenty → 4,320', () => {
    expect(replaceTerms('four thousand three hundred and twenty')).toContain('4,320');
  });

  it('two and twenty thousand → 22,000', () => {
    expect(replaceTerms('two and twenty thousand')).toContain('22,000');
  });

  it('one hundred and twenty-five → 125', () => {
    expect(replaceTerms('one hundred and twenty-five')).toContain('125');
  });

  it('nine hundred and seventy-four → 974', () => {
    expect(replaceTerms('nine hundred and seventy-four')).toContain('974');
  });

  it('three hundred and sixty four → 364', () => {
    expect(replaceTerms('three hundred and sixty four')).toContain('364');
  });

  it('three hundred and fifty four → 354', () => {
    expect(replaceTerms('three hundred and fifty four')).toContain('354');
  });

  it('one hundred and forty-one → 141', () => {
    expect(replaceTerms('one hundred and forty-one')).toContain('141');
  });

  it('in-sentence: He lived a hundred and twenty three years', () => {
    expect(replaceTerms('He lived a hundred and twenty three years')).toContain('123');
  });

  it('in-sentence: seven hundred and forty five men returned', () => {
    expect(replaceTerms('seven hundred and forty five men returned')).toContain('745');
  });

  it('Nehemiah-style census: three hundred and forty five', () => {
    expect(replaceTerms('three hundred and forty five')).toContain('345');
  });

  it('Nehemiah-style census: six hundred and forty eight', () => {
    expect(replaceTerms('six hundred and forty eight')).toContain('648');
  });

  it('Nehemiah-style census: seven hundred and twenty', () => {
    expect(replaceTerms('seven hundred and twenty')).toContain('720');
  });

  it('Nehemiah-style census: two thousand three hundred and twenty two', () => {
    expect(replaceTerms('two thousand three hundred and twenty two')).toContain('2,322');
  });
});

// =============================================================================
// NUMBER PARSER — fractions and ordinals must NOT be broken
// =============================================================================

describe('Number Parser — fractions and special ordinals still work (Layer 1 protection)', () => {
  it('one-third → 1/3rd (not affected by number parser)', () => {
    expect(replaceTerms('one-third of the amount')).toContain('1/3rd');
  });

  it('three and one-third → 3⅓', () => {
    expect(replaceTerms('three and one-third')).toContain('3⅓');
  });

  it('thirty-three and one-third → 33⅓', () => {
    expect(replaceTerms('thirty-three and one-third')).toContain('33⅓');
  });

  it('ninety-three and one-third → 93⅓', () => {
    expect(replaceTerms('ninety-three and one-third')).toContain('93⅓');
  });

  it('five and a half → 5½', () => {
    expect(replaceTerms('five and a half')).toContain('5½');
  });

  it('nine-and-a-half → 9½', () => {
    expect(replaceTerms('nine-and-a-half')).toContain('9½');
  });

  it('six-and-a-half → 6½', () => {
    expect(replaceTerms('six-and-a-half')).toContain('6½');
  });

  it('twenty-nine and a half → 29½', () => {
    expect(replaceTerms('twenty-nine and a half')).toContain('29½');
  });

  it('three-eighths → 3/8ths', () => {
    expect(replaceTerms('three-eighths')).toContain('3/8ths');
  });

  it('three eighths (spaced) → 3/8ths', () => {
    expect(replaceTerms('three eighths')).toContain('3/8ths');
  });

  it('five-fourths → 5/4ths', () => {
    expect(replaceTerms('five-fourths')).toContain('5/4ths');
  });

  it('two-thirds → 2/3rds', () => {
    expect(replaceTerms('two-thirds')).toContain('2/3rds');
  });

  it('A quarter → 1/4th', () => {
    expect(replaceTerms('A quarter')).toContain('1/4th');
  });

  it('seven-twentieths → 7/20ths', () => {
    expect(replaceTerms('seven-twentieths')).toContain('7/20ths');
  });

  it('hour-and-a-quarter → 1¼ hours', () => {
    expect(replaceTerms('hour-and-a-quarter')).toContain('1¼ hours');
  });

  it('one and one-half → 1½', () => {
    expect(replaceTerms('one and one-half')).toContain('1½');
  });

  it('one-and-one-half → 1½', () => {
    expect(replaceTerms('one-and-one-half')).toContain('1½');
  });

  it('One and one half → 1½', () => {
    expect(replaceTerms('One and one half')).toContain('1½');
  });

  it('three-and-one-third → 3⅓', () => {
    expect(replaceTerms('three-and-one-third')).toContain('3⅓');
  });

  it('compound ordinals still work — twenty-first → 21st', () => {
    expect(replaceTerms('the twenty-first day')).toContain('21st');
  });

  it('compound ordinals still work — twenty first → 21st', () => {
    expect(replaceTerms('twenty first')).toContain('21st');
  });

  it('time ordinals still work — the third year → the 3rd year', () => {
    expect(replaceTerms('the third year')).toContain('3rd year');
  });

  it('time ordinals still work — the fifth month → the 5th month', () => {
    expect(replaceTerms('the fifth month')).toContain('5th month');
  });

  it('basic ordinals still work — twentieth → 20th', () => {
    expect(replaceTerms('the twentieth day')).toContain('20th');
  });

  it('basic ordinals still work — sixtieth → 60th', () => {
    expect(replaceTerms('the sixtieth year')).toContain('60th');
  });
});
