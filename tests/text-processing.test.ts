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

    it('replaces ordinal numbers', () => {
      const text = 'the third time and the twentieth day';
      const result = replaceTerms(text);
      expect(result).toContain('3rd');
      expect(result).toContain('20th');
    });

    it('replaces fractional ordinals', () => {
      const text = 'one-third of the amount';
      const result = replaceTerms(text);
      expect(result).toContain('1/3rd');
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

  describe('Bug #78: etc., splitting', () => {
    it('does not split etc. when followed by comma', () => {
      const text = 'apples, oranges, etc., and more.';
      const result = splitEnglishText(text);
      expect(result).toContain('etc.,');
    });
  });
});
