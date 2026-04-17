/**
 * Download Bible texts from getbible.net CDN and save as per-chapter JSON files.
 *
 * Sources:
 *   - Hebrew OT (books 1-17):  Aleppo Codex ("aleppo")
 *   - Arabic OT (books 18-39): Smith & Van Dyck ("arabicsv")
 *   - Greek NT  (books 40-66): Textus Receptus ("textusreceptus")
 *
 * Usage:
 *   npx tsx scripts/download-bible.ts            # download all books
 *   npx tsx scripts/download-bible.ts 1           # download Genesis only
 *   npx tsx scripts/download-bible.ts 1 5         # download Genesis through Deuteronomy
 */

import fs from 'fs';
import path from 'path';

// ── Book definitions (mirrors bibleStructure.ts) ──────────────────────────

interface BookDef {
  number: number;
  nameEn: string;
  language: 'HE' | 'AR' | 'GR';
  chapters: number;
}

const BOOKS: BookDef[] = [
  // Hebrew OT — Torah + Historical
  { number: 1,  nameEn: 'Genesis',        language: 'HE', chapters: 50 },
  { number: 2,  nameEn: 'Exodus',         language: 'HE', chapters: 40 },
  { number: 3,  nameEn: 'Leviticus',      language: 'HE', chapters: 27 },
  { number: 4,  nameEn: 'Numbers',        language: 'HE', chapters: 36 },
  { number: 5,  nameEn: 'Deuteronomy',    language: 'HE', chapters: 34 },
  { number: 6,  nameEn: 'Joshua',         language: 'HE', chapters: 24 },
  { number: 7,  nameEn: 'Judges',         language: 'HE', chapters: 21 },
  { number: 8,  nameEn: 'Ruth',           language: 'HE', chapters: 4 },
  { number: 9,  nameEn: '1 Samuel',       language: 'HE', chapters: 31 },
  { number: 10, nameEn: '2 Samuel',       language: 'HE', chapters: 24 },
  { number: 11, nameEn: '1 Kings',        language: 'HE', chapters: 22 },
  { number: 12, nameEn: '2 Kings',        language: 'HE', chapters: 25 },
  { number: 13, nameEn: '1 Chronicles',   language: 'HE', chapters: 29 },
  { number: 14, nameEn: '2 Chronicles',   language: 'HE', chapters: 36 },
  { number: 15, nameEn: 'Ezra',           language: 'HE', chapters: 10 },
  { number: 16, nameEn: 'Nehemiah',       language: 'HE', chapters: 13 },
  { number: 17, nameEn: 'Esther',         language: 'HE', chapters: 10 },
  // Arabic OT — Poetry + Prophets
  { number: 18, nameEn: 'Job',              language: 'AR', chapters: 42 },
  { number: 19, nameEn: 'Psalms',           language: 'AR', chapters: 150 },
  { number: 20, nameEn: 'Proverbs',         language: 'AR', chapters: 31 },
  { number: 21, nameEn: 'Ecclesiastes',     language: 'AR', chapters: 12 },
  { number: 22, nameEn: 'Song of Solomon',  language: 'AR', chapters: 8 },
  { number: 23, nameEn: 'Isaiah',           language: 'AR', chapters: 66 },
  { number: 24, nameEn: 'Jeremiah',         language: 'AR', chapters: 52 },
  { number: 25, nameEn: 'Lamentations',     language: 'AR', chapters: 5 },
  { number: 26, nameEn: 'Ezekiel',          language: 'AR', chapters: 48 },
  { number: 27, nameEn: 'Daniel',           language: 'AR', chapters: 12 },
  { number: 28, nameEn: 'Hosea',            language: 'AR', chapters: 14 },
  { number: 29, nameEn: 'Joel',             language: 'AR', chapters: 3 },
  { number: 30, nameEn: 'Amos',             language: 'AR', chapters: 9 },
  { number: 31, nameEn: 'Obadiah',          language: 'AR', chapters: 1 },
  { number: 32, nameEn: 'Jonah',            language: 'AR', chapters: 4 },
  { number: 33, nameEn: 'Micah',            language: 'AR', chapters: 7 },
  { number: 34, nameEn: 'Nahum',            language: 'AR', chapters: 3 },
  { number: 35, nameEn: 'Habakkuk',         language: 'AR', chapters: 3 },
  { number: 36, nameEn: 'Zephaniah',        language: 'AR', chapters: 3 },
  { number: 37, nameEn: 'Haggai',           language: 'AR', chapters: 2 },
  { number: 38, nameEn: 'Zechariah',        language: 'AR', chapters: 14 },
  { number: 39, nameEn: 'Malachi',          language: 'AR', chapters: 4 },
  // Greek NT
  { number: 40, nameEn: 'Matthew',          language: 'GR', chapters: 28 },
  { number: 41, nameEn: 'Mark',             language: 'GR', chapters: 16 },
  { number: 42, nameEn: 'Luke',             language: 'GR', chapters: 24 },
  { number: 43, nameEn: 'John',             language: 'GR', chapters: 21 },
  { number: 44, nameEn: 'Acts',             language: 'GR', chapters: 28 },
  { number: 45, nameEn: 'Romans',           language: 'GR', chapters: 16 },
  { number: 46, nameEn: '1 Corinthians',    language: 'GR', chapters: 16 },
  { number: 47, nameEn: '2 Corinthians',    language: 'GR', chapters: 13 },
  { number: 48, nameEn: 'Galatians',        language: 'GR', chapters: 6 },
  { number: 49, nameEn: 'Ephesians',        language: 'GR', chapters: 6 },
  { number: 50, nameEn: 'Philippians',      language: 'GR', chapters: 4 },
  { number: 51, nameEn: 'Colossians',       language: 'GR', chapters: 4 },
  { number: 52, nameEn: '1 Thessalonians',  language: 'GR', chapters: 5 },
  { number: 53, nameEn: '2 Thessalonians',  language: 'GR', chapters: 3 },
  { number: 54, nameEn: '1 Timothy',        language: 'GR', chapters: 6 },
  { number: 55, nameEn: '2 Timothy',        language: 'GR', chapters: 4 },
  { number: 56, nameEn: 'Titus',            language: 'GR', chapters: 3 },
  { number: 57, nameEn: 'Philemon',         language: 'GR', chapters: 1 },
  { number: 58, nameEn: 'Hebrews',          language: 'GR', chapters: 13 },
  { number: 59, nameEn: 'James',            language: 'GR', chapters: 5 },
  { number: 60, nameEn: '1 Peter',          language: 'GR', chapters: 5 },
  { number: 61, nameEn: '2 Peter',          language: 'GR', chapters: 3 },
  { number: 62, nameEn: '1 John',           language: 'GR', chapters: 5 },
  { number: 63, nameEn: '2 John',           language: 'GR', chapters: 1 },
  { number: 64, nameEn: '3 John',           language: 'GR', chapters: 1 },
  { number: 65, nameEn: 'Jude',             language: 'GR', chapters: 1 },
  { number: 66, nameEn: 'Revelation',       language: 'GR', chapters: 22 },
];

