export interface RambamHilchot {
  displayName: string;
  hebrewName: string;
  chapters: number;
  book: string;
  sefaria: string;
  slug: string;
  alHatorah: string | null;
  wikisourceHebrew: string;
  isFlat?: boolean;
}

export const RAMBAM_INTRODUCTION: RambamHilchot = {
  displayName: "Transmission of the Oral Law",
  hebrewName: "מסירת תורה שבעל פה",
  chapters: 1,
  book: "Introduction",
  sefaria: "Mishneh Torah, Transmission of the Oral Law",
  slug: "Transmission_of_the_Oral_Law",
  alHatorah: null,
  wikisourceHebrew: "הקדמה_למשנה_תורה",
  isFlat: true,
};

export const RAMBAM_PREFATORY: RambamHilchot[] = [
  RAMBAM_INTRODUCTION,
  {
    displayName: "Positive Mitzvot",
    hebrewName: "מצוות עשה",
    chapters: 1,
    book: "Introduction",
    sefaria: "Mishneh Torah, Positive Mitzvot",
    slug: "Positive_Mitzvot",
    alHatorah: null,
    wikisourceHebrew: "",
    isFlat: true,
  },
  {
    displayName: "Negative Mitzvot",
    hebrewName: "מצוות לא תעשה",
    chapters: 1,
    book: "Introduction",
    sefaria: "Mishneh Torah, Negative Mitzvot",
    slug: "Negative_Mitzvot",
    alHatorah: null,
    wikisourceHebrew: "",
    isFlat: true,
  },
];

export interface RambamBook {
  name: string;
  hebrewName: string;
  hilchot: RambamHilchot[];
}

