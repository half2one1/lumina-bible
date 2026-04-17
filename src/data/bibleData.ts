// Re-exports for backward compatibility.
// The app now uses bibleStructure.ts and bibleService.ts.
// See scripts/download-bible.ts and scripts/download-translations.ts to populate data.

export { type Language, type BaseLanguage } from './bibleStructure';
export { type Verse, type ChapterData } from './bibleService';
