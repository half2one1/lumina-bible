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
  Type,
  Moon,
  Eye,
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

// ── Font Size Presets ───────────────────────────────────────────────────

type FontSizePreset = 'small' | 'medium' | 'big' | 'very-big';

const FONT_SIZE_ORDER: FontSizePreset[] = ['small', 'medium', 'big', 'very-big'];

const FONT_SIZE_LABELS: Record<FontSizePreset, string> = {
  'small': 'S',
  'medium': 'M',
  'big': 'L',
  'very-big': 'XL',
};

const ORIGINAL_FONT_SIZES: Record<FontSizePreset, string> = {
  'small': 'text-sm leading-[1.7]',
  'medium': 'text-base leading-[1.9]',
  'big': 'text-xl leading-[2.1]',
  'very-big': 'text-2xl leading-[2.3]',
};

const ORIGINAL_RTL_FONT_SIZES: Record<FontSizePreset, string> = {
  'small': 'text-base leading-[1.9]',
  'medium': 'text-xl leading-[2.2]',
  'big': 'text-2xl leading-[2.4]',
  'very-big': 'text-3xl leading-[2.6]',
};

const TRANSLATION_FONT_SIZES: Record<FontSizePreset, string> = {
  'small': 'text-[11px] leading-snug',
  'medium': 'text-[13px] leading-relaxed',
  'big': 'text-[15px] leading-relaxed',
  'very-big': 'text-[18px] leading-relaxed',
};

function nextFontSize(current: FontSizePreset): FontSizePreset {
  const idx = FONT_SIZE_ORDER.indexOf(current);
  return FONT_SIZE_ORDER[(idx + 1) % FONT_SIZE_ORDER.length];
}

// ── Search Result Types ─────────────────────────────────────────────────

type MatchSource = 'original' | 'en' | 'kr';

interface SearchResult {
  bookNumber: number;
  bookName: string;
  chapter: number;
  verseNumber: number;
  text: string;
  language: Language;
  matchedIn: MatchSource[];
  englishText?: string;
  koreanText?: string;
}

// ── Reading Progress ────────────────────────────────────────────────────

interface ReadingProgress {
  bookNumber: number;
  chapter: number;
  verseNumber?: number;
  timestamp: number;
}