export const RAMBAM_BOOKS: RambamBook[] = [
  {
    name: "Sefer Madda",
    hebrewName: "ספר המדע",
    hilchot: [
      { displayName: "Foundations of the Torah", hebrewName: "יסודי התורה", chapters: 10, book: "Sefer Madda", sefaria: "Mishneh Torah, Foundations of the Torah", slug: "Foundations_of_the_Torah", alHatorah: "Yesodei_HaTorah", wikisourceHebrew: "יסודי_התורה" },
      { displayName: "Human Dispositions", hebrewName: "דעות", chapters: 7, book: "Sefer Madda", sefaria: "Mishneh Torah, Human Dispositions", slug: "Human_Dispositions", alHatorah: "Deiot", wikisourceHebrew: "דעות" },
      { displayName: "Torah Study", hebrewName: "תלמוד תורה", chapters: 7, book: "Sefer Madda", sefaria: "Mishneh Torah, Torah Study", slug: "Torah_Study", alHatorah: "Talmud_Torah", wikisourceHebrew: "תלמוד_תורה" },
      { displayName: "Foreign Worship and Customs of the Nations", hebrewName: "עבודה זרה", chapters: 12, book: "Sefer Madda", sefaria: "Mishneh Torah, Foreign Worship and Customs of the Nations", slug: "Foreign_Worship_and_Customs_of_the_Nations", alHatorah: "Avodah_Zarah", wikisourceHebrew: "עבודה_זרה_וחוקות_הגויים" },
      { displayName: "Repentance", hebrewName: "תשובה", chapters: 10, book: "Sefer Madda", sefaria: "Mishneh Torah, Repentance", slug: "Repentance", alHatorah: "Teshuvah", wikisourceHebrew: "תשובה" },
    ],
  },
  {
    name: "Sefer Ahavah",
    hebrewName: "ספר האהבה",
    hilchot: [
      { displayName: "Reading the Shema", hebrewName: "קריאת שמע", chapters: 4, book: "Sefer Ahavah", sefaria: "Mishneh Torah, Reading the Shema", slug: "Reading_the_Shema", alHatorah: "Keriat_Shema", wikisourceHebrew: "קריאת_שמע" },
      { displayName: "Prayer and the Priestly Blessing", hebrewName: "תפילה וברכת כהנים", chapters: 15, book: "Sefer Ahavah", sefaria: "Mishneh Torah, Prayer and the Priestly Blessing", slug: "Prayer_and_the_Priestly_Blessing", alHatorah: "Tefillah_uBirkat_Kohanim", wikisourceHebrew: "תפילה_וברכת_כהנים" },
      { displayName: "Tefillin, Mezuzah and the Torah Scroll", hebrewName: "תפילין מזוזה וספר תורה", chapters: 10, book: "Sefer Ahavah", sefaria: "Mishneh Torah, Tefillin, Mezuzah and the Torah Scroll", slug: "Tefillin_Mezuzah_and_the_Torah_Scroll", alHatorah: "Tefillin_uMezuzah_veSefer_Torah", wikisourceHebrew: "תפילין_ומזוזה_וספר_תורה" },
      { displayName: "Fringes", hebrewName: "ציצית", chapters: 3, book: "Sefer Ahavah", sefaria: "Mishneh Torah, Fringes", slug: "Fringes", alHatorah: "Tzitzit", wikisourceHebrew: "ציצית" },
      { displayName: "Blessings", hebrewName: "ברכות", chapters: 11, book: "Sefer Ahavah", sefaria: "Mishneh Torah, Blessings", slug: "Blessings", alHatorah: "Berakhot", wikisourceHebrew: "ברכות" },
      { displayName: "Circumcision", hebrewName: "מילה", chapters: 3, book: "Sefer Ahavah", sefaria: "Mishneh Torah, Circumcision", slug: "Circumcision", alHatorah: "Milah", wikisourceHebrew: "מילה" },
    ],
  },
  {
    name: "Sefer Zemanim",
    hebrewName: "ספר זמנים",
    hilchot: [
      { displayName: "Sabbath", hebrewName: "שבת", chapters: 30, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Sabbath", slug: "Sabbath", alHatorah: "Shabbat", wikisourceHebrew: "שבת" },
      { displayName: "Eruvin", hebrewName: "עירובין", chapters: 8, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Eruvin", slug: "Eruvin", alHatorah: "Eiruvin", wikisourceHebrew: "עירובין" },
      { displayName: "Rest on the Tenth of Tishrei", hebrewName: "שביתת עשור", chapters: 3, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Rest on the Tenth of Tishrei", slug: "Rest_on_the_Tenth_of_Tishrei", alHatorah: "Shevitat_Asor", wikisourceHebrew: "שביתת_עשור" },
      { displayName: "Rest on a Holiday", hebrewName: "שביתת יום טוב", chapters: 8, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Rest on a Holiday", slug: "Rest_on_a_Holiday", alHatorah: "Shevitat_Yom_Tov", wikisourceHebrew: "שביתת_יום_טוב" },
      { displayName: "Leavened and Unleavened Bread", hebrewName: "חמץ ומצה", chapters: 9, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Leavened and Unleavened Bread", slug: "Leavened_and_Unleavened_Bread", alHatorah: "Chametz_uMatzah", wikisourceHebrew: "חמץ_ומצה" },
      { displayName: "Shofar, Sukkah and Lulav", hebrewName: "שופר וסוכה ולולב", chapters: 8, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Shofar, Sukkah and Lulav", slug: "Shofar_Sukkah_and_Lulav", alHatorah: "Shofar_veSukkah_veLulav", wikisourceHebrew: "שופר_וסוכה_ולולב" },
      { displayName: "Sheqel Dues", hebrewName: "שקלים", chapters: 4, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Sheqel Dues", slug: "Sheqel_Dues", alHatorah: "Shekalim", wikisourceHebrew: "שקלים" },
      { displayName: "Sanctification of the New Month", hebrewName: "קידוש החודש", chapters: 19, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Sanctification of the New Month", slug: "Sanctification_of_the_New_Month", alHatorah: "Kiddush_HaChodesh", wikisourceHebrew: "קידוש_החודש" },
      { displayName: "Fasts", hebrewName: "תעניות", chapters: 5, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Fasts", slug: "Fasts", alHatorah: "Taaniyot", wikisourceHebrew: "תעניות" },
      { displayName: "Scroll of Esther and Hanukkah", hebrewName: "מגילה וחנוכה", chapters: 4, book: "Sefer Zemanim", sefaria: "Mishneh Torah, Scroll of Esther and Hanukkah", slug: "Scroll_of_Esther_and_Hanukkah", alHatorah: "Megillah_vaChanukkah", wikisourceHebrew: "מגילה_וחנוכה" },
    ],
  },
  {
    name: "Sefer Nashim",
    hebrewName: "ספר נשים",
    hilchot: [
      { displayName: "Marriage", hebrewName: "אישות", chapters: 25, book: "Sefer Nashim", sefaria: "Mishneh Torah, Marriage", slug: "Marriage", alHatorah: "Ishut", wikisourceHebrew: "אישות" },
      { displayName: "Divorce", hebrewName: "גירושין", chapters: 13, book: "Sefer Nashim", sefaria: "Mishneh Torah, Divorce", slug: "Divorce", alHatorah: "Geirushin", wikisourceHebrew: "גירושין" },
      { displayName: "Levirate Marriage and Release", hebrewName: "יבום וחליצה", chapters: 8, book: "Sefer Nashim", sefaria: "Mishneh Torah, Levirate Marriage and Release", slug: "Levirate_Marriage_and_Release", alHatorah: "Yibbum_vaChalitzah", wikisourceHebrew: "יבום_וחליצה" },
      { displayName: "Virgin Maiden", hebrewName: "נערה בתולה", chapters: 3, book: "Sefer Nashim", sefaria: "Mishneh Torah, Virgin Maiden", slug: "Virgin_Maiden", alHatorah: "Naarah_Betulah", wikisourceHebrew: "נערה_בתולה" },
      { displayName: "Woman Suspected of Infidelity", hebrewName: "סוטה", chapters: 4, book: "Sefer Nashim", sefaria: "Mishneh Torah, Woman Suspected of Infidelity", slug: "Woman_Suspected_of_Infidelity", alHatorah: "Sotah", wikisourceHebrew: "סוטה" },
    ],
  },
  {
    name: "Sefer Kedushah",
    hebrewName: "ספר קדושה",
    hilchot: [
      { displayName: "Forbidden Intercourse", hebrewName: "איסורי ביאה", chapters: 22, book: "Sefer Kedushah", sefaria: "Mishneh Torah, Forbidden Intercourse", slug: "Forbidden_Intercourse", alHatorah: "Issurei_Biah", wikisourceHebrew: "איסורי_ביאה" },
      { displayName: "Forbidden Foods", hebrewName: "מאכלות אסורות", chapters: 17, book: "Sefer Kedushah", sefaria: "Mishneh Torah, Forbidden Foods", slug: "Forbidden_Foods", alHatorah: "Maakhalot_Asurot", wikisourceHebrew: "מאכלות_אסורות" },
      { displayName: "Ritual Slaughter", hebrewName: "שחיטה", chapters: 14, book: "Sefer Kedushah", sefaria: "Mishneh Torah, Ritual Slaughter", slug: "Ritual_Slaughter", alHatorah: "Shechitah", wikisourceHebrew: "שחיטה" },
    ],
  },
  {
    name: "Sefer Haflaah",
    hebrewName: "ספר הפלאה",
    hilchot: [
      { displayName: "Oaths", hebrewName: "שבועות", chapters: 12, book: "Sefer Haflaah", sefaria: "Mishneh Torah, Oaths", slug: "Oaths", alHatorah: "Shevuot", wikisourceHebrew: "שבועות" },
      { displayName: "Vows", hebrewName: "נדרים", chapters: 13, book: "Sefer Haflaah", sefaria: "Mishneh Torah, Vows", slug: "Vows", alHatorah: "Nedarim", wikisourceHebrew: "נדרים" },
      { displayName: "Nazariteship", hebrewName: "נזירות", chapters: 10, book: "Sefer Haflaah", sefaria: "Mishneh Torah, Nazariteship", slug: "Nazariteship", alHatorah: "Nezirut", wikisourceHebrew: "נזירות" },
      { displayName: "Appraisals and Devoted Property", hebrewName: "ערכים וחרמין", chapters: 8, book: "Sefer Haflaah", sefaria: "Mishneh Torah, Appraisals and Devoted Property", slug: "Appraisals_and_Devoted_Property", alHatorah: "Arakhim_VaCharamim", wikisourceHebrew: "ערכים_וחרמין" },
    ],
  },
  {
    name: "Sefer Zeraim",
    hebrewName: "ספר זרעים",
    hilchot: [
      { displayName: "Diverse Species", hebrewName: "כלאים", chapters: 10, book: "Sefer Zeraim", sefaria: "Mishneh Torah, Diverse Species", slug: "Diverse_Species", alHatorah: "Kilayim", wikisourceHebrew: "כלאים" },
      { displayName: "Gifts to the Poor", hebrewName: "מתנות עניים", chapters: 10, book: "Sefer Zeraim", sefaria: "Mishneh Torah, Gifts to the Poor", slug: "Gifts_to_the_Poor", alHatorah: "Matenot_Aniyyim", wikisourceHebrew: "מתנות_עניים" },
      { displayName: "Heave Offerings", hebrewName: "תרומות", chapters: 15, book: "Sefer Zeraim", sefaria: "Mishneh Torah, Heave Offerings", slug: "Heave_Offerings", alHatorah: "Terumot", wikisourceHebrew: "תרומות" },
      { displayName: "Tithes", hebrewName: "מעשרות", chapters: 14, book: "Sefer Zeraim", sefaria: "Mishneh Torah, Tithes", slug: "Tithes", alHatorah: "Ma'aser", wikisourceHebrew: "מעשרות" },
      { displayName: "Second Tithes and Fourth Year's Fruit", hebrewName: "מעשר שני", chapters: 11, book: "Sefer Zeraim", sefaria: "Mishneh Torah, Second Tithes and Fourth Year's Fruit", slug: "Second_Tithes_and_Fourth_Years_Fruit", alHatorah: "Ma'aser_Sheini", wikisourceHebrew: "מעשר_שני_ונטע_רבעי" },
      { displayName: "First Fruits and other Gifts to Priests Outside the Sanctuary", hebrewName: "ביכורים", chapters: 12, book: "Sefer Zeraim", sefaria: "Mishneh Torah, First Fruits and other Gifts to Priests Outside the Sanctuary", slug: "First_Fruits_and_other_Gifts_to_Priests_Outside_the_Sanctuary", alHatorah: "Bikurim", wikisourceHebrew: "ביכורים_ושאר_מתנות_כהונה_שבגבולין" },
      { displayName: "Sabbatical Year and the Jubilee", hebrewName: "שמיטה ויובל", chapters: 13, book: "Sefer Zeraim", sefaria: "Mishneh Torah, Sabbatical Year and the Jubilee", slug: "Sabbatical_Year_and_the_Jubilee", alHatorah: "Shemittah_veYovel", wikisourceHebrew: "שמיטה_ויובל" },
    ],
  },
  {
    name: "Sefer Avodah",
    hebrewName: "ספר עבודה",
    hilchot: [
      { displayName: "The Chosen Temple", hebrewName: "בית הבחירה", chapters: 8, book: "Sefer Avodah", sefaria: "Mishneh Torah, The Chosen Temple", slug: "The_Chosen_Temple", alHatorah: "Beit_HaBechirah", wikisourceHebrew: "בית_הבחירה" },
      { displayName: "Vessels of the Sanctuary and Those Who Serve Therein", hebrewName: "כלי המקדש", chapters: 10, book: "Sefer Avodah", sefaria: "Mishneh Torah, Vessels of the Sanctuary and Those Who Serve Therein", slug: "Vessels_of_the_Sanctuary_and_Those_Who_Serve_Therein", alHatorah: "Kelei_HaMikdash", wikisourceHebrew: "כלי_המקדש_והעובדין_בו" },
      { displayName: "Admission into the Sanctuary", hebrewName: "ביאת מקדש", chapters: 9, book: "Sefer Avodah", sefaria: "Mishneh Torah, Admission into the Sanctuary", slug: "Admission_into_the_Sanctuary", alHatorah: "Biat_HaMikdash", wikisourceHebrew: "ביאת_מקדש" },
      { displayName: "Things Forbidden on the Altar", hebrewName: "איסורי המזבח", chapters: 7, book: "Sefer Avodah", sefaria: "Mishneh Torah, Things Forbidden on the Altar", slug: "Things_Forbidden_on_the_Altar", alHatorah: "Isurei_Mizbeach", wikisourceHebrew: "איסורי_המזבח" },
      { displayName: "Sacrificial Procedure", hebrewName: "מעשה הקרבנות", chapters: 19, book: "Sefer Avodah", sefaria: "Mishneh Torah, Sacrificial Procedure", slug: "Sacrificial_Procedure", alHatorah: "Ma'aseh_HaKorbanot", wikisourceHebrew: "מעשה_הקרבנות" },
      { displayName: "Daily Offerings and Additional Offerings", hebrewName: "תמידים ומוספין", chapters: 10, book: "Sefer Avodah", sefaria: "Mishneh Torah, Daily Offerings and Additional Offerings", slug: "Daily_Offerings_and_Additional_Offerings", alHatorah: "Temidin_uMusafin", wikisourceHebrew: "תמידים_ומוספין" },
      { displayName: "Sacrifices Rendered Unfit", hebrewName: "פסולי המוקדשין", chapters: 19, book: "Sefer Avodah", sefaria: "Mishneh Torah, Sacrifices Rendered Unfit", slug: "Sacrifices_Rendered_Unfit", alHatorah: "Pesulei_HaMukdashin", wikisourceHebrew: "פסולי_המוקדשין" },
      { displayName: "Service on the Day of Atonement", hebrewName: "עבודת יום הכפורים", chapters: 5, book: "Sefer Avodah", sefaria: "Mishneh Torah, Service on the Day of Atonement", slug: "Service_on_the_Day_of_Atonement", alHatorah: "Avodat_Yom_HaKippurim", wikisourceHebrew: "עבודת_יום_הכפורים" },
      { displayName: "Trespass", hebrewName: "מעילה", chapters: 8, book: "Sefer Avodah", sefaria: "Mishneh Torah, Trespass", slug: "Trespass", alHatorah: "Meilah", wikisourceHebrew: "מעילה" },
    ],
  },
  {
    name: "Sefer Korbanot",
    hebrewName: "ספר קרבנות",
    hilchot: [
      { displayName: "Paschal Offering", hebrewName: "קרבן פסח", chapters: 10, book: "Sefer Korbanot", sefaria: "Mishneh Torah, Paschal Offering", slug: "Paschal_Offering", alHatorah: "Korban_Pesach", wikisourceHebrew: "קרבן_פסח" },
      { displayName: "Festival Offering", hebrewName: "חגיגה", chapters: 3, book: "Sefer Korbanot", sefaria: "Mishneh Torah, Festival Offering", slug: "Festival_Offering", alHatorah: "Chagigah", wikisourceHebrew: "חגיגה" },
      { displayName: "Firstlings", hebrewName: "בכורות", chapters: 8, book: "Sefer Korbanot", sefaria: "Mishneh Torah, Firstlings", slug: "Firstlings", alHatorah: "Bekhorot", wikisourceHebrew: "בכורות" },
      { displayName: "Offerings for Unintentional Transgressions", hebrewName: "שגגות", chapters: 15, book: "Sefer Korbanot", sefaria: "Mishneh Torah, Offerings for Unintentional Transgressions", slug: "Offerings_for_Unintentional_Transgressions", alHatorah: "Shegagot", wikisourceHebrew: "שגגות" },
      { displayName: "Offerings for Those with Incomplete Atonement", hebrewName: "מחוסרי כפרה", chapters: 5, book: "Sefer Korbanot", sefaria: "Mishneh Torah, Offerings for Those with Incomplete Atonement", slug: "Offerings_for_Those_with_Incomplete_Atonement", alHatorah: "Mechuserei_Kapparah", wikisourceHebrew: "מחוסרי_כפרה" },
      { displayName: "Substitution", hebrewName: "תמורה", chapters: 4, book: "Sefer Korbanot", sefaria: "Mishneh Torah, Substitution", slug: "Substitution", alHatorah: "Temurah", wikisourceHebrew: "תמורה" },
    ],
  },
  {
    name: "Sefer Taharah",
    hebrewName: "ספר טהרה",
    hilchot: [
      { displayName: "Defilement by a Corpse", hebrewName: "טומאת מת", chapters: 25, book: "Sefer Taharah", sefaria: "Mishneh Torah, Defilement by a Corpse", slug: "Defilement_by_a_Corpse", alHatorah: "Tume'at_Meit", wikisourceHebrew: "טומאת_מת" },
      { displayName: "Red Heifer", hebrewName: "פרה אדומה", chapters: 15, book: "Sefer Taharah", sefaria: "Mishneh Torah, Red Heifer", slug: "Red_Heifer", alHatorah: "Parah_Adumah", wikisourceHebrew: "פרה_אדומה" },
      { displayName: "Defilement by Leprosy", hebrewName: "טומאת צרעת", chapters: 16, book: "Sefer Taharah", sefaria: "Mishneh Torah, Defilement by Leprosy", slug: "Defilement_by_Leprosy", alHatorah: "Tume'at_Tzara'at", wikisourceHebrew: "טומאת_צרעת" },
      { displayName: "Those Who Defile Bed or Seat", hebrewName: "מטמאי משכב ומושב", chapters: 13, book: "Sefer Taharah", sefaria: "Mishneh Torah, Those Who Defile Bed or Seat", slug: "Those_Who_Defile_Bed_or_Seat", alHatorah: "Metame'ei_Mishkav_uMoshav", wikisourceHebrew: "מטמאי_משכב_ומושב" },
      { displayName: "Other Sources of Defilement", hebrewName: "שאר אבות הטומאה", chapters: 20, book: "Sefer Taharah", sefaria: "Mishneh Torah, Other Sources of Defilement", slug: "Other_Sources_of_Defilement", alHatorah: "She'ar_Avot_haTume'ot", wikisourceHebrew: "שאר_אבות_הטומאות" },
      { displayName: "Defilement of Foods", hebrewName: "טומאת אוכלים", chapters: 16, book: "Sefer Taharah", sefaria: "Mishneh Torah, Defilement of Foods", slug: "Defilement_of_Foods", alHatorah: "Tume'at_Okhelin", wikisourceHebrew: "טומאת_אוכלים" },
      { displayName: "Vessels", hebrewName: "כלים", chapters: 28, book: "Sefer Taharah", sefaria: "Mishneh Torah, Vessels", slug: "Vessels", alHatorah: "Keilim", wikisourceHebrew: "כלים" },
      { displayName: "Immersion Pools", hebrewName: "מקואות", chapters: 11, book: "Sefer Taharah", sefaria: "Mishneh Torah, Immersion Pools", slug: "Immersion_Pools", alHatorah: "Mikvot", wikisourceHebrew: "מקואות" },
    ],
  },
  {
    name: "Sefer Nezikim",
    hebrewName: "ספר נזיקין",
    hilchot: [
      { displayName: "Damages to Property", hebrewName: "נזקי ממון", chapters: 14, book: "Sefer Nezikim", sefaria: "Mishneh Torah, Damages to Property", slug: "Damages_to_Property", alHatorah: "Nizkei_Mamon", wikisourceHebrew: "נזקי_ממון" },
      { displayName: "Theft", hebrewName: "גניבה", chapters: 9, book: "Sefer Nezikim", sefaria: "Mishneh Torah, Theft", slug: "Theft", alHatorah: "Geneivah", wikisourceHebrew: "גניבה" },
      { displayName: "Robbery and Lost Property", hebrewName: "גזילה ואבידה", chapters: 18, book: "Sefer Nezikim", sefaria: "Mishneh Torah, Robbery and Lost Property", slug: "Robbery_and_Lost_Property", alHatorah: "Gezeilah_vaAveidah", wikisourceHebrew: "גזילה_ואבידה" },
      { displayName: "One Who Injures a Person or Property", hebrewName: "חובל ומזיק", chapters: 8, book: "Sefer Nezikim", sefaria: "Mishneh Torah, One Who Injures a Person or Property", slug: "One_Who_Injures_a_Person_or_Property", alHatorah: "Chovel_uMazik", wikisourceHebrew: "חובל_ומזיק" },
      { displayName: "Murderer and the Preservation of Life", hebrewName: "רוצח ושמירת נפש", chapters: 13, book: "Sefer Nezikim", sefaria: "Mishneh Torah, Murderer and the Preservation of Life", slug: "Murderer_and_the_Preservation_of_Life", alHatorah: "Rotzeach_uShemirat_haNefesh", wikisourceHebrew: "רוצח_ושמירת_נפש" },
    ],
  },
  {
    name: "Sefer Kinyan",
    hebrewName: "ספר קנין",
    hilchot: [
      { displayName: "Sales", hebrewName: "מכירה", chapters: 30, book: "Sefer Kinyan", sefaria: "Mishneh Torah, Sales", slug: "Sales", alHatorah: "Mekhirah", wikisourceHebrew: "מכירה" },
      { displayName: "Ownerless Property and Gifts", hebrewName: "זכייה ומתנה", chapters: 12, book: "Sefer Kinyan", sefaria: "Mishneh Torah, Ownerless Property and Gifts", slug: "Ownerless_Property_and_Gifts", alHatorah: "Zekhiyah_uMatanah", wikisourceHebrew: "זכייה_ומתנה" },
      { displayName: "Neighbors", hebrewName: "שכנים", chapters: 14, book: "Sefer Kinyan", sefaria: "Mishneh Torah, Neighbors", slug: "Neighbors", alHatorah: "Shekheinim", wikisourceHebrew: "שכנים" },
      { displayName: "Agents and Partners", hebrewName: "שלוחין ושותפין", chapters: 10, book: "Sefer Kinyan", sefaria: "Mishneh Torah, Agents and Partners", slug: "Agents_and_Partners", alHatorah: "Sheluchin_veShutafin", wikisourceHebrew: "שלוחין_ושותפין" },
      { displayName: "Slaves", hebrewName: "עבדים", chapters: 9, book: "Sefer Kinyan", sefaria: "Mishneh Torah, Slaves", slug: "Slaves", alHatorah: "Avadim", wikisourceHebrew: "עבדים" },
    ],
  },
  {
    name: "Sefer Mishpatim",
    hebrewName: "ספר משפטים",
    hilchot: [
      { displayName: "Hiring", hebrewName: "שכירות", chapters: 13, book: "Sefer Mishpatim", sefaria: "Mishneh Torah, Hiring", slug: "Hiring", alHatorah: "Sekhirut", wikisourceHebrew: "שכירות" },
      { displayName: "Borrowing and Deposit", hebrewName: "שאלה ופיקדון", chapters: 8, book: "Sefer Mishpatim", sefaria: "Mishneh Torah, Borrowing and Deposit", slug: "Borrowing_and_Deposit", alHatorah: "She'eilah_uPikkadon", wikisourceHebrew: "שאלה_ופיקדון" },
      { displayName: "Creditor and Debtor", hebrewName: "מלווה ולווה", chapters: 27, book: "Sefer Mishpatim", sefaria: "Mishneh Torah, Creditor and Debtor", slug: "Creditor_and_Debtor", alHatorah: "Malveh_veLoveh", wikisourceHebrew: "מלווה_ולווה" },
      { displayName: "Plaintiff and Defendant", hebrewName: "טוען ונטען", chapters: 16, book: "Sefer Mishpatim", sefaria: "Mishneh Torah, Plaintiff and Defendant", slug: "Plaintiff_and_Defendant", alHatorah: "To'ein_veNit'an", wikisourceHebrew: "טוען_ונטען" },
      { displayName: "Inheritances", hebrewName: "נחלות", chapters: 11, book: "Sefer Mishpatim", sefaria: "Mishneh Torah, Inheritances", slug: "Inheritances", alHatorah: "Nachalot", wikisourceHebrew: "נחלות" },
    ],
  },
  {
    name: "Sefer Shoftim",
    hebrewName: "ספר שופטים",
    hilchot: [
      { displayName: "The Sanhedrin and the Penalties within Their Jurisdiction", hebrewName: "סנהדרין והעונשין המסורין להם", chapters: 26, book: "Sefer Shoftim", sefaria: "Mishneh Torah, The Sanhedrin and the Penalties within Their Jurisdiction", slug: "The_Sanhedrin_and_the_Penalties_within_Their_Jurisdiction", alHatorah: "Sanhedrin", wikisourceHebrew: "סנהדרין_והעונשין_המסורין_להם" },
      { displayName: "Testimony", hebrewName: "עדות", chapters: 22, book: "Sefer Shoftim", sefaria: "Mishneh Torah, Testimony", slug: "Testimony", alHatorah: "Eidut", wikisourceHebrew: "עדות" },
      { displayName: "Rebels", hebrewName: "ממרים", chapters: 7, book: "Sefer Shoftim", sefaria: "Mishneh Torah, Rebels", slug: "Rebels", alHatorah: "Mamrim", wikisourceHebrew: "ממרים" },
      { displayName: "Mourning", hebrewName: "אבל", chapters: 14, book: "Sefer Shoftim", sefaria: "Mishneh Torah, Mourning", slug: "Mourning", alHatorah: "Eivel", wikisourceHebrew: "אבל" },
      { displayName: "Kings and Wars", hebrewName: "מלכים ומלחמות", chapters: 12, book: "Sefer Shoftim", sefaria: "Mishneh Torah, Kings and Wars", slug: "Kings_and_Wars", alHatorah: "Melakhim", wikisourceHebrew: "מלכים_ומלחמות" },
    ],
  },
];

const _slugToHilchot = new Map<string, RambamHilchot>();
for (const prefatory of RAMBAM_PREFATORY) {
  _slugToHilchot.set(prefatory.slug.toLowerCase(), prefatory);
}
for (const book of RAMBAM_BOOKS) {
  for (const h of book.hilchot) {
    _slugToHilchot.set(h.slug.toLowerCase(), h);
  }
}

export function getRambamHilchotInfo(slug: string): RambamHilchot | null {
  return _slugToHilchot.get(slug.toLowerCase()) ?? null;
}

export function isValidRambamHilchot(slug: string): boolean {
  return _slugToHilchot.has(slug.toLowerCase());
}

export function getRambamHilchotSlug(displayName: string): string {
  return displayName.replace(/ /g, '_');
}

export function normalizeRambamHilchotName(slug: string): string | null {
  return _slugToHilchot.get(slug.toLowerCase())?.displayName ?? null;
}

export function getRambamSefariaKey(slug: string): string | null {
  return _slugToHilchot.get(slug.toLowerCase())?.sefaria ?? null;
}
