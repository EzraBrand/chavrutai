// Canonical source of truth for all tractate names and Hebrew translations
// This ensures consistency across frontend and backend

export const TRACTATE_LISTS = {
  "Bible": [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Samuel I", "Samuel II", "Kings I", "Kings II",
    "Isaiah", "Jeremiah", "Ezekiel", "Hosea", "Joel", "Amos", "Obadiah",
    "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Psalms", "Proverbs", "Job", "Song of Songs", "Ruth", "Lamentations",
    "Ecclesiastes", "Esther", "Daniel", "Ezra", "Nehemiah", "Chronicles I", "Chronicles II"
  ],
  "Mishnah": [
    "Berakhot", "Peah", "Demai", "Kilayim", "Sheviit", "Terumot", "Maasrot", "Maaser Sheni", "Challah", "Orlah", "Bikkurim",
    "Shabbat", "Eruvin", "Pesachim", "Shekalim", "Yoma", "Sukkah", "Beitzah", "Rosh Hashanah", "Taanit", "Megillah", "Moed Katan", "Chagigah",
    "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
    "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Eduyot", "Avodah Zarah", "Avot", "Horayot",
    "Zevachim", "Menachot", "Chullin", "Bekhorot", "Arakhin", "Temurah", "Keritot", "Meilah", "Tamid", "Middot", "Kinnim",
    "Kelim", "Oholot", "Negaim", "Parah", "Taharot", "Mikvaot", "Niddah", "Makhshirin", "Zavim", "Tevul Yom", "Yadayim", "Uktzin"
  ],
  "Talmud Yerushalmi": [
    "Berakhot", "Peah", "Demai", "Kilayim", "Sheviit", "Terumot", "Maasrot", "Maaser Sheni", "Challah", "Orlah", "Bikkurim",
    "Shabbat", "Eruvin", "Pesachim", "Shekalim", "Yoma", "Sukkah", "Beitzah", "Rosh Hashanah", "Taanit", "Megillah", "Chagigah",
    "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
    "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Avodah Zarah", "Horayot", "Niddah"
  ],
  "Talmud Bavli": [
    "Berakhot",
    "Shabbat", "Eruvin", "Pesachim", "Rosh Hashanah", "Yoma", "Sukkah", "Beitzah", "Taanit", "Megillah", "Moed Katan", "Chagigah",
    "Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin",
    "Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Avodah Zarah", "Horayot",
    "Zevachim", "Menachot", "Chullin", "Bekhorot", "Arakhin", "Temurah", "Keritot", "Meilah", "Tamid", "Niddah"
  ]
} as const;

// Hebrew names for Talmud Bavli tractates
export const TRACTATE_HEBREW_NAMES = {
  "Berakhot": "ברכות",
  "Shabbat": "שבת",
  "Eruvin": "עירובין", 
  "Pesachim": "פסחים",
  "Rosh Hashanah": "ראש השנה",
  "Yoma": "יומא",
  "Sukkah": "סוכה",
  "Beitzah": "ביצה",
  "Taanit": "תענית",
  "Megillah": "מגילה",
  "Moed Katan": "מועד קטן",
  "Chagigah": "חגיגה",
  "Yevamot": "יבמות",
  "Ketubot": "כתובות",
  "Nedarim": "נדרים",
  "Nazir": "נזיר", 
  "Sotah": "סוטה",
  "Gittin": "גיטין",
  "Kiddushin": "קידושין",
  "Bava Kamma": "בבא קמא",
  "Bava Metzia": "בבא מציעא",
  "Bava Batra": "בבא בתרא",
  "Sanhedrin": "סנהדרין",
  "Makkot": "מכות",
  "Shevuot": "שבועות",
  "Avodah Zarah": "עבודה זרה", 
  "Horayot": "הוריות",
  "Zevachim": "זבחים",
  "Menachot": "מנחות",
  "Chullin": "חולין",
  "Bekhorot": "בכורות",
  "Arakhin": "ערכין",
  "Temurah": "תמורה",
  "Keritot": "כריתות",
  "Meilah": "מעילה",
  "Tamid": "תמיד",
  "Niddah": "נדה"
} as const;

// Folio ranges for all Talmud Bavli tractates
export const TRACTATE_FOLIO_RANGES = {
  "Berakhot": 64, "Shabbat": 157, "Eruvin": 105, "Pesachim": 121, "Shekalim": 22, "Yoma": 88,
  "Sukkah": 56, "Beitzah": 40, "Rosh Hashanah": 35, "Taanit": 31, "Megillah": 32,
  "Moed Katan": 29, "Chagigah": 27, "Yevamot": 122, "Ketubot": 112, "Nedarim": 91, 
  "Nazir": 66, "Sotah": 49, "Gittin": 90, "Kiddushin": 82, "Bava Kamma": 119, 
  "Bava Metzia": 119, "Bava Batra": 176, "Sanhedrin": 113, "Makkot": 24, "Shevuot": 49, 
  "Avodah Zarah": 76, "Horayot": 14, "Zevachim": 120, "Menachot": 110, "Chullin": 142, 
  "Bekhorot": 61, "Arakhin": 34, "Temurah": 34, "Keritot": 28, "Meilah": 22, 
  "Tamid": 33, "Niddah": 73
} as const;