function loadProgress(): ReadingProgress | null {
  try {
    const raw = localStorage.getItem('lumina-progress');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProgress(bookNumber: number, chapter: number, verseNumber?: number) {
  localStorage.setItem('lumina-progress', JSON.stringify({
    bookNumber,
    chapter,
    verseNumber,
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>(() => {
    try {
      const cached = localStorage.getItem('lumina-last-search-results');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [lastSearchQuery, setLastSearchQuery] = useState(() => {
    return localStorage.getItem('lumina-last-search-query') || '';
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [currentVerseNumber, setCurrentVerseNumber] = useState<number | null>(
    () => savedProgress.current?.verseNumber ?? null
  );

  // Font size presets
  const [originalFontSize, setOriginalFontSize] = useState<FontSizePreset>(() => {
    return (localStorage.getItem('lumina-orig-font') as FontSizePreset) || 'medium';
  });
  const [translationFontSize, setTranslationFontSize] = useState<FontSizePreset>(() => {
    return (localStorage.getItem('lumina-trans-font') as FontSizePreset) || 'medium';
  });

  // Language learning settings — both can be on simultaneously
  const [showEnglish, setShowEnglish] = useState(() => {
    return localStorage.getItem('lumina-show-en') !== 'false';
  });
  const [showKorean, setShowKorean] = useState(() => {
    return localStorage.getItem('lumina-show-kr') !== 'false';
  });
  const [showOriginal, setShowOriginal] = useState(() => {
    return localStorage.getItem('lumina-show-orig') !== 'false';
  });
  const [theme, setTheme] = useState<'light' | 'theme-dark' | 'theme-sepia'>(() => {
    return (localStorage.getItem('lumina-theme') as 'light' | 'theme-dark' | 'theme-sepia') || 'light';
  });

  // ── Theme color maps (runtime override via inline CSS vars) ──────────────
  const THEMES = {
    light: {
      '--color-bible-bg':         '#FFFFFF',
      '--color-bible-page':       '#F7F7F5',
      '--color-bible-ink':        '#2C2C2C',
      '--color-bible-accent':     '#2C2C2C',
      '--color-bible-muted':      '#8E8E93',
      '--color-bible-secondary':  '#A0A0A0',
      '--color-bible-border':     '#F0F0F0',
      '--color-bible-card-border':'#E0E0E0',
      '--color-bible-surface':    '#F2F2F2',
    },
    'theme-dark': {
      '--color-bible-bg':         '#1A1A1A',
      '--color-bible-page':       '#121212',
      '--color-bible-ink':        '#E0E0E0',
      '--color-bible-accent':     '#B0B0B0',
      '--color-bible-muted':      '#6A6A6A',
      '--color-bible-secondary':  '#555555',
      '--color-bible-border':     '#2A2A2A',
      '--color-bible-card-border':'#383838',
      '--color-bible-surface':    '#252525',
    },
    'theme-sepia': {
      '--color-bible-bg':         '#F4ECD8',
      '--color-bible-page':       '#E9DFC4',
      '--color-bible-ink':        '#433422',
      '--color-bible-accent':     '#5D4037',
      '--color-bible-muted':      '#8F745C',
      '--color-bible-secondary':  '#A6907C',
      '--color-bible-border':     '#DFD3B6',
      '--color-bible-card-border':'#D1C4A5',
      '--color-bible-surface':    '#EDE2C9',
    },
  } as const;

  const themeStyle = THEMES[theme] as React.CSSProperties;

  // Apply theme class to <html> so CSS variables cascade to all portals/overlays
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-sepia');
    if (theme === 'theme-dark') root.classList.add('theme-dark');
    else if (theme === 'theme-sepia') root.classList.add('theme-sepia');
  }, [theme]);

  // Also apply data-theme to document root for CSS variable overrides
  useEffect(() => {
    const themeValue = theme === 'theme-dark' ? 'dark' : theme === 'theme-sepia' ? 'sepia' : 'light';
    document.documentElement.dataset.theme = themeValue;
  }, [theme]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const currentBook = useMemo(
    () => BIBLE_BOOKS.find(b => b.number === currentBookNumber)!,
    [currentBookNumber]
  );

  const rtl = isRTL(currentBook.language);

  // Persist settings
  useEffect(() => { localStorage.setItem('lumina-show-en', String(showEnglish)); }, [showEnglish]);
  useEffect(() => { localStorage.setItem('lumina-show-kr', String(showKorean)); }, [showKorean]);
  useEffect(() => { localStorage.setItem('lumina-show-orig', String(showOriginal)); }, [showOriginal]);
  useEffect(() => { localStorage.setItem('lumina-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('lumina-orig-font', originalFontSize); }, [originalFontSize]);
  useEffect(() => { localStorage.setItem('lumina-trans-font', translationFontSize); }, [translationFontSize]);

  // Save reading progress (debounced for verse tracking)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update if we have meaningful data
      if (currentVerseNumber !== null) {
        saveProgress(currentBookNumber, currentChapter, currentVerseNumber);
      } else {
        // preserve existing verse if we don't have a new one yet
        const existingRec = loadProgress();
        if (existingRec?.bookNumber === currentBookNumber && existingRec?.chapter === currentChapter && existingRec?.verseNumber) {
          // do nothing, let it stay
        } else {
          saveProgress(currentBookNumber, currentChapter);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [currentBookNumber, currentChapter, currentVerseNumber]);

  // Persistent Search Cache
  useEffect(() => {
    if (searchDone && searchQuery) {
      localStorage.setItem('lumina-last-search-query', searchQuery);
      localStorage.setItem('lumina-last-search-results', JSON.stringify(searchResults));
      setLastSearchQuery(searchQuery);
    }
  }, [searchDone, searchQuery, searchResults]);

  // Load chapter data + both translations
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const isKoreanOn = showKorean || (!showOriginal && !showEnglish && !showKorean);

    const promises: [Promise<ChapterData>, Promise<ChapterData | null>, Promise<ChapterData | null>] = [
      bibleService.getChapter(currentBook, currentChapter),
      showEnglish
        ? bibleService.getTranslation('kjv', currentBook.number, currentChapter)
        : Promise.resolve(null),
      isKoreanOn
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
  }, [currentBook, currentChapter, showEnglish, showKorean, showOriginal]);

  // Scroll to saved progress verse on initial load
  const hasAutoScrolled = useRef(false);
  useEffect(() => {
    if (chapterData && !loading && savedProgress.current?.verseNumber && !hasAutoScrolled.current) {
      if (savedProgress.current.bookNumber === currentBookNumber && savedProgress.current.chapter === currentChapter) {
        const verseNum = savedProgress.current.verseNumber;
        const timer = setTimeout(() => {
          const el = document.getElementById(`verse-${verseNum}`);
          if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
            hasAutoScrolled.current = true;
          }
        }, 1000); // 1s is safer for full rendering + animations
        return () => clearTimeout(timer);
      }
    }
  }, [chapterData, loading, currentBookNumber, currentChapter]);

  // Intersection Observer for tracking currently seen verse
  useEffect(() => {
    if (loading || !chapterData) return;

    // Small delay to ensure motion animations have started/settled
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter(e => e.isIntersecting);
          if (visible.length > 0) {
            // Pick the one closest to the top-middle
            const active = visible[0];
            const verseMatch = active.target.id.match(/verse-(\d+)/);
            if (verseMatch) {
              setCurrentVerseNumber(parseInt(verseMatch[1], 10));
            }
          }
        },
        {
          root: null, // viewport is more reliable for nested scrolls in many browsers
          rootMargin: '-40% 0% -40% 0%', // focus on the middle 20%
          threshold: 0
        }
      );

      const elements = document.querySelectorAll('[id^="verse-"]');
      elements.forEach(el => observer.observe(el));

      return () => observer.disconnect();
    }, 500);

    return () => clearTimeout(timer);
  }, [loading, chapterData]);

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
    return chapterData.verses;
  }, [chapterData]);

  // Language visibility with fallback (Show Korean if all are off)
  const isOriginalOn = showOriginal;
  const isEnglishOn = showEnglish;
  const isKoreanOn = showKorean || (!showOriginal && !showEnglish && !showKorean);

  // Global search across all books — streams results progressively
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-progress search
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }

    if (!searchQuery) {
      // Don't clear searchResults here! Keep them for the "Previous Search" cache.
      setIsSearching(false);
      setSearchDone(false);
      return;
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchDone(false);
      return;
    }

    setIsSearching(true);
    setSearchDone(false);
    setSearchResults([]);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      const abortCtrl = new AbortController();
      searchAbortRef.current = abortCtrl;
      const query = searchQuery.toLowerCase();
      let batch: SearchResult[] = [];

      for (const book of BIBLE_BOOKS) {
        if (abortCtrl.signal.aborted) return;

        for (let ch = 1; ch <= book.chapters; ch++) {
          if (abortCtrl.signal.aborted) return;

          try {
            const [originalData, kjvChapter, krvChapter] = await Promise.all([
              bibleService.getChapter(book, ch).catch(() => null),
              bibleService.getTranslation('kjv', book.number, ch).catch(() => null),
              bibleService.getTranslation('krv', book.number, ch).catch(() => null),
            ]);

            if (!originalData || abortCtrl.signal.aborted) continue;

            const kjvVerseMap = new Map<number, string>();
            const krvVerseMap = new Map<number, string>();
            if (kjvChapter) kjvChapter.verses.forEach(v => kjvVerseMap.set(v.number, v.text));
            if (krvChapter) krvChapter.verses.forEach(v => krvVerseMap.set(v.number, v.text));

            for (const verse of originalData.verses) {
              const enText = kjvVerseMap.get(verse.number);
              const krText = krvVerseMap.get(verse.number);

              const matchedIn: MatchSource[] = [];
              if (verse.text.toLowerCase().includes(query)) matchedIn.push('original');
              if (enText && enText.toLowerCase().includes(query)) matchedIn.push('en');
              if (krText && krText.toLowerCase().includes(query)) matchedIn.push('kr');

              if (matchedIn.length > 0) {
                batch.push({
                  bookNumber: book.number,
                  bookName: book.nameEn,
                  chapter: ch,
                  verseNumber: verse.number,
                  text: verse.text,
                  language: book.language,
                  matchedIn,
                  englishText: enText,
                  koreanText: krText,
                });
              }
            }

            // Flush batch every chapter to stream results to UI
            if (batch.length > 0 && !abortCtrl.signal.aborted) {
              const toFlush = batch;
              batch = [];
              setSearchResults(prev => [...prev, ...toFlush]);
              setIsSearching(true); // still searching
            }
          } catch {
            // Chapter not available, skip
          }
        }
      }

      if (!abortCtrl.signal.aborted) {
        if (batch.length > 0) {
          setSearchResults(prev => [...prev, ...batch]);
        }
        setIsSearching(false);
        setSearchDone(true);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
  }, [searchQuery]);

  const handleSearchResultClick = useCallback((result: SearchResult) => {
    setCurrentBookNumber(result.bookNumber);
    setCurrentChapter(result.chapter);
    setHighlightedVerse(result.verseNumber);
    setIsSearchOpen(false);
    setSearchQuery('');
    // No longer clearing searchResults, so they persist in the "Previous Search" cache
    setSearchDone(false);
  }, []);

  // Scroll to highlighted verse after chapter loads
  useEffect(() => {
    if (highlightedVerse !== null && !loading && chapterData) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`verse-${highlightedVerse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350); // wait for animation

      // Clear highlight after 3 seconds
      const clearTimer = setTimeout(() => {
        setHighlightedVerse(null);
      }, 3500);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightedVerse, loading, chapterData]);

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
    <div
      className="flex flex-col h-screen max-w-[420px] mx-auto border-x shadow-2xl relative overflow-hidden"
      style={{
        ...themeStyle,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      data-theme={theme}
    >
      <style>{`
        [data-theme="theme-dark"] { background-color: #1A1A1A; color: #E0E0E0; }
        [data-theme="theme-sepia"] { background-color: #F4ECD8; color: #433422; }
      `}</style>
      {/* Header */}
      <header className="shrink-0 p-4 pb-3 border-b border-bible-border bg-bible-bg z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookIcon className="w-5 h-5 text-bible-accent" />
            <h1 className="font-sans text-lg font-bold tracking-tight">Lumina</h1>
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant={showOriginal ? "default" : "outline"} 
              className={`text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 ${
                showOriginal 
                  ? 'bg-bible-accent text-white border-transparent hover:bg-bible-accent/90' 
                  : 'text-bible-muted border-bible-border hover:bg-bible-surface bg-transparent'
              }`}
              onClick={() => setShowOriginal(!showOriginal)}
              title={showOriginal ? "Hide Original Script" : "Show Original Script"}
            >
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
                            ? 'border-bible-accent bg-bible-accent/10'
                            : 'border-bible-border bg-bible-surface'
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
                            ? 'border-bible-accent bg-bible-accent/10'
                            : 'border-bible-border bg-bible-surface'
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

                  {/* Theme & Display */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-extrabold text-bible-secondary uppercase tracking-[2px]">
                      Theme & Display
                    </label>
                    <div className="space-y-2">
                       {/* Dark Mode */}
                       <button
                        onClick={() => setTheme(prev => prev === 'theme-dark' ? 'light' : 'theme-dark')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                          theme === 'theme-dark'
                            ? 'border-bible-accent bg-bible-accent/20 text-bible-ink'
                            : 'border-bible-border bg-bible-surface text-bible-ink'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          <span className="text-[12px] font-bold">Dark Mode</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${theme === 'theme-dark' ? 'text-bible-accent' : 'text-bible-muted'}`}>
                          {theme === 'theme-dark' ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      {/* Eye-Health Mode */}
                      <button
                        onClick={() => setTheme(prev => prev === 'theme-sepia' ? 'light' : 'theme-sepia')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                          theme === 'theme-sepia'
                            ? 'border-bible-accent bg-bible-accent/20 text-bible-ink'
                            : 'border-bible-border bg-bible-surface text-bible-ink'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span className="text-[12px] font-bold">Eye-Health (Sepia)</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${theme === 'theme-sepia' ? 'text-bible-accent' : 'text-bible-muted'}`}>
                          {theme === 'theme-sepia' ? 'ON' : 'OFF'}
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
      <div className="shrink-0 px-5 py-3 bg-bible-bg border-b border-bible-border">
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
                  showOriginal={isOriginalOn}
                  englishText={isEnglishOn ? kjvMap.get(verse.number) : undefined}
                  koreanText={isKoreanOn ? krvMap.get(verse.number) : undefined}
                  originalFontSize={originalFontSize}
                  translationFontSize={translationFontSize}
                  onOriginalFontCycle={() => setOriginalFontSize(prev => nextFontSize(prev))}
                  onTranslationFontCycle={() => setTranslationFontSize(prev => nextFontSize(prev))}
                  isHighlighted={highlightedVerse === verse.number}
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
            className="absolute inset-0 z-50 bg-bible-bg p-4 pt-[env(safe-area-inset-top)] flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-muted" />
                <Input
                  autoFocus
                  placeholder="Search across all scriptures..."
                  className="pl-10 bg-bible-surface border-none shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {searchQuery.length >= 2 && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[10px] font-bold text-bible-secondary uppercase tracking-wider">
                  {isSearching
                    ? `Searching... (${searchResults.length} found so far)`
                    : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`}
                </span>
                {isSearching && (
                  <Loader2 className="w-3 h-3 animate-spin text-bible-muted" />
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {searchQuery.length < 2 && searchResults.length === 0 ? (
                  <p className="text-center text-bible-muted py-10 text-sm">Type at least 2 characters to search</p>
                ) : (searchQuery.length < 2 && searchResults.length > 0) ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-bible-secondary uppercase tracking-wider">Previous Search: "{lastSearchQuery}"</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[9px] text-bible-muted hover:text-bible-accent"
                        onClick={() => {
                          setSearchResults([]);
                          setLastSearchQuery('');
                          localStorage.removeItem('lumina-last-search-query');
                          localStorage.removeItem('lumina-last-search-results');
                        }}
                      >
                        Clear Cache
                      </Button>
                    </div>
                    {searchResults.map((result, idx) => (
                      <SearchResultCard 
                        key={`${idx}`} 
                        result={result} 
                        onClick={() => handleSearchResultClick(result)} 
                      />
                    ))}
                  </div>
                ) : searchResults.length === 0 && isSearching ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-bible-muted" />
                  </div>
                ) : searchResults.length === 0 && searchDone ? (
                  <p className="text-center text-bible-muted py-10 text-sm">No results found</p>
                ) : (
                  <>
                    {searchResults.map((result, idx) => (
                      <SearchResultCard 
                        key={`${result.bookNumber}-${result.chapter}-${result.verseNumber}-${idx}`} 
                        result={result} 
                        onClick={() => handleSearchResultClick(result)} 
                      />
                    ))}
                    {isSearching && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-bible-muted mr-2" />
                        <span className="text-[11px] text-bible-muted">Loading more results...</span>
                      </div>
                    )}
                  </>
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
      <div className="shrink-0 border-t border-bible-border bg-bible-bg">
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

// ── Search UI Components ───────────────────────────────────────────────

const SearchResultCard: React.FC<{
  result: SearchResult;
  onClick: () => void;
}> = ({ result, onClick }) => {
  const resultRtl = isRTL(result.language);
  const fontClass = result.language === 'HE' ? 'font-he' : result.language === 'AR' ? 'font-ar' : '';
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-bible-bg rounded-lg shadow-sm border border-bible-card-border hover:border-bible-accent/30 hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 shrink-0">
          {result.language}
        </Badge>
        <span className="text-[11px] font-bold text-bible-accent truncate">
          {result.bookName}
        </span>
        <span className="text-[10px] text-bible-muted shrink-0">
          {result.chapter}:{result.verseNumber}
        </span>
        <span className="flex gap-1 ml-auto shrink-0">
          {result.matchedIn.map(src => (
            <span
              key={src}
              className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                src === 'original' ? 'bg-bible-accent/10 text-bible-accent'
                : src === 'en' ? 'bg-blue-50 text-blue-600'
                : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {src === 'original' ? 'Original' : src === 'en' ? 'EN' : 'KR'}
            </span>
          ))}
        </span>
      </div>
      {result.matchedIn.includes('original') && (
        <p className={`text-sm leading-relaxed text-bible-ink line-clamp-2 ${resultRtl ? 'text-right' : ''} ${fontClass}`}>
          {result.text}
        </p>
      )}
      {result.matchedIn.includes('en') && result.englishText && (
        <p className="text-[12px] leading-relaxed text-blue-700/80 line-clamp-2 mt-0.5">
          <span className="text-[9px] font-bold text-blue-400 uppercase mr-1">EN</span>
          {result.englishText}
        </p>
      )}
      {result.matchedIn.includes('kr') && result.koreanText && (
        <p className="text-[12px] leading-relaxed text-emerald-700/80 font-kr line-clamp-2 mt-0.5">
          <span className="text-[9px] font-bold text-emerald-400 uppercase mr-1">KR</span>
          {result.koreanText}
        </p>
      )}
    </button>
  );
};

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

/** Only fire callback on a clean click (no text selected) */
function handleClickIfNoSelection(callback: () => void) {
  return () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    callback();
  };
}

const VerseItem: React.FC<{
  verse: Verse;
  language: Language;
  showOriginal: boolean;
  englishText?: string;
  koreanText?: string;
  originalFontSize: FontSizePreset;
  translationFontSize: FontSizePreset;
  onOriginalFontCycle: () => void;
  onTranslationFontCycle: () => void;
  isHighlighted?: boolean;
}> = ({ verse, language, showOriginal, englishText, koreanText, originalFontSize, translationFontSize, onOriginalFontCycle, onTranslationFontCycle, isHighlighted }) => {
  const rtl = isRTL(language);
  const fontClass = language === 'HE' ? 'font-he' : language === 'AR' ? 'font-ar' : '';
  const origSizeClass = rtl ? ORIGINAL_RTL_FONT_SIZES[originalFontSize] : ORIGINAL_FONT_SIZES[originalFontSize];
  const transSizeClass = TRANSLATION_FONT_SIZES[translationFontSize];

  return (
    <div
      id={`verse-${verse.number}`}
      className={`py-3 border-b border-bible-border/50 rounded-lg transition-all duration-700 ${rtl ? 'text-right' : ''} ${
        isHighlighted ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-300/50 shadow-md px-2 -mx-2' : ''
      }`}
    >
      {/* Verse number + original text */}
      <div className={`flex gap-2 ${rtl ? 'flex-row-reverse' : ''}`}>
        <span className="shrink-0 w-6 h-6 rounded-full bg-bible-accent flex items-center justify-center mt-1">
          <span className="text-[9px] font-bold text-white">{verse.number}</span>
        </span>
        {showOriginal && (
          <p
            className={`font-serif text-bible-ink flex-1 cursor-pointer hover:bg-bible-surface/50 rounded-md transition-colors px-1 -mx-1 ${fontClass} ${origSizeClass}`}
            onClick={handleClickIfNoSelection(onOriginalFontCycle)}
            title={`Font size: ${FONT_SIZE_LABELS[originalFontSize]} — tap to change`}
          >
            {verse.text}
          </p>
        )}
      </div>

      {/* Translations */}
      {(englishText || koreanText) && (
        <div className={`mt-2 space-y-1.5 ${rtl ? 'pr-8' : 'pl-8'}`}>
          {englishText && (
            <div
              className="cursor-pointer hover:bg-bible-surface/50 rounded-md transition-colors px-1 -mx-1"
              onClick={handleClickIfNoSelection(onTranslationFontCycle)}
              title={`Font size: ${FONT_SIZE_LABELS[translationFontSize]} — tap to change`}
            >
              <span className="text-[9px] font-bold text-bible-secondary uppercase tracking-wider">EN</span>
              <p className={`text-bible-muted ${transSizeClass}`}>
                {englishText}
              </p>
            </div>
          )}
          {koreanText && (
            <div
              className="cursor-pointer hover:bg-bible-surface/50 rounded-md transition-colors px-1 -mx-1"
              onClick={handleClickIfNoSelection(onTranslationFontCycle)}
              title={`Font size: ${FONT_SIZE_LABELS[translationFontSize]} — tap to change`}
            >
              <span className="text-[9px] font-bold text-bible-secondary uppercase tracking-wider">KR</span>
              <p className={`text-bible-muted font-kr ${transSizeClass}`}>
                {koreanText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
