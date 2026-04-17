export type Language = 'HE' | 'AR' | 'GR';
export type BaseLanguage = 'kjv' | 'krv';

export interface BookMeta {
  number: number;
  nameEn: string;
  nameOriginal: string;
  language: Language;
  chapters: number;
  testament: 'OT' | 'NT';
}

export const LANGUAGE_NAMES: Record<Language, string> = {
  HE: 'עברית (Hebrew)',
  AR: 'العربية (Arabic)',
  GR: 'Ελληνικά (Greek)',
};

export const LANGUAGE_FONT: Record<Language, string> = {
  HE: 'font-he',
  AR: 'font-ar',
  GR: '',
};

export const RTL_LANGUAGES: Language[] = ['HE', 'AR'];

export const BIBLE_BOOKS: BookMeta[] = [
  // === OLD TESTAMENT — Hebrew (Torah + Historical Books) ===
  { number: 1,  nameEn: 'Genesis',        nameOriginal: 'בראשית',           language: 'HE', chapters: 50,  testament: 'OT' },
  { number: 2,  nameEn: 'Exodus',         nameOriginal: 'שמות',             language: 'HE', chapters: 40,  testament: 'OT' },
  { number: 3,  nameEn: 'Leviticus',      nameOriginal: 'ויקרא',            language: 'HE', chapters: 27,  testament: 'OT' },
  { number: 4,  nameEn: 'Numbers',        nameOriginal: 'במדבר',            language: 'HE', chapters: 36,  testament: 'OT' },
  { number: 5,  nameEn: 'Deuteronomy',    nameOriginal: 'דברים',            language: 'HE', chapters: 34,  testament: 'OT' },
  { number: 6,  nameEn: 'Joshua',         nameOriginal: 'יהושע',            language: 'HE', chapters: 24,  testament: 'OT' },
  { number: 7,  nameEn: 'Judges',         nameOriginal: 'שופטים',           language: 'HE', chapters: 21,  testament: 'OT' },
  { number: 8,  nameEn: 'Ruth',           nameOriginal: 'רות',              language: 'HE', chapters: 4,   testament: 'OT' },
  { number: 9,  nameEn: '1 Samuel',       nameOriginal: 'שמואל א',          language: 'HE', chapters: 31,  testament: 'OT' },
  { number: 10, nameEn: '2 Samuel',       nameOriginal: 'שמואל ב',          language: 'HE', chapters: 24,  testament: 'OT' },
  { number: 11, nameEn: '1 Kings',        nameOriginal: 'מלכים א',          language: 'HE', chapters: 22,  testament: 'OT' },
  { number: 12, nameEn: '2 Kings',        nameOriginal: 'מלכים ב',          language: 'HE', chapters: 25,  testament: 'OT' },
  { number: 13, nameEn: '1 Chronicles',   nameOriginal: 'דברי הימים א',     language: 'HE', chapters: 29,  testament: 'OT' },
  { number: 14, nameEn: '2 Chronicles',   nameOriginal: 'דברי הימים ב',     language: 'HE', chapters: 36,  testament: 'OT' },
  { number: 15, nameEn: 'Ezra',           nameOriginal: 'עזרא',             language: 'HE', chapters: 10,  testament: 'OT' },
  { number: 16, nameEn: 'Nehemiah',       nameOriginal: 'נחמיה',            language: 'HE', chapters: 13,  testament: 'OT' },
  { number: 17, nameEn: 'Esther',         nameOriginal: 'אסתר',             language: 'HE', chapters: 10,  testament: 'OT' },

  // === OLD TESTAMENT — Arabic (Poetry + Prophets) ===
  { number: 18, nameEn: 'Job',              nameOriginal: 'أيوب',              language: 'AR', chapters: 42,  testament: 'OT' },
  { number: 19, nameEn: 'Psalms',           nameOriginal: 'المزامير',           language: 'AR', chapters: 150, testament: 'OT' },
  { number: 20, nameEn: 'Proverbs',         nameOriginal: 'الأمثال',            language: 'AR', chapters: 31,  testament: 'OT' },
  { number: 21, nameEn: 'Ecclesiastes',     nameOriginal: 'الجامعة',            language: 'AR', chapters: 12,  testament: 'OT' },
  { number: 22, nameEn: 'Song of Solomon',  nameOriginal: 'نشيد الأنشاد',       language: 'AR', chapters: 8,   testament: 'OT' },
  { number: 23, nameEn: 'Isaiah',           nameOriginal: 'إشعياء',             language: 'AR', chapters: 66,  testament: 'OT' },
  { number: 24, nameEn: 'Jeremiah',         nameOriginal: 'إرميا',              language: 'AR', chapters: 52,  testament: 'OT' },
  { number: 25, nameEn: 'Lamentations',     nameOriginal: 'مراثي إرميا',        language: 'AR', chapters: 5,   testament: 'OT' },
  { number: 26, nameEn: 'Ezekiel',          nameOriginal: 'حزقيال',             language: 'AR', chapters: 48,  testament: 'OT' },
  { number: 27, nameEn: 'Daniel',           nameOriginal: 'دانيال',             language: 'AR', chapters: 12,  testament: 'OT' },
  { number: 28, nameEn: 'Hosea',            nameOriginal: 'هوشع',              language: 'AR', chapters: 14,  testament: 'OT' },
  { number: 29, nameEn: 'Joel',             nameOriginal: 'يوئيل',              language: 'AR', chapters: 3,   testament: 'OT' },
  { number: 30, nameEn: 'Amos',             nameOriginal: 'عاموس',             language: 'AR', chapters: 9,   testament: 'OT' },
  { number: 31, nameEn: 'Obadiah',          nameOriginal: 'عوبديا',             language: 'AR', chapters: 1,   testament: 'OT' },
  { number: 32, nameEn: 'Jonah',            nameOriginal: 'يونان',              language: 'AR', chapters: 4,   testament: 'OT' },
  { number: 33, nameEn: 'Micah',            nameOriginal: 'ميخا',              language: 'AR', chapters: 7,   testament: 'OT' },
  { number: 34, nameEn: 'Nahum',            nameOriginal: 'ناحوم',             language: 'AR', chapters: 3,   testament: 'OT' },
  { number: 35, nameEn: 'Habakkuk',         nameOriginal: 'حبقوق',             language: 'AR', chapters: 3,   testament: 'OT' },
  { number: 36, nameEn: 'Zephaniah',        nameOriginal: 'صفنيا',             language: 'AR', chapters: 3,   testament: 'OT' },
  { number: 37, nameEn: 'Haggai',           nameOriginal: 'حجي',               language: 'AR', chapters: 2,   testament: 'OT' },
  { number: 38, nameEn: 'Zechariah',        nameOriginal: 'زكريا',             language: 'AR', chapters: 14,  testament: 'OT' },
  { number: 39, nameEn: 'Malachi',          nameOriginal: 'ملاخي',             language: 'AR', chapters: 4,   testament: 'OT' },

  // === NEW TESTAMENT — Greek ===
  { number: 40, nameEn: 'Matthew',          nameOriginal: 'Κατὰ Ματθαῖον',         language: 'GR', chapters: 28, testament: 'NT' },
  { number: 41, nameEn: 'Mark',             nameOriginal: 'Κατὰ Μᾶρκον',           language: 'GR', chapters: 16, testament: 'NT' },
  { number: 42, nameEn: 'Luke',             nameOriginal: 'Κατὰ Λουκᾶν',           language: 'GR', chapters: 24, testament: 'NT' },
  { number: 43, nameEn: 'John',             nameOriginal: 'Κατὰ Ἰωάννην',          language: 'GR', chapters: 21, testament: 'NT' },
  { number: 44, nameEn: 'Acts',             nameOriginal: 'Πράξεις Ἀποστόλων',      language: 'GR', chapters: 28, testament: 'NT' },
  { number: 45, nameEn: 'Romans',           nameOriginal: 'Πρὸς Ρωμαίους',          language: 'GR', chapters: 16, testament: 'NT' },
  { number: 46, nameEn: '1 Corinthians',    nameOriginal: 'Πρὸς Κορινθίους Αʹ',     language: 'GR', chapters: 16, testament: 'NT' },
  { number: 47, nameEn: '2 Corinthians',    nameOriginal: 'Πρὸς Κορινθίους Βʹ',     language: 'GR', chapters: 13, testament: 'NT' },
  { number: 48, nameEn: 'Galatians',        nameOriginal: 'Πρὸς Γαλάτας',           language: 'GR', chapters: 6,  testament: 'NT' },
  { number: 49, nameEn: 'Ephesians',        nameOriginal: 'Πρὸς Ἐφεσίους',          language: 'GR', chapters: 6,  testament: 'NT' },
  { number: 50, nameEn: 'Philippians',      nameOriginal: 'Πρὸς Φιλιππησίους',      language: 'GR', chapters: 4,  testament: 'NT' },
  { number: 51, nameEn: 'Colossians',       nameOriginal: 'Πρὸς Κολοσσαεῖς',        language: 'GR', chapters: 4,  testament: 'NT' },
  { number: 52, nameEn: '1 Thessalonians',  nameOriginal: 'Πρὸς Θεσσαλονικεῖς Αʹ',  language: 'GR', chapters: 5,  testament: 'NT' },
  { number: 53, nameEn: '2 Thessalonians',  nameOriginal: 'Πρὸς Θεσσαλονικεῖς Βʹ',  language: 'GR', chapters: 3,  testament: 'NT' },
  { number: 54, nameEn: '1 Timothy',        nameOriginal: 'Πρὸς Τιμόθεον Αʹ',       language: 'GR', chapters: 6,  testament: 'NT' },
  { number: 55, nameEn: '2 Timothy',        nameOriginal: 'Πρὸς Τιμόθεον Βʹ',       language: 'GR', chapters: 4,  testament: 'NT' },
  { number: 56, nameEn: 'Titus',            nameOriginal: 'Πρὸς Τίτον',             language: 'GR', chapters: 3,  testament: 'NT' },
  { number: 57, nameEn: 'Philemon',         nameOriginal: 'Πρὸς Φιλήμονα',          language: 'GR', chapters: 1,  testament: 'NT' },
  { number: 58, nameEn: 'Hebrews',          nameOriginal: 'Πρὸς Ἑβραίους',          language: 'GR', chapters: 13, testament: 'NT' },
  { number: 59, nameEn: 'James',            nameOriginal: 'Ἰακώβου',                language: 'GR', chapters: 5,  testament: 'NT' },
  { number: 60, nameEn: '1 Peter',          nameOriginal: 'Πέτρου Αʹ',              language: 'GR', chapters: 5,  testament: 'NT' },
  { number: 61, nameEn: '2 Peter',          nameOriginal: 'Πέτρου Βʹ',              language: 'GR', chapters: 3,  testament: 'NT' },
  { number: 62, nameEn: '1 John',           nameOriginal: 'Ἰωάννου Αʹ',             language: 'GR', chapters: 5,  testament: 'NT' },
  { number: 63, nameEn: '2 John',           nameOriginal: 'Ἰωάννου Βʹ',             language: 'GR', chapters: 1,  testament: 'NT' },
  { number: 64, nameEn: '3 John',           nameOriginal: 'Ἰωάννου Γʹ',             language: 'GR', chapters: 1,  testament: 'NT' },
  { number: 65, nameEn: 'Jude',             nameOriginal: 'Ἰούδα',                  language: 'GR', chapters: 1,  testament: 'NT' },
  { number: 66, nameEn: 'Revelation',       nameOriginal: 'Ἀποκάλυψις Ἰωάννου',     language: 'GR', chapters: 22, testament: 'NT' },
];

export function getBook(bookNumber: number): BookMeta | undefined {
  return BIBLE_BOOKS.find(b => b.number === bookNumber);
}

export function getBooksByTestament(testament: 'OT' | 'NT'): BookMeta[] {
  return BIBLE_BOOKS.filter(b => b.testament === testament);
}

export const BASE_LANGUAGE_NAMES: Record<BaseLanguage, string> = {
  kjv: 'English (KJV)',
  krv: '한국어 (개역한글)',
};

export function isRTL(language: Language): boolean {
  return RTL_LANGUAGES.includes(language);
}
