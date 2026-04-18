export type Language = 'HE' | 'AR' | 'GR';
export type BaseLanguage = 'kjv' | 'krv';

export interface BookMeta {
  number: number;
  nameEn: string;
  nameOriginal: string;
  nameKr: string;
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
  { number: 1,  nameEn: 'Genesis',        nameOriginal: 'בר아שית',           nameKr: '창세기',         language: 'HE', chapters: 50,  testament: 'OT' },
  { number: 2,  nameEn: 'Exodus',         nameOriginal: 'שמות',             nameKr: '출애굽기',       language: 'HE', chapters: 40,  testament: 'OT' },
  { number: 3,  nameEn: 'Leviticus',      nameOriginal: 'ויקרא',            nameKr: '레위기',         language: 'HE', chapters: 27,  testament: 'OT' },
  { number: 4,  nameEn: 'Numbers',        nameOriginal: 'במד버',            nameKr: '민수기',         language: 'HE', chapters: 36,  testament: 'OT' },
  { number: 5,  nameEn: 'Deuteronomy',    nameOriginal: 'דברים',            nameKr: '신명기',         language: 'HE', chapters: 34,  testament: 'OT' },
  { number: 6,  nameEn: 'Joshua',         nameOriginal: 'יהושע',            nameKr: '여호수아',       language: 'HE', chapters: 24,  testament: 'OT' },
  { number: 7,  nameEn: 'Judges',         nameOriginal: 'שופטים',           nameKr: '사사기',         language: 'HE', chapters: 21,  testament: 'OT' },
  { number: 8,  nameEn: 'Ruth',           nameOriginal: 'רות',              nameKr: '룻기',           language: 'HE', chapters: 4,   testament: 'OT' },
  { number: 9,  nameEn: '1 Samuel',       nameOriginal: 'שמואล א',          nameKr: '사무엘상',       language: 'HE', chapters: 31,  testament: 'OT' },
  { number: 10, nameEn: '2 Samuel',       nameOriginal: 'שמואל ב',          nameKr: '사무엘하',       language: 'HE', chapters: 24,  testament: 'OT' },
  { number: 11, nameEn: '1 Kings',        nameOriginal: 'מלכים א',          nameKr: '열왕기상',       language: 'HE', chapters: 22,  testament: 'OT' },
  { number: 12, nameEn: '2 Kings',        nameOriginal: 'מלכים ב',          nameKr: '열왕기하',       language: 'HE', chapters: 25,  testament: 'OT' },
  { number: 13, nameEn: '1 Chronicles',   nameOriginal: 'דברי הימים א',     nameKr: '역대상',         language: 'HE', chapters: 29,  testament: 'OT' },
  { number: 14, nameEn: '2 Chronicles',   nameOriginal: 'דברי הימים ב',     nameKr: '역대하',         language: 'HE', chapters: 36,  testament: 'OT' },
  { number: 15, nameEn: 'Ezra',           nameOriginal: 'עזרא',             nameKr: '에스라',         language: 'HE', chapters: 10,  testament: 'OT' },
  { number: 16, nameEn: 'Nehemiah',       nameOriginal: 'נחמיה',            nameKr: '느헤미야',       language: 'HE', chapters: 13,  testament: 'OT' },
  { number: 17, nameEn: 'Esther',         nameOriginal: 'אסתר',             nameKr: '에스더',         language: 'HE', chapters: 10,  testament: 'OT' },