export type WorkName = keyof typeof TRACTATE_LISTS;
export type TalmudBavliTractate = typeof TRACTATE_LISTS["Talmud Bavli"][number];

// URL-safe to proper case mapping for Sefaria API calls
export const URL_TO_SEFARIA_TRACTATE_MAP: Record<string, string> = {
  "berakhot": "Berakhot",
  "shabbat": "Shabbat", 
  "eruvin": "Eruvin",
  "pesachim": "Pesachim",
  "rosh hashanah": "Rosh Hashanah",
  "rosh-hashanah": "Rosh Hashanah",
  "yoma": "Yoma",
  "sukkah": "Sukkah", 
  "beitza": "Beitzah",
  "beitzah": "Beitzah",
  "taanit": "Taanit",
  "megillah": "Megillah",
  "moed katan": "Moed Katan",
  "moed-katan": "Moed Katan",
  "chagigah": "Chagigah",
  "yevamot": "Yevamot",
  "ketubot": "Ketubot", 
  "nedarim": "Nedarim",
  "nazir": "Nazir",
  "sotah": "Sotah",
  "gittin": "Gittin",
  "kiddushin": "Kiddushin",
  "bava kamma": "Bava Kamma",
  "bava-kamma": "Bava Kamma",
  "bava metzia": "Bava Metzia",
  "bava-metzia": "Bava Metzia", 
  "bava batra": "Bava Batra",
  "bava-batra": "Bava Batra",
  "sanhedrin": "Sanhedrin",
  "makkot": "Makkot",
  "shevuot": "Shevuot",
  "avodah zarah": "Avodah Zarah",
  "avodah-zarah": "Avodah Zarah",
  "horayot": "Horayot",
  "zevachim": "Zevachim",
  "menachot": "Menachot",
  "chullin": "Chullin",
  "bekhorot": "Bekhorot", 
  "arachin": "Arakhin",
  "arakhin": "Arakhin",
  "temurah": "Temurah",
  "keritot": "Keritot", 
  "meilah": "Meilah",
  "tamid": "Tamid",
  "niddah": "Niddah"
};

