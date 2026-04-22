import { BookMeta, BIBLE_BOOKS, BaseLanguage } from './bibleStructure';

export interface WordSpan {
  text: string;
  strongs?: string;
  transliteration?: string;
}

export interface Verse {
  number: number;
  text: string;
  words?: WordSpan[];
}

export interface ChapterData {
  bookNumber: number;
  bookName: string;
  chapter: number;
  language: string;
  verses: Verse[];
}

class BibleService {
  private cache = new Map<string, ChapterData>();

  private cacheKey(prefix: string, bookNumber: number, chapter: number): string {
    return `${prefix}/${bookNumber}/${chapter}`;
  }

  async getChapter(book: BookMeta, chapter: number): Promise<ChapterData> {
    const lang = book.language.toLowerCase();
    const key = this.cacheKey(lang, book.number, chapter);

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const url = `/data/${lang}/${book.number}/${chapter}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Chapter not found: ${book.nameEn} ${chapter}`);
    }

    const data: ChapterData = await response.json();
    this.cache.set(key, data);
    return data;
  }

  async getTranslation(
    baseLang: BaseLanguage,
    bookNumber: number,
    chapter: number,
  ): Promise<ChapterData | null> {
    const key = this.cacheKey(baseLang, bookNumber, chapter);

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const url = `/data/${baseLang}/${bookNumber}/${chapter}.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const data: ChapterData = await response.json();
      this.cache.set(key, data);
      return data;
    } catch {
      return null;
    }
  }

  getBook(bookNumber: number): BookMeta | undefined {
    return BIBLE_BOOKS.find(b => b.number === bookNumber);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const bibleService = new BibleService();