  // === OLD TESTAMENT — Arabic (Poetry + Prophets) ===
  { number: 18, nameEn: 'Job',              nameOriginal: 'أيوب',              nameKr: '욥기',           language: 'AR', chapters: 42,  testament: 'OT' },
  { number: 19, nameEn: 'Psalms',           nameOriginal: 'المزامير',           nameKr: '시편',           language: 'AR', chapters: 150, testament: 'OT' },
  { number: 20, nameEn: 'Proverbs',         nameOriginal: 'الأمثال',            nameKr: '잠언',           language: 'AR', chapters: 31,  testament: 'OT' },
  { number: 21, nameEn: 'Ecclesiastes',     nameOriginal: 'الجامعة',            nameKr: '전도서',         language: 'AR', chapters: 12,  testament: 'OT' },
  { number: 22, nameEn: 'Song of Solomon',  nameOriginal: 'نشيد الأنشاد',       nameKr: '아가',           language: 'AR', chapters: 8,   testament: 'OT' },
  { number: 23, nameEn: 'Isaiah',           nameOriginal: 'إشعياء',             nameKr: '이사야',         language: 'AR', chapters: 66,  testament: 'OT' },
  { number: 24, nameEn: 'Jeremiah',         nameOriginal: 'إرميا',              nameKr: '예레미야',       language: 'AR', chapters: 52,  testament: 'OT' },
  { number: 25, nameEn: 'Lamentations',     nameOriginal: 'مراثي إرميا',        nameKr: '예레미야 애가',   language: 'AR', chapters: 5,   testament: 'OT' },
  { number: 26, nameEn: 'Ezekiel',          nameOriginal: 'حزقيال',             nameKr: '에스겔',         language: 'AR', chapters: 48,  testament: 'OT' },
  { number: 27, nameEn: 'Daniel',           nameOriginal: 'دانيال',             nameKr: '다니엘',         language: 'AR', chapters: 12,  testament: 'OT' },
  { number: 28, nameEn: 'Hosea',            nameOriginal: 'هوشع',              nameKr: '호세아',         language: 'AR', chapters: 14,  testament: 'OT' },
  { number: 29, nameEn: 'Joel',             nameOriginal: 'يوئيل',              nameKr: '요엘',           language: 'AR', chapters: 3,   testament: 'OT' },
  { number: 30, nameEn: 'Amos',             nameOriginal: 'عاموس',             nameKr: '아모스',         language: 'AR', chapters: 9,   testament: 'OT' },
  { number: 31, nameEn: 'Obadiah',          nameOriginal: 'عوبديا',             nameKr: '오바댜',         language: 'AR', chapters: 1,   testament: 'OT' },
  { number: 32, nameEn: 'Jonah',            nameOriginal: 'يونان',              nameKr: '요나',           language: 'AR', chapters: 4,   testament: 'OT' },
  { number: 33, nameEn: 'Micah',            nameOriginal: 'ميخا',              nameKr: '미가',           language: 'AR', chapters: 7,   testament: 'OT' },
  { number: 34, nameEn: 'Nahum',            nameOriginal: 'ناحوم',             nameKr: '나훔',           language: 'AR', chapters: 3,   testament: 'OT' },
  { number: 35, nameEn: 'Habakkuk',         nameOriginal: 'حبقوق',             nameKr: '하박국',         language: 'AR', chapters: 3,   testament: 'OT' },
  { number: 36, nameEn: 'Zephaniah',        nameOriginal: 'صفنيا',             nameKr: '스바냐',         language: 'AR', chapters: 3,   testament: 'OT' },
  { number: 37, nameEn: 'Haggai',           nameOriginal: 'حجي',               nameKr: '학개',           language: 'AR', chapters: 2,   testament: 'OT' },
  { number: 38, nameEn: 'Zechariah',        nameOriginal: 'زكريا',             nameKr: '스가랴',         language: 'AR', chapters: 14,  testament: 'OT' },
  { number: 39, nameEn: 'Malachi',          nameOriginal: 'ملاخي',             nameKr: '말라기',         language: 'AR', chapters: 4,   testament: 'OT' },

  // === NEW TESTAMENT — Greek ===
  { number: 40, nameEn: 'Matthew',          nameOriginal: 'Κατὰ Ματθαῖον',         nameKr: '마태복음',       language: 'GR', chapters: 28, testament: 'NT' },
  { number: 41, nameEn: 'Mark',             nameOriginal: 'Κατὰ Μᾶρκον',           nameKr: '마가복음',       language: 'GR', chapters: 16, testament: 'NT' },
  { number: 42, nameEn: 'Luke',             nameOriginal: 'Κατὰ Λουκᾶν',           nameKr: '누가복음',       language: 'GR', chapters: 24, testament: 'NT' },
  { number: 43, nameEn: 'John',             nameOriginal: 'Κατὰ Ἰωάννην',          nameKr: '요한복음',       language: 'GR', chapters: 21, testament: 'NT' },
  { number: 44, nameEn: 'Acts',             nameOriginal: 'Πράξεις Ἀποστόλων',      nameKr: '사도행전',       language: 'GR', chapters: 28, testament: 'NT' },
  { number: 45, nameEn: 'Romans',           nameOriginal: 'Πρὸς Ρωμαίους',          nameKr: '로마서',         language: 'GR', chapters: 16, testament: 'NT' },
  { number: 46, nameEn: '1 Corinthians',    nameOriginal: 'Πρὸς Κορινθίους Αʹ',     nameKr: '고린도전서',     language: 'GR', chapters: 16, testament: 'NT' },
  { number: 47, nameEn: '2 Corinthians',    nameOriginal: 'Πρὸς Κορινθίους Βʹ',     nameKr: '고린도후서',     language: 'GR', chapters: 13, testament: 'NT' },
  { number: 48, nameEn: 'Galatians',        nameOriginal: 'Πρὸς Γαλάτας',           nameKr: '갈라디아서',     language: 'GR', chapters: 6,  testament: 'NT' },
  { number: 49, nameEn: 'Ephesians',        nameOriginal: 'Πρὸς Ἐφεσίους',          nameKr: '에베소서',       language: 'GR', chapters: 6,  testament: 'NT' },
  { number: 50, nameEn: 'Philippians',      nameOriginal: 'Πρὸς Φιλιππησίους',      nameKr: '빌립보서',       language: 'GR', chapters: 4,  testament: 'NT' },
  { number: 51, nameEn: 'Colossians',       nameOriginal: 'Πρὸς Κολοσσαεῖς',        nameKr: '골로새서',       language: 'GR', chapters: 4,  testament: 'NT' },
  { number: 52, nameEn: '1 Thessalonians',  nameOriginal: 'Πρὸς Θεσσαλονικεῖς Αʹ',  nameKr: '데살로니가전서',   language: 'GR', chapters: 5,  testament: 'NT' },
  { number: 53, nameEn: '2 Thessalonians',  nameOriginal: 'Πρὸς Θεσσαλονικεῖς Βʹ',  nameKr: '데살로니가후서',   language: 'GR', chapters: 3,  testament: 'NT' },
  { number: 54, nameEn: '1 Timothy',        nameOriginal: 'Πρὸς Τιμόθεον Αʹ',       nameKr: '디모데전서',     language: 'GR', chapters: 6,  testament: 'NT' },
  { number: 55, nameEn: '2 Timothy',        nameOriginal: 'Πρὸς Τιμόθεον Βʹ',       nameKr: '디모데후서',     language: 'GR', chapters: 4,  testament: 'NT' },
  { number: 56, nameEn: 'Titus',            nameOriginal: 'Πρὸς Τίτον',             nameKr: '디도서',         language: 'GR', chapters: 3,  testament: 'NT' },
  { number: 57, nameEn: 'Philemon',         nameOriginal: 'Πρὸς Φιλή모να',          nameKr: '빌레몬서',       language: 'GR', chapters: 1,  testament: 'NT' },
  { number: 58, nameEn: 'Hebrews',          nameOriginal: 'Πρὸς Ἑβραίους',          nameKr: '히브리서',       language: 'GR', chapters: 13, testament: 'NT' },
  { number: 59, nameEn: 'James',            nameOriginal: 'Ἰακώβου',                nameKr: '야고보서',       language: 'GR', chapters: 5,  testament: 'NT' },
  { number: 60, nameEn: '1 Peter',          nameOriginal: 'Πέτρου Αʹ',              nameKr: '베드로전서',     language: 'GR', chapters: 5,  testament: 'NT' },
  { number: 61, nameEn: '2 Peter',          nameOriginal: 'Πέτρου Βʹ',              nameKr: '베드로후서',     language: 'GR', chapters: 3,  testament: 'NT' },
  { number: 62, nameEn: '1 John',           nameOriginal: 'Ἰωάννου Αʹ',             nameKr: '요한일서',       language: 'GR', chapters: 5,  testament: 'NT' },
  { number: 63, nameEn: '2 John',           nameOriginal: 'Ἰωάννου Βʹ',             nameKr: '요한이서',       language: 'GR', chapters: 1,  testament: 'NT' },
  { number: 64, nameEn: '3 John',           nameOriginal: 'Ἰωάννου Γʹ',             nameKr: '요한삼서',       language: 'GR', chapters: 1,  testament: 'NT' },
  { number: 65, nameEn: 'Jude',             nameOriginal: 'Ἰούδα',                  nameKr: '유다서',         language: 'GR', chapters: 1,  testament: 'NT' },
  { number: 66, nameEn: 'Revelation',       nameOriginal: 'Ἀποκάλυψις Ἰωάννου',     nameKr: '요한계시록',     language: 'GR', chapters: 22, testament: 'NT' },
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