// Internal helper: normalize any tractate URL input to the lowercase-hyphen key used in URL_TO_SEFARIA_TRACTATE_MAP
// Accepts old format (berakhot, rosh-hashanah) and new format (Berakhot, Rosh_Hashanah)
function normalizeTractateKey(urlTractate: string): string {
  return decodeURIComponent(urlTractate)
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to normalize tractate names for Sefaria API calls
export function normalizeSefariaTractateName(urlTractate: string): string {
  const normalized = URL_TO_SEFARIA_TRACTATE_MAP[normalizeTractateKey(urlTractate)];
  return normalized || urlTractate;
}

// Helper function to convert URL tractate names to proper case for display
export function normalizeDisplayTractateName(urlTractate: string): string {
  const normalized = URL_TO_SEFARIA_TRACTATE_MAP[normalizeTractateKey(urlTractate)];
  return normalized || urlTractate;
}

// Helper function to check if a tractate name is valid
export function isValidTractate(urlTractate: string): boolean {
  return !!URL_TO_SEFARIA_TRACTATE_MAP[normalizeTractateKey(urlTractate)];
}

// Tractate data organized by Seder with folio counts
// Used for sitemap generation and organized navigation
// lastSide: 'a' means the tractate ends on the 'a' side (no 'b' side on final folio)
// lastSide: 'b' (default) means the tractate has both 'a' and 'b' on the final folio
export const SEDER_TRACTATES = {
  zeraim: [
    { name: 'Berakhot', folios: 64, lastSide: 'a' as const }
  ],
  moed: [
    { name: 'Shabbat', folios: 157, lastSide: 'b' as const },
    { name: 'Eruvin', folios: 105, lastSide: 'a' as const },
    { name: 'Pesachim', folios: 121, lastSide: 'b' as const },
    { name: 'Rosh Hashanah', folios: 35, lastSide: 'a' as const },
    { name: 'Yoma', folios: 88, lastSide: 'a' as const },
    { name: 'Sukkah', folios: 56, lastSide: 'b' as const },
    { name: 'Beitzah', folios: 40, lastSide: 'b' as const },
    { name: 'Taanit', folios: 31, lastSide: 'a' as const },
    { name: 'Megillah', folios: 32, lastSide: 'a' as const },
    { name: 'Moed Katan', folios: 29, lastSide: 'a' as const },
    { name: 'Chagigah', folios: 27, lastSide: 'a' as const }
  ],
  nashim: [
    { name: 'Yevamot', folios: 122, lastSide: 'b' as const },
    { name: 'Ketubot', folios: 112, lastSide: 'b' as const },
    { name: 'Nedarim', folios: 91, lastSide: 'b' as const },
    { name: 'Nazir', folios: 66, lastSide: 'b' as const },
    { name: 'Sotah', folios: 49, lastSide: 'b' as const },
    { name: 'Gittin', folios: 90, lastSide: 'b' as const },
    { name: 'Kiddushin', folios: 82, lastSide: 'b' as const }
  ],
  nezikin: [
    { name: 'Bava Kamma', folios: 119, lastSide: 'b' as const },
    { name: 'Bava Metzia', folios: 119, lastSide: 'a' as const },
    { name: 'Bava Batra', folios: 176, lastSide: 'b' as const },
    { name: 'Sanhedrin', folios: 113, lastSide: 'b' as const },
    { name: 'Makkot', folios: 24, lastSide: 'b' as const },
    { name: 'Shevuot', folios: 49, lastSide: 'b' as const },
    { name: 'Avodah Zarah', folios: 76, lastSide: 'b' as const },
    { name: 'Horayot', folios: 14, lastSide: 'a' as const }
  ],
  kodashim: [
    { name: 'Zevachim', folios: 120, lastSide: 'b' as const },
    { name: 'Menachot', folios: 110, lastSide: 'a' as const },
    { name: 'Chullin', folios: 142, lastSide: 'a' as const },
    { name: 'Bekhorot', folios: 61, lastSide: 'a' as const },
    { name: 'Arakhin', folios: 34, lastSide: 'a' as const },
    { name: 'Temurah', folios: 34, lastSide: 'a' as const },
    { name: 'Keritot', folios: 28, lastSide: 'b' as const },
    { name: 'Meilah', folios: 22, lastSide: 'a' as const },
    { name: 'Tamid', folios: 33, lastSide: 'b' as const, startFolio: 25, startSide: 'b' as const }
  ],
  tohorot: [
    { name: 'Niddah', folios: 73, lastSide: 'a' as const }
  ]
} as const;

export type SederName = keyof typeof SEDER_TRACTATES;

/**
 * Get the maximum folio number for a given tractate
 * @param tractate - The name of the tractate
 * @returns The maximum folio number, defaults to 150 if tractate not found
 */
export function getMaxFolio(tractate: string): number {
  return TRACTATE_FOLIO_RANGES[tractate as keyof typeof TRACTATE_FOLIO_RANGES] || 150;
}

/**
 * Check if a folio number is valid for a given tractate
 * @param tractate - The name of the tractate
 * @param folio - The folio number to check
 * @returns true if the folio is within the valid range (2 to max folio)
 */
export function isValidFolio(tractate: string, folio: number): boolean {
  const maxFolio = getMaxFolio(tractate);
  return folio >= 2 && folio <= maxFolio;
}

/**
 * Get tractate info from SEDER_TRACTATES by name
 * @param tractate - The tractate name (any format: display name, slug, or Sefaria name)
 * @returns The tractate info object with folios and lastSide, or null if not found
 */
export function getTractateInfo(tractate: string): { name: string; folios: number; lastSide: 'a' | 'b' } | null {
  // First normalize using URL map to handle alternate spellings (e.g., "arachin" -> "Arakhin")
  const normalizedName = normalizeSefariaTractateName(tractate);
  const slug = getTractateSlug(normalizedName);
  
  for (const seder of Object.values(SEDER_TRACTATES)) {
    for (const t of seder) {
      if (getTractateSlug(t.name) === slug) {
        return { name: t.name, folios: t.folios, lastSide: t.lastSide };
      }
    }
  }
  return null;
}

/**
 * Check if a specific page (tractate + folio + side) is valid and has content
 * @param tractate - The tractate name
 * @param folio - The folio number
 * @param side - The side ('a' or 'b')
 * @returns true if the page exists and has content
 */
export function isValidPage(tractate: string, folio: number, side: 'a' | 'b'): boolean {
  const info = getTractateInfo(tractate);
  if (!info) return false;
  
  // Check folio is in valid range (starts at 2)
  if (folio < 2 || folio > info.folios) return false;
  
  // Check if this is the last folio and the side is valid
  if (folio === info.folios && side === 'b' && info.lastSide === 'a') {
    return false;
  }
  
  return true;
}

/**
 * Convert tractate name to canonical URL slug (ProperCase with underscores)
 * This is the canonical URL format for all tractate URLs
 * Handles various input formats: display names, URL-encoded strings, old-format slugs
 * @param tractate - The tractate name (any case, spaces, hyphens, underscores, or URL-encoded)
 * @returns Canonical URL slug (e.g., "Moed Katan" -> "Moed_Katan", "bava-metzia" -> "Bava_Metzia")
 */
export function getTractateSlug(tractate: string): string {
  const key = normalizeTractateKey(tractate);
  const sefariaName = URL_TO_SEFARIA_TRACTATE_MAP[key];
  if (sefariaName) {
    // Convert Sefaria name spaces to underscores: "Rosh Hashanah" -> "Rosh_Hashanah"
    return sefariaName.replace(/\s+/g, '_');
  }
  // Fallback: return decoded input unchanged
  return decodeURIComponent(tractate);
}