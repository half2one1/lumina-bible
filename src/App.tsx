import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Settings,
  Book as BookIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Loader2,
  Languages,
  Bookmark,
} from 'lucide-react';
import {
  BIBLE_BOOKS,
  BookMeta,
  Language,
  BaseLanguage,
  isRTL,
  BASE_LANGUAGE_NAMES,
} from './data/bibleStructure';
import { bibleService, ChapterData, Verse } from './data/bibleService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const LANGUAGE_LABELS: Record<Language, string> = {
  HE: 'Hebrew',
  AR: 'Arabic',
  GR: 'Greek',
};

// ── Reading Progress ────────────────────────────────────────────────────

interface ReadingProgress {
  bookNumber: number;
  chapter: number;
  timestamp: number;
}

function loadProgress(): ReadingProgress | null {
  try {
    const raw = localStorage.getItem('lumina-progress');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProgress(bookNumber: number, chapter: number) {
  localStorage.setItem('lumina-progress', JSON.stringify({
    bookNumber,
    chapter,
    timestamp: Date.now(),
  }));
}

// ── App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Restore reading progress on first load
  const savedProgress = useRef(loadProgress());

  const [currentBookNumber, setCurrentBookNumber] = useState(
    () => savedProgress.current?.bookNumber ?? 1
  );
  const [currentChapter, setCurrentChapter] = useState(
    () => savedProgress.current?.chapter ?? 1
  );

  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [kjvData, setKjvData] = useState<ChapterData | null>(null);
  const [krvData, setKrvData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);

  // Language learning settings — both can be on simultaneously
  const [showEnglish, setShowEnglish] = useState(() => {
    return localStorage.getItem('lumina-show-en') !== 'false';
  });
  const [showKorean, setShowKorean] = useState(() => {
    return localStorage.getItem('lumina-show-kr') !== 'false';
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const currentBook = useMemo(
    () => BIBLE_BOOKS.find(b => b.number === currentBookNumber)!,
    [currentBookNumber]
  );

  const rtl = isRTL(currentBook.language);

  // Persist settings
  useEffect(() => { localStorage.setItem('lumina-show-en', String(showEnglish)); }, [showEnglish]);
  useEffect(() => { localStorage.setItem('lumina-show-kr', String(showKorean)); }, [showKorean]);

  // Save reading progress on navigation
  useEffect(() => {
    saveProgress(currentBookNumber, currentChapter);
  }, [currentBookNumber, currentChapter]);

  // Load chapter data + both translations
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const promises: [Promise<ChapterData>, Promise<ChapterData | null>, Promise<ChapterData | null>] = [
      bibleService.getChapter(currentBook, currentChapter),
      showEnglish
        ? bibleService.getTranslation('kjv', currentBook.number, currentChapter)
        : Promise.resolve(null),
      showKorean
        ? bibleService.getTranslation('krv', currentBook.number, currentChapter)
        : Promise.resolve(null),
    ];

    Promise.all(promises)
      .then(([original, kjv, krv]) => {
        if (!cancelled) {
          setChapterData(original);
          setKjvData(kjv);
          setKrvData(krv);
          setLoading(false);
          scrollRef.current?.scrollTo(0, 0);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [currentBook, currentChapter, showEnglish, showKorean]);

  // Build verse-number → translation maps
  const kjvMap = useMemo(() => {
    if (!kjvData) return new Map<number, string>();
    return new Map(kjvData.verses.map(v => [v.number, v.text]));
  }, [kjvData]);

  const krvMap = useMemo(() => {
    if (!krvData) return new Map<number, string>();
    return new Map(krvData.verses.map(v => [v.number, v.text]));
  }, [krvData]);

  const filteredVerses = useMemo(() => {
    if (!chapterData) return [];
    if (!searchQuery) return chapterData.verses;
    return chapterData.verses.filter(v =>
      v.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chapterData, searchQuery]);

  const handleNextChapter = useCallback(() => {
    if (currentChapter < currentBook.chapters) {
      setCurrentChapter(prev => prev + 1);
    } else {
      const nextBook = BIBLE_BOOKS.find(b => b.number === currentBookNumber + 1);
      if (nextBook) {
        setCurrentBookNumber(nextBook.number);
        setCurrentChapter(1);
      }
    }
  }, [currentChapter, currentBook, currentBookNumber]);

  const handlePrevChapter = useCallback(() => {
    if (currentChapter > 1) {
      setCurrentChapter(prev => prev - 1);
    } else {
      const prevBook = BIBLE_BOOKS.find(b => b.number === currentBookNumber - 1);
      if (prevBook) {
        setCurrentBookNumber(prevBook.number);
        setCurrentChapter(prevBook.chapters);
      }
    }
  }, [currentChapter, currentBookNumber]);

  const selectBook = useCallback((book: BookMeta) => {
    setCurrentBookNumber(book.number);
    setCurrentChapter(1);
    setIsBookPickerOpen(false);
  }, []);

  const isFirstChapter = currentBookNumber === 1 && currentChapter === 1;
  const isLastChapter = currentBookNumber === 66 && currentChapter === currentBook.chapters;

  // Reading progress percentage
  const totalChapters = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
  const chaptersRead = BIBLE_BOOKS
    .filter(b => b.number < currentBookNumber)
    .reduce((sum, b) => sum + b.chapters, 0) + currentChapter;
  const progressPercent = Math.round((chaptersRead / totalChapters) * 100);

  return (
    <div className="flex flex-col h-screen bg-bible-bg text-bible-ink max-w-[420px] mx-auto border-x shadow-2xl relative overflow-hidden">
      {/* Header */}
      <header className="shrink-0 p-4 pb-3 border-b border-bible-border bg-white z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookIcon className="w-5 h-5 text-bible-accent" />
            <h1 className="font-sans text-lg font-bold tracking-tight">Lumina</h1>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
              {LANGUAGE_LABELS[currentBook.language]}
            </Badge>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-bible-muted h-8 w-8">
                  <Settings className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-bible-bg">
                <SheetHeader>
                  <SheetTitle className="font-sans text-xl font-bold">Settings</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {/* Language Learning */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-bible-secondary uppercase tracking-[2px]">
                      Language Learning
                    </label>
                    <p className="text-[10px] text-bible-muted leading-tight">
                      Show translations below the original scriptures. Enable both to learn Korean↔English.
                    </p>

                    <div className="space-y-2">
                      <button
                        onClick={() => setShowEnglish(!showEnglish)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                          showEnglish
                            ? 'border-bible-accent bg-bible-accent/5'
                            : 'border-bible-border bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4" />
                          <span className="text-[12px] font-bold">English (KJV)</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${showEnglish ? 'text-bible-accent' : 'text-bible-muted'}`}>
                          {showEnglish ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      <button
                        onClick={() => setShowKorean(!showKorean)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                          showKorean
                            ? 'border-bible-accent bg-bible-accent/5'
                            : 'border-bible-border bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4" />
                          <span className="text-[12px] font-bold">한국어 (개역한글)</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${showKorean ? 'text-bible-accent' : 'text-bible-muted'}`}>
                          {showKorean ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <Separator className="bg-bible-border" />

                  {/* Reading Progress */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-bible-secondary uppercase tracking-[2px]">
                      Reading Progress
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-bible-ink">
                          {currentBook.nameEn} Ch. {currentChapter}
                        </span>
                        <span className="text-[12px] font-bold text-bible-accent">{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-bible-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-bible-accent rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-bible-muted">
                        {chaptersRead} of {totalChapters} chapters
                      </p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div
          className="bg-bible-surface rounded-[10px] px-3 py-2 flex items-center gap-2 cursor-pointer"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="w-4 h-4 text-bible-muted" />
          <span className="text-sm text-bible-muted">Search Scriptures...</span>
        </div>

        {/* Testament / Language pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {(['OT-HE', 'OT-AR', 'NT-GR'] as const).map(key => {
            const [testament, lang] = key.split('-') as ['OT' | 'NT', Language];
            const isActive = currentBook.testament === testament && currentBook.language === lang;
            const label = testament === 'OT' && lang === 'HE' ? 'Torah & History'
              : testament === 'OT' && lang === 'AR' ? 'Poetry & Prophets'
              : 'New Testament';
            return (
              <button
                key={key}
                onClick={() => {
                  const firstBook = BIBLE_BOOKS.find(b => b.testament === testament && b.language === lang);
                  if (firstBook) selectBook(firstBook);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-[0.5px] transition-colors whitespace-nowrap border border-transparent ${
                  isActive
                    ? 'bg-bible-accent text-white'
                    : 'bg-bible-surface text-bible-muted'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Navigation Bar */}
      <div className="shrink-0 px-5 py-3 bg-white border-b border-bible-border">
        <button
          onClick={() => setIsBookPickerOpen(true)}
          className="flex items-center gap-1 mb-1"
        >
          <span className="text-[12px] font-bold text-bible-secondary uppercase tracking-[2px]">
            {currentBook.nameEn}
          </span>
          <ChevronDown className="w-3 h-3 text-bible-secondary" />
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className={`font-serif text-2xl text-bible-ink ${rtl ? 'font-he' : ''}`}>
              {rtl ? currentBook.nameOriginal : `Chapter ${currentChapter}`}
            </h2>
            {rtl && (
              <span className="text-sm text-bible-muted">Ch. {currentChapter}</span>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevChapter} disabled={isFirstChapter} className="text-bible-muted">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextChapter} disabled={isLastChapter} className="text-bible-muted">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        {/* Progress bar under nav */}
        <div className="mt-2 w-full h-[2px] bg-bible-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-bible-accent/40 rounded-full transition-all duration-300"
            style={{ width: `${(currentChapter / currentBook.chapters) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <Loader2 className="w-6 h-6 animate-spin text-bible-muted" />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3"
            >
              <p className="text-sm text-bible-muted text-center">
                Chapter data not available yet.
              </p>
              <p className="text-xs text-bible-muted text-center">
                Run <code className="bg-bible-surface px-1.5 py-0.5 rounded">npx tsx scripts/download-bible.ts</code> to download.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`${currentBookNumber}-${currentChapter}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-1 pb-4"
            >
              {filteredVerses.map(verse => (
                <VerseItem
                  key={verse.number}
                  verse={verse}
                  language={currentBook.language}
                  englishText={showEnglish ? kjvMap.get(verse.number) : undefined}
                  koreanText={showKorean ? krvMap.get(verse.number) : undefined}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-bible-bg p-4 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-muted" />
                <Input
                  autoFocus
                  placeholder="Search verses..."
                  className="pl-10 bg-white border-none shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {filteredVerses.length === 0 ? (
                  <p className="text-center text-bible-muted py-10">No results found</p>
                ) : (
                  filteredVerses.map(v => (
                    <div key={v.number} className={`p-3 bg-white rounded-lg shadow-sm border border-black/5 ${rtl ? 'text-right' : ''}`}>
                      <span className="text-xs font-bold text-bible-accent mr-2">{v.number}</span>
                      <span className={`text-sm leading-relaxed ${rtl ? (currentBook.language === 'HE' ? 'font-he' : 'font-ar') : ''}`}>
                        {v.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Picker Overlay */}
      <AnimatePresence>
        {isBookPickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-50 bg-bible-bg flex flex-col"
          >
            <div className="shrink-0 flex items-center justify-between p-5 border-b border-bible-border">
              <h2 className="font-sans text-lg font-bold">Select Book</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsBookPickerOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-6">
                <BookSection
                  title="Torah & Historical Books"
                  subtitle="עברית — Hebrew (Aleppo Codex)"
                  books={BIBLE_BOOKS.filter(b => b.language === 'HE')}
                  currentBookNumber={currentBookNumber}
                  onSelect={selectBook}
                />
                <BookSection
                  title="Poetry & Prophets"
                  subtitle="العربية — Arabic (Smith & Van Dyck)"
                  books={BIBLE_BOOKS.filter(b => b.language === 'AR')}
                  currentBookNumber={currentBookNumber}
                  onSelect={selectBook}
                />
                <BookSection
                  title="New Testament"
                  subtitle="Ελληνικά — Greek (Textus Receptus)"
                  books={BIBLE_BOOKS.filter(b => b.language === 'GR')}
                  currentBookNumber={currentBookNumber}
                  onSelect={selectBook}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Picker Bar */}
      <div className="shrink-0 border-t border-bible-border bg-white">
        <div className="px-3 py-2 overflow-x-auto">
          <div className="flex gap-1">
            {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(ch => (
              <button
                key={ch}
                onClick={() => setCurrentChapter(ch)}
                className={`min-w-[36px] h-9 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  currentChapter === ch
                    ? 'bg-bible-accent text-white'
                    : 'bg-bible-surface text-bible-muted hover:bg-bible-border'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Book Section in Picker ──────────────────────────────────────────────

const BookSection: React.FC<{
  title: string;
  subtitle: string;
  books: BookMeta[];
  currentBookNumber: number;
  onSelect: (book: BookMeta) => void;
}> = ({ title, subtitle, books, currentBookNumber, onSelect }) => (
  <div>
    <h3 className="text-[11px] font-extrabold text-bible-secondary uppercase tracking-[2px] mb-1">
      {title}
    </h3>
    <p className="text-[10px] text-bible-muted mb-3">{subtitle}</p>
    <div className="grid grid-cols-2 gap-1.5">
      {books.map(book => (
        <button
          key={book.number}
          onClick={() => onSelect(book)}
          className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
            currentBookNumber === book.number
              ? 'bg-bible-accent text-white'
              : 'bg-bible-surface text-bible-ink hover:bg-bible-border'
          }`}
        >
          <span className="font-medium block truncate">{book.nameEn}</span>
          <span className={`text-[11px] block truncate ${
            currentBookNumber === book.number ? 'text-white/70' : 'text-bible-muted'
          }`}>
            {book.nameOriginal}
          </span>
        </button>
      ))}
    </div>
  </div>
);

// ── Verse Display ───────────────────────────────────────────────────────

const VerseItem: React.FC<{
  verse: Verse;
  language: Language;
  englishText?: string;
  koreanText?: string;
}> = ({ verse, language, englishText, koreanText }) => {
  const rtl = isRTL(language);
  const fontClass = language === 'HE' ? 'font-he' : language === 'AR' ? 'font-ar' : '';

  return (
    <div className={`py-3 border-b border-bible-border/50 ${rtl ? 'text-right' : ''}`}>
      {/* Verse number + original text */}
      <div className={`flex gap-2 ${rtl ? 'flex-row-reverse' : ''}`}>
        <span className="shrink-0 w-6 h-6 rounded-full bg-bible-accent flex items-center justify-center mt-1">
          <span className="text-[9px] font-bold text-white">{verse.number}</span>
        </span>
        <p className={`font-serif text-base leading-[1.9] text-bible-ink flex-1 ${fontClass} ${
          rtl ? 'text-xl leading-[2.2]' : ''
        }`}>
          {verse.text}
        </p>
      </div>

      {/* Translations */}
      {(englishText || koreanText) && (
        <div className={`mt-2 space-y-1.5 ${rtl ? 'pr-8' : 'pl-8'}`}>
          {englishText && (
            <div>
              <span className="text-[9px] font-bold text-bible-secondary uppercase tracking-wider">EN</span>
              <p className="text-[13px] leading-relaxed text-bible-muted">
                {englishText}
              </p>
            </div>
          )}
          {koreanText && (
            <div>
              <span className="text-[9px] font-bold text-bible-secondary uppercase tracking-wider">KR</span>
              <p className="text-[13px] leading-relaxed text-bible-muted font-kr">
                {koreanText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
