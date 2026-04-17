/**
 * Download Bible translations (KJV + 개역한글) for use as base-language meanings.
 *
 * Sources:
 *   - KJV (English):       "kjv"    on getbible.net — Public domain
 *   - 개역한글 (Korean):    "korean" on getbible.net — Public domain
 *
 * Usage:
 *   npx tsx scripts/download-translations.ts              # download both
 *   npx tsx scripts/download-translations.ts kjv           # KJV only
 *   npx tsx scripts/download-translations.ts korean        # Korean only
 *   npx tsx scripts/download-translations.ts kjv 1         # KJV Genesis only
 *   npx tsx scripts/download-translations.ts kjv 1 5       # KJV Genesis–Deuteronomy
 */

import fs from 'fs';
import path from 'path';

const TRANSLATIONS = [
  { code: 'kjv',    folder: 'kjv', label: 'KJV (English)' },
  { code: 'korean', folder: 'krv', label: '개역한글 (Korean)' },
];

const BOOK_CHAPTERS: Record<number, number> = {
  1:50,2:40,3:27,4:36,5:34,6:24,7:21,8:4,9:31,10:24,
  11:22,12:25,13:29,14:36,15:10,16:13,17:10,18:42,19:150,20:31,
  21:12,22:8,23:66,24:52,25:5,26:48,27:12,28:14,29:3,30:9,
  31:1,32:4,33:7,34:3,35:3,36:3,37:2,38:14,39:4,
  40:28,41:16,42:24,43:21,44:28,45:16,46:16,47:13,48:6,49:6,
  50:4,51:4,52:5,53:3,54:6,55:4,56:3,57:1,58:13,59:5,
  60:5,61:3,62:5,63:1,64:1,65:1,66:22,
};

const BOOK_NAMES: Record<number, string> = {
  1:'Genesis',2:'Exodus',3:'Leviticus',4:'Numbers',5:'Deuteronomy',
  6:'Joshua',7:'Judges',8:'Ruth',9:'1 Samuel',10:'2 Samuel',
  11:'1 Kings',12:'2 Kings',13:'1 Chronicles',14:'2 Chronicles',
  15:'Ezra',16:'Nehemiah',17:'Esther',18:'Job',19:'Psalms',20:'Proverbs',
  21:'Ecclesiastes',22:'Song of Solomon',23:'Isaiah',24:'Jeremiah',
  25:'Lamentations',26:'Ezekiel',27:'Daniel',28:'Hosea',29:'Joel',30:'Amos',
  31:'Obadiah',32:'Jonah',33:'Micah',34:'Nahum',35:'Habakkuk',36:'Zephaniah',
  37:'Haggai',38:'Zechariah',39:'Malachi',
  40:'Matthew',41:'Mark',42:'Luke',43:'John',44:'Acts',45:'Romans',
  46:'1 Corinthians',47:'2 Corinthians',48:'Galatians',49:'Ephesians',
  50:'Philippians',51:'Colossians',52:'1 Thessalonians',53:'2 Thessalonians',
  54:'1 Timothy',55:'2 Timothy',56:'Titus',57:'Philemon',58:'Hebrews',
  59:'James',60:'1 Peter',61:'2 Peter',62:'1 John',63:'2 John',64:'3 John',
  65:'Jude',66:'Revelation',
};

const BASE_URL = 'https://api.getbible.net/v2';
const OUTPUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data');

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err: any) {
      console.warn(`  Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) await sleep(1000 * attempt);
      else throw err;
    }
  }
}

interface GetBibleVerse {
  chapter: number;
  verse: number;
  name: string;
  text: string;
}

interface GetBibleChapter {
  chapter: number;
  name: string;
  verses: GetBibleVerse[];
}

interface GetBibleBook {
  nr: number;
  name: string;
  chapters: GetBibleChapter[];
}

async function downloadBook(
  translationCode: string,
  folder: string,
  bookNumber: number,
): Promise<number> {
  const url = `${BASE_URL}/${translationCode}/${bookNumber}.json`;

  let data: GetBibleBook;
  try {
    data = await fetchWithRetry(url);
  } catch (err: any) {
    console.error(`  ❌ Failed: ${BOOK_NAMES[bookNumber]}: ${err.message}`);
    return 0;
  }

  let written = 0;
  for (const chapter of data.chapters) {
    const verses = chapter.verses
      .sort((a, b) => a.verse - b.verse)
      .map(v => ({
        number: v.verse,
        text: v.text.trim(),
      }));

    const chapterData = {
      bookNumber,
      bookName: BOOK_NAMES[bookNumber],
      chapter: chapter.chapter,
      translation: folder,
      verses,
    };

    const dir = path.join(OUTPUT_DIR, folder, String(bookNumber));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `${chapter.chapter}.json`),
      JSON.stringify(chapterData, null, 2),
      'utf-8',
    );
    written++;
  }

  return written;
}

async function main() {
  const args = process.argv.slice(2);

  let translationsToDownload = TRANSLATIONS;
  let bookFrom = 1;
  let bookTo = 66;

  // Parse args: [translation] [bookFrom] [bookTo]
  if (args.length >= 1 && ['kjv', 'korean'].includes(args[0])) {
    translationsToDownload = TRANSLATIONS.filter(t => t.code === args[0]);
    if (args.length >= 2) bookFrom = parseInt(args[1], 10);
    if (args.length >= 3) bookTo = parseInt(args[2], 10);
    else if (args.length === 2) bookTo = bookFrom;
  }

  const bookNumbers = Object.keys(BOOK_CHAPTERS)
    .map(Number)
    .filter(n => n >= bookFrom && n <= bookTo);

  for (const t of translationsToDownload) {
    console.log(`\n🔽 Downloading ${t.label} (${bookNumbers.length} books)...\n`);

    let totalChapters = 0;
    for (const bookNum of bookNumbers) {
      process.stdout.write(`  📖 ${BOOK_NAMES[bookNum]}...`);
      const written = await downloadBook(t.code, t.folder, bookNum);
      totalChapters += written;
      console.log(` ${written} chapters`);
      await sleep(300);
    }

    console.log(`\n  ✅ ${t.label}: ${totalChapters} chapters saved to public/data/${t.folder}/`);
  }

  console.log('\n✨ Done!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
