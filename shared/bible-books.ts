/**
 * Bible (Tanach) books configuration
 * Contains canonical list of all 24 books with Hebrew names and chapter counts
 */

export interface BibleBook {
  name: string;
  hebrew: string;
  chapters: number;
  sefaria: string;
  slug: string;
}

export const TORAH_BOOKS: BibleBook[] = [
  { name: "Genesis", hebrew: "בראשית", chapters: 50, sefaria: "Genesis", slug: "Genesis" },
  { name: "Exodus", hebrew: "שמות", chapters: 40, sefaria: "Exodus", slug: "Exodus" },
  { name: "Leviticus", hebrew: "ויקרא", chapters: 27, sefaria: "Leviticus", slug: "Leviticus" },
  { name: "Numbers", hebrew: "במדבר", chapters: 36, sefaria: "Numbers", slug: "Numbers" },
  { name: "Deuteronomy", hebrew: "דברים", chapters: 34, sefaria: "Deuteronomy", slug: "Deuteronomy" },
];

export const NEVIIM_BOOKS: BibleBook[] = [
  { name: "Joshua", hebrew: "יהושע", chapters: 24, sefaria: "Joshua", slug: "Joshua" },
  { name: "Judges", hebrew: "שופטים", chapters: 21, sefaria: "Judges", slug: "Judges" },
  { name: "I Samuel", hebrew: "שמואל א", chapters: 31, sefaria: "I Samuel", slug: "I_Samuel" },
  { name: "II Samuel", hebrew: "שמואל ב", chapters: 24, sefaria: "II Samuel", slug: "II_Samuel" },
  { name: "I Kings", hebrew: "מלכים א", chapters: 22, sefaria: "I Kings", slug: "I_Kings" },
  { name: "II Kings", hebrew: "מלכים ב", chapters: 25, sefaria: "II Kings", slug: "II_Kings" },
  { name: "Isaiah", hebrew: "ישעיהו", chapters: 66, sefaria: "Isaiah", slug: "Isaiah" },
  { name: "Jeremiah", hebrew: "ירמיהו", chapters: 52, sefaria: "Jeremiah", slug: "Jeremiah" },
  { name: "Ezekiel", hebrew: "יחזקאל", chapters: 48, sefaria: "Ezekiel", slug: "Ezekiel" },
  { name: "Hosea", hebrew: "הושע", chapters: 14, sefaria: "Hosea", slug: "Hosea" },
  { name: "Joel", hebrew: "יואל", chapters: 4, sefaria: "Joel", slug: "Joel" },
  { name: "Amos", hebrew: "עמוס", chapters: 9, sefaria: "Amos", slug: "Amos" },
  { name: "Obadiah", hebrew: "עובדיה", chapters: 1, sefaria: "Obadiah", slug: "Obadiah" },
  { name: "Jonah", hebrew: "יונה", chapters: 4, sefaria: "Jonah", slug: "Jonah" },
  { name: "Micah", hebrew: "מיכה", chapters: 7, sefaria: "Micah", slug: "Micah" },
  { name: "Nahum", hebrew: "נחום", chapters: 3, sefaria: "Nahum", slug: "Nahum" },
  { name: "Habakkuk", hebrew: "חבקוק", chapters: 3, sefaria: "Habakkuk", slug: "Habakkuk" },
  { name: "Zephaniah", hebrew: "צפניה", chapters: 3, sefaria: "Zephaniah", slug: "Zephaniah" },
  { name: "Haggai", hebrew: "חגי", chapters: 2, sefaria: "Haggai", slug: "Haggai" },
  { name: "Zechariah", hebrew: "זכריה", chapters: 14, sefaria: "Zechariah", slug: "Zechariah" },
  { name: "Malachi", hebrew: "מלאכי", chapters: 3, sefaria: "Malachi", slug: "Malachi" },
];

export const KETUVIM_BOOKS: BibleBook[] = [
  { name: "Psalms", hebrew: "תהילים", chapters: 150, sefaria: "Psalms", slug: "Psalms" },
  { name: "Proverbs", hebrew: "משלי", chapters: 31, sefaria: "Proverbs", slug: "Proverbs" },
  { name: "Job", hebrew: "איוב", chapters: 42, sefaria: "Job", slug: "Job" },
  { name: "Song of Songs", hebrew: "שיר השירים", chapters: 8, sefaria: "Song of Songs", slug: "Song_of_Songs" },
  { name: "Ruth", hebrew: "רות", chapters: 4, sefaria: "Ruth", slug: "Ruth" },
  { name: "Lamentations", hebrew: "איכה", chapters: 5, sefaria: "Lamentations", slug: "Lamentations" },
  { name: "Ecclesiastes", hebrew: "קהלת", chapters: 12, sefaria: "Ecclesiastes", slug: "Ecclesiastes" },
  { name: "Esther", hebrew: "אסתר", chapters: 10, sefaria: "Esther", slug: "Esther" },
  { name: "Daniel", hebrew: "דניאל", chapters: 12, sefaria: "Daniel", slug: "Daniel" },
  { name: "Ezra", hebrew: "עזרא", chapters: 10, sefaria: "Ezra", slug: "Ezra" },
  { name: "Nehemiah", hebrew: "נחמיה", chapters: 13, sefaria: "Nehemiah", slug: "Nehemiah" },
  { name: "I Chronicles", hebrew: "דברי הימים א", chapters: 29, sefaria: "I Chronicles", slug: "I_Chronicles" },
  { name: "II Chronicles", hebrew: "דברי הימים ב", chapters: 36, sefaria: "II Chronicles", slug: "II_Chronicles" },
];

export const ALL_BIBLE_BOOKS: BibleBook[] = [
  ...TORAH_BOOKS,
  ...NEVIIM_BOOKS,
  ...KETUVIM_BOOKS,
];

export const BIBLE_SECTIONS = {
  Torah: TORAH_BOOKS,
  "Nevi'im": NEVIIM_BOOKS,
  Ketuvim: KETUVIM_BOOKS,
};

// Internal helper: normalize any book slug/name input for comparison
// Treats hyphens, underscores, and spaces as equivalent, and is case-insensitive
function normalizeBookKey(input: string): string {
  return decodeURIComponent(input).toLowerCase().replace(/[-_\s]+/g, '-');
}

/**
 * Check if a book name is valid
 */
export function isValidBook(bookName: string): boolean {
  const key = normalizeBookKey(bookName);
  return ALL_BIBLE_BOOKS.some(
    book => normalizeBookKey(book.slug) === key ||
            normalizeBookKey(book.name) === key ||
            normalizeBookKey(book.sefaria) === key
  );
}

/**
 * Normalize book name to match Sefaria API format
 */
export function normalizeSefariaBookName(bookName: string): string {
  const key = normalizeBookKey(bookName);
  const book = ALL_BIBLE_BOOKS.find(
    b => normalizeBookKey(b.slug) === key ||
         normalizeBookKey(b.name) === key ||
         normalizeBookKey(b.sefaria) === key
  );

  return book ? book.sefaria : bookName;
}

/**
 * Get book by slug (accepts both old format "song-of-songs" and new format "Song_of_Songs")
 */
export function getBookBySlug(slug: string): BibleBook | undefined {
  const key = normalizeBookKey(slug);
  return ALL_BIBLE_BOOKS.find(book => normalizeBookKey(book.slug) === key);
}

/**
 * Get chapter count for a book
 */
export function getChapterCount(bookName: string): number {
  const key = normalizeBookKey(bookName);
  const book = ALL_BIBLE_BOOKS.find(
    b => normalizeBookKey(b.slug) === key ||
         normalizeBookKey(b.name) === key ||
         normalizeBookKey(b.sefaria) === key
  );

  return book ? book.chapters : 0;
}