const TRANSLATION_MAP: Record<string, string> = {
  HE: 'aleppo',
  AR: 'arabicsv',
  GR: 'textusreceptus',
};

const BASE_URL = 'https://api.getbible.net/v2';
const OUTPUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data');

// ── Helpers ───────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
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

// ── Main download logic ───────────────────────────────────────────────────

async function downloadBook(book: BookDef): Promise<void> {
  const translation = TRANSLATION_MAP[book.language];
  const url = `${BASE_URL}/${translation}/${book.number}.json`;
  const lang = book.language.toLowerCase();

  console.log(`📖 Downloading ${book.nameEn} (${translation})...`);

  let data: GetBibleBook;
  try {
    data = await fetchWithRetry(url);
  } catch (err: any) {
    console.error(`  ❌ Failed to download ${book.nameEn}: ${err.message}`);
    return;
  }

  const chaptersData = data.chapters;
  let chaptersWritten = 0;

  for (const chapter of chaptersData) {
    const chapterNum = chapter.chapter;

    // Convert verses array to our format
    const verses = chapter.verses
      .sort((a: GetBibleVerse, b: GetBibleVerse) => a.verse - b.verse)
      .map((v: GetBibleVerse) => ({
        number: v.verse,
        text: v.text.trim(),
      }));

    const chapterData = {
      bookNumber: book.number,
      bookName: book.nameEn,
      chapter: chapterNum,
      language: book.language,
      verses,
    };

    // Write chapter file
    const dir = path.join(OUTPUT_DIR, lang, String(book.number));
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${chapterNum}.json`);
    fs.writeFileSync(filePath, JSON.stringify(chapterData, null, 2), 'utf-8');
    chaptersWritten++;
  }

  console.log(`  ✅ ${book.nameEn}: ${chaptersWritten} chapters saved`);
}

async function main() {
  const args = process.argv.slice(2);
  let booksToDownload = BOOKS;

  if (args.length === 1) {
    const num = parseInt(args[0], 10);
    booksToDownload = BOOKS.filter(b => b.number === num);
  } else if (args.length === 2) {
    const from = parseInt(args[0], 10);
    const to = parseInt(args[1], 10);
    booksToDownload = BOOKS.filter(b => b.number >= from && b.number <= to);
  }

  if (booksToDownload.length === 0) {
    console.error('No books matched the given range.');
    process.exit(1);
  }

  console.log(`\n🔽 Downloading ${booksToDownload.length} books to ${OUTPUT_DIR}\n`);
  console.log(`   Hebrew (Aleppo Codex):      books 1-17`);
  console.log(`   Arabic (Smith & Van Dyck):   books 18-39`);
  console.log(`   Greek (Textus Receptus):     books 40-66\n`);

  for (const book of booksToDownload) {
    await downloadBook(book);
    // Small delay to be respectful to the API
    await sleep(300);
  }

  // Count total files
  let totalFiles = 0;
  for (const lang of ['he', 'ar', 'gr']) {
    const langDir = path.join(OUTPUT_DIR, lang);
    if (fs.existsSync(langDir)) {
      for (const bookDir of fs.readdirSync(langDir)) {
        const bookPath = path.join(langDir, bookDir);
        if (fs.statSync(bookPath).isDirectory()) {
          totalFiles += fs.readdirSync(bookPath).length;
        }
      }
    }
  }

  console.log(`\n✨ Done! ${totalFiles} chapter files saved to public/data/\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
