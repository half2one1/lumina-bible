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
import { bibleService, ChapterData, Verse, WordSpan } from './data/bibleService';
import { dictionaryService, DictionaryEntry } from './data/dictionaryService';
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
  const [selectedWord, setSelectedWord] = useState<{ strongs: string; text: string; entry: DictionaryEntry | null } | null>(null);
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

  // ── Theme color maps ──────────────
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

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-sepia');
    if (theme === 'theme-dark') root.classList.add('theme-dark');
    else if (theme === 'theme-sepia') root.classList.add('theme-sepia');
    document.documentElement.dataset.theme = theme === 'theme-dark' ? 'dark' : theme === 'theme-sepia' ? 'sepia' : 'light';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentVerseNumber !== null) saveProgress(currentBookNumber, currentChapter, currentVerseNumber);
      else saveProgress(currentBookNumber, currentChapter);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentBookNumber, currentChapter, currentVerseNumber]);

  useEffect(() => {
    if (searchDone && searchQuery) {
      localStorage.setItem('lumina-last-search-query', searchQuery);
      localStorage.setItem('lumina-last-search-results', JSON.stringify(searchResults));
      setLastSearchQuery(searchQuery);
    }
  }, [searchDone, searchQuery, searchResults]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    if (currentBook.language === 'HE') dictionaryService.prefetch('hebrew');
    else if (currentBook.language === 'GR') dictionaryService.prefetch('greek');
    
    const isKoreanOn = showKorean || (!showOriginal && !showEnglish && !showKorean);
    const promises: [Promise<ChapterData>, Promise<ChapterData | null>, Promise<ChapterData | null>] = [
      bibleService.getChapter(currentBook, currentChapter),
      showEnglish ? bibleService.getTranslation('kjv', currentBook.number, currentChapter) : Promise.resolve(null),
      isKoreanOn ? bibleService.getTranslation('krv', currentBook.number, currentChapter) : Promise.resolve(null),
    ];
    Promise.all(promises).then(([original, kjv, krv]) => {
      if (!cancelled) {
        setChapterData(original);
        setKjvData(kjv);
        setKrvData(krv);
        setLoading(false);
        scrollRef.current?.scrollTo(0, 0);
      }
    }).catch(err => {
      if (!cancelled) { setError(err.message); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [currentBook, currentChapter, showEnglish, showKorean, showOriginal]);

  const kjvMap = useMemo(() => {
    if (!kjvData) return new Map<number, string>();
    return new Map(kjvData.verses.map(v => [v.number, v.text]));
  }, [kjvData]);

  const krvMap = useMemo(() => {
    if (!krvData) return new Map<number, string>();
    return new Map(krvData.verses.map(v => [v.number, v.text]));
  }, [krvData]);

  const isOriginalOn = showOriginal;
  const isEnglishOn = showEnglish;
  const isKoreanOn = showKorean || (!showOriginal && !showEnglish && !showKorean);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchAbortRef.current) searchAbortRef.current.abort();
    if (!searchQuery || searchQuery.length < 2) {
      if (searchQuery.length < 2) setSearchResults([]);
      setIsSearching(false);
      setSearchDone(false);
      return;
    }
    setIsSearching(true);
    setSearchDone(false);
    setSearchResults([]);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
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
            const kjvVM = new Map(); const krvVM = new Map();
            if (kjvChapter) kjvChapter.verses.forEach(v => kjvVM.set(v.number, v.text));
            if (krvChapter) krvChapter.verses.forEach(v => krvVM.set(v.number, v.text));
            for (const verse of originalData.verses) {
              const enText = kjvVM.get(verse.number); const krText = krvVM.get(verse.number);
              const matchedIn: MatchSource[] = [];
              if (verse.text.toLowerCase().includes(query)) matchedIn.push('original');
              if (enText && enText.toLowerCase().includes(query)) matchedIn.push('en');
              if (krText && krText.toLowerCase().includes(query)) matchedIn.push('kr');
              if (matchedIn.length > 0) {
                batch.push({
                  bookNumber: book.number, bookName: book.nameEn, chapter: ch, verseNumber: verse.number,
                  text: verse.text, language: book.language, matchedIn, englishText: enText, koreanText: krText,
                });
              }
            }
            if (batch.length > 0 && !abortCtrl.signal.aborted) {
              const toFlush = batch; batch = [];
              setSearchResults(prev => [...prev, ...toFlush]);
            }
          } catch {}
        }
      }
      if (!abortCtrl.signal.aborted) {
        if (batch.length > 0) setSearchResults(prev => [...prev, ...batch]);
        setIsSearching(false); setSearchDone(true);
      }
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (searchAbortRef.current) searchAbortRef.current.abort();
    };
  }, [searchQuery]);

  const handleSearchResultClick = useCallback((result: SearchResult) => {
    setCurrentBookNumber(result.bookNumber);
    setCurrentChapter(result.chapter);
    setHighlightedVerse(result.verseNumber);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchDone(false);
  }, []);

  // Android hardware back button: close overlays before navigating back
  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      if (isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(false);
        window.history.pushState(null, '', window.location.href);
      } else if (isBookPickerOpen) {
        e.preventDefault();
        setIsBookPickerOpen(false);
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Push an initial state so popstate fires instead of closing the app
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [isSearchOpen, isBookPickerOpen]);

  useEffect(() => {
    if (highlightedVerse !== null && !loading && chapterData) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${highlightedVerse}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
      setTimeout(() => setHighlightedVerse(null), 3500);
    }
  }, [highlightedVerse, loading, chapterData]);

  const handleNextChapter = useCallback(() => {
    if (currentChapter < currentBook.chapters) setCurrentChapter(prev => prev + 1);
    else {
      const nextBook = BIBLE_BOOKS.find(b => b.number === currentBookNumber + 1);
      if (nextBook) { setCurrentBookNumber(nextBook.number); setCurrentChapter(1); }
    }
  }, [currentChapter, currentBook, currentBookNumber]);

  const handlePrevChapter = useCallback(() => {
    if (currentChapter > 1) setCurrentChapter(prev => prev - 1);
    else {
      const prevBook = BIBLE_BOOKS.find(b => b.number === currentBookNumber - 1);
      if (prevBook) { setCurrentBookNumber(prevBook.number); setCurrentChapter(prevBook.chapters); }
    }
  }, [currentChapter, currentBookNumber]);

  const selectBook = useCallback((book: BookMeta) => {
    setCurrentBookNumber(book.number);
    setCurrentChapter(1);
    setIsBookPickerOpen(false);
  }, []);

  const totalChapters = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
  const chaptersRead = BIBLE_BOOKS.filter(b => b.number < currentBookNumber).reduce((sum, b) => sum + b.chapters, 0) + currentChapter;
  const progressPercent = Math.round((chaptersRead / totalChapters) * 100);

  const isFirstChapter = currentBookNumber === 1 && currentChapter === 1;
  const isLastChapter = currentBookNumber === 66 && currentChapter === currentBook.chapters;

  return (
    <div className="flex h-screen w-full bg-bible-bg overflow-hidden" data-theme={theme} style={themeStyle}>
      <style>{`
        [data-theme="theme-dark"] { background-color: #1A1A1A; color: #E0E0E0; }
        [data-theme="theme-sepia"] { background-color: #F4ECD8; color: #433422; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-bible-border); border-radius: 10px; }
      `}</style>

      {/* ── Sidebar (Desktop/iPad) ── */}
      <aside className="hidden md:flex flex-col w-80 shrink-0 border-r border-bible-border bg-bible-bg z-20">
        <div className="p-4 border-b border-bible-border flex items-center gap-2 px-6">
          <BookIcon className="w-5 h-5 text-bible-accent" />
          <h1 className="font-sans text-lg font-bold tracking-tight text-bible-ink">Lumina</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <CompactBookPicker currentBookNumber={currentBookNumber} onSelect={selectBook} />
        </div>
        <div className="p-5 border-t border-bible-border bg-bible-surface/30">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-extrabold text-bible-secondary uppercase tracking-widest">Chapters</span>
            <span className="text-[10px] font-bold text-bible-muted">{currentBook.nameKr}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 h-32 overflow-y-auto pr-1 custom-scrollbar">
            {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(ch => (
              <button key={ch} onClick={() => setCurrentChapter(ch)} className={`h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentChapter === ch ? 'bg-bible-accent text-white shadow-sm' : 'bg-bible-bg text-bible-muted hover:bg-bible-border'}`}>{ch}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex flex-col h-full max-w-[480px] md:max-w-none mx-auto w-full border-x border-bible-border shadow-2xl md:shadow-none bg-bible-bg relative overflow-hidden">
          <header className="shrink-0 p-4 pb-3 border-b border-bible-border bg-bible-bg z-10 space-y-3" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="md:hidden flex items-center gap-2">
                  <BookIcon className="w-5 h-5 text-bible-accent" />
                  <h1 className="font-sans text-lg font-bold tracking-tight text-bible-ink">Lumina</h1>
                </div>
                <div className="hidden md:flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
                   <h2 className="font-sans text-lg font-bold text-bible-ink">{currentBook.nameKr} <span className="text-bible-accent ml-1">{currentChapter}</span></h2>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={isOriginalOn ? "default" : "outline"} className={`text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 ${isOriginalOn ? 'bg-bible-accent text-white border-transparent' : 'text-bible-muted border-bible-border'}`} onClick={() => setShowOriginal(!showOriginal)}>{LANGUAGE_LABELS[currentBook.language]}</Badge>
                <Sheet>
                  <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-bible-muted h-8 w-8"><Settings className="w-4 h-4" /></Button></SheetTrigger>
                  <SheetContent side="right" className="w-[320px] bg-bible-bg px-6 border-l border-bible-border">
                    <SheetHeader className="px-0 text-left pb-4 border-b border-bible-border"><SheetTitle className="font-sans text-xl font-bold">Settings</SheetTitle></SheetHeader>
                    <div className="py-6 space-y-8 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar">
                      <div className="space-y-4">
                        <label className="text-[10px] font-extrabold text-bible-secondary uppercase tracking-[2px]">Parallel Translation</label>
                        <div className="space-y-2">
                          <button onClick={() => setShowEnglish(!showEnglish)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isEnglishOn ? 'border-bible-accent bg-bible-accent/10 shadow-sm' : 'border-bible-border bg-bible-surface'}`}>
                            <div className="flex items-center gap-3"><Languages className="w-4 h-4 text-bible-accent" /><span className="text-sm font-bold">English (KJV)</span></div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isEnglishOn ? 'bg-bible-accent text-white' : 'bg-bible-border text-bible-muted'}`}>{isEnglishOn ? 'ON' : 'OFF'}</span>
                          </button>
                          <button onClick={() => setShowKorean(!showKorean)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isKoreanOn ? 'border-bible-accent bg-bible-accent/10 shadow-sm' : 'border-bible-border bg-bible-surface'}`}>
                            <div className="flex items-center gap-3"><Languages className="w-4 h-4 text-bible-accent" /><span className="text-sm font-bold">Korean (KRV)</span></div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isKoreanOn ? 'bg-bible-accent text-white' : 'bg-bible-border text-bible-muted'}`}>{isKoreanOn ? 'ON' : 'OFF'}</span>
                          </button>
                        </div>
                      </div>
                      <Separator className="bg-bible-border/50" />
                      <div className="space-y-4">
                        <label className="text-[10px] font-extrabold text-bible-secondary uppercase tracking-[2px]">Reading Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setTheme('light')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'light' ? 'border-bible-accent bg-bible-accent/10 ring-1 ring-bible-accent shadow-sm' : 'border-bible-border bg-white hover:bg-bible-surface'}`}><div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center"><Type className="w-4 h-4 text-slate-800" /></div><span className="text-[9px] font-bold uppercase tracking-wider">Light</span></button>
                          <button onClick={() => setTheme('theme-dark')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'theme-dark' ? 'border-bible-accent bg-bible-accent/10 ring-1 ring-bible-accent shadow-sm' : 'border-bible-border bg-[#1A1A1A] hover:bg-bible-border'}`}><div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 shadow-inner flex items-center justify-center"><Moon className="w-4 h-4 text-slate-100" /></div><span className="text-[9px] font-bold uppercase tracking-wider">Dark</span></button>
                          <button onClick={() => setTheme('theme-sepia')} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${theme === 'theme-sepia' ? 'border-bible-accent bg-bible-accent/10 ring-1 ring-bible-accent shadow-sm' : 'border-bible-border bg-[#F4ECD8] hover:bg-[#E9DFC4]'}`}><div className="w-8 h-8 rounded-full bg-[#E9DFC4] border border-[#D1C4A5] shadow-inner flex items-center justify-center"><Eye className="w-4 h-4 text-sepia-900" /></div><span className="text-[9px] font-bold uppercase tracking-wider">Sepia</span></button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <div><Button variant="ghost" size="icon" className="text-bible-muted h-8 w-8" onClick={() => setIsSearchOpen(true)}><Search className="w-4 h-4" /></Button></div>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:mt-1">
              <div className="flex items-center gap-2 bg-bible-surface hover:bg-bible-border/70 border border-bible-border/50 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer md:hidden" onClick={() => setIsBookPickerOpen(true)}>
                <div className="flex flex-col"><span className="text-[9px] font-extrabold text-bible-secondary uppercase tracking-widest leading-none mb-1">Current Book</span><div className="flex items-center gap-2"><span className="font-sans text-sm font-bold text-bible-ink truncate max-w-[120px]">{currentBook.nameKr}</span><ChevronDown className="w-3 h-3 text-bible-muted" /></div></div>
                <div className="text-right"><span className="text-[9px] font-extrabold text-bible-secondary uppercase tracking-widest leading-none mb-1">Chapter</span><span className="block font-sans text-sm font-bold text-bible-accent">{currentChapter}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-2 flex-1"><Button variant="outline" size="icon" className="h-10 w-10 md:h-9 md:w-9 rounded-xl border-bible-border bg-bible-bg shadow-sm" onClick={handlePrevChapter} disabled={isFirstChapter}><ChevronLeft className="w-5 h-5 md:w-4 md:h-4 text-bible-ink" /></Button><Button variant="outline" size="icon" className="h-10 w-10 md:h-9 md:w-9 rounded-xl border-bible-border bg-bible-bg shadow-sm" onClick={handleNextChapter} disabled={isLastChapter}><ChevronRight className="w-5 h-5 md:w-4 md:h-4 text-bible-ink" /></Button></div>
                <div className="text-[10px] font-bold text-bible-muted bg-bible-surface px-3 py-1.5 rounded-lg border border-bible-border/50">{progressPercent}% read</div>
              </div>
            </div>
          </header>
          <div className="h-1 w-full bg-bible-surface overflow-hidden shrink-0"><motion.div className="h-full bg-bible-accent" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} /></div>
          <div className="flex-1 overflow-y-auto bg-bible-bg relative custom-scrollbar scroll-smooth" ref={scrollRef}>
            <div className="p-6 pb-20 max-w-2xl mx-auto w-full">
              {loading ? (<div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500"><Loader2 className="w-8 h-8 animate-spin text-bible-accent mb-4" /><p className="text-xs font-bold text-bible-muted uppercase tracking-widest">Loading Scriptures...</p></div>) : error ? (<div className="text-center py-20 bg-red-50/50 rounded-2xl border border-red-100 px-6"><p className="text-red-600 font-bold mb-2">Error Loading Text</p><p className="text-sm text-red-500">{error}</p></div>) : (
                <div className="space-y-1">
                  {chapterData?.verses.map((v) => (
                    <VerseItem 
                      key={v.number} 
                      verse={v} 
                      language={currentBook.language} 
                      showOriginal={isOriginalOn} 
                      englishText={isEnglishOn ? kjvMap.get(v.number) : undefined} 
                      koreanText={isKoreanOn ? krvMap.get(v.number) : undefined} 
                      originalFontSize={originalFontSize} 
                      translationFontSize={translationFontSize} 
                      onOriginalFontCycle={() => setOriginalFontSize(nextFontSize(originalFontSize))} 
                      onTranslationFontCycle={() => setTranslationFontSize(nextFontSize(translationFontSize))} 
                      isHighlighted={v.number === highlightedVerse}
                      onWordClick={async (strongs, text) => {
                        setSelectedWord({ strongs, text, entry: null });
                        const entry = await dictionaryService.getDefinition(strongs);
                        setSelectedWord(prev => prev && prev.strongs === strongs ? { ...prev, entry } : prev);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="fixed inset-0 z-[100] bg-bible-bg flex flex-col items-center">
                <div className="w-full max-w-3xl flex flex-col h-full">
                  <div className="p-4 pt-[env(safe-area-inset-top)] md:pt-8 border-b border-bible-border bg-bible-bg space-y-4 shrink-0">
                    <div className="flex items-center gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-muted" /><Input autoFocus placeholder="Search all scriptures..." className="pl-10 h-11 bg-bible-surface border-none shadow-sm rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div><Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}><X className="w-6 h-6" /></Button></div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar w-full">
                     {searchResults.map((res, idx) => <SearchResultCard key={`${res.bookNumber}-${res.chapter}-${res.verseNumber}-${idx}`} result={res} onClick={() => handleSearchResultClick(res)} />)}
                     {isSearching && <div className="flex flex-col items-center py-10"><Loader2 className="w-6 h-6 animate-spin text-bible-accent mb-2" /><p className="text-[10px] font-bold text-bible-muted uppercase tracking-widest">Searching Deeply...</p></div>}
                     {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && <div className="text-center py-20 italic text-bible-muted text-sm px-10">No matches found for "{searchQuery}"</div>}
                  </div>
                </div>
              </motion.div>
            )}
            {isBookPickerOpen && (
              <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} className="fixed inset-0 z-[100] bg-bible-bg pt-[env(safe-area-inset-top)] flex flex-col md:hidden">
                <div className="shrink-0 flex items-center justify-between p-5 border-b border-bible-border bg-bible-bg"><h2 className="font-sans text-xl font-bold">Select Book</h2><Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-bible-surface" onClick={() => setIsBookPickerOpen(false)}><X className="w-5 h-5" /></Button></div>
                <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar pb-20">
                  <BookSection title="Torah & Historical" subtitle="עברית — Hebrew" books={BIBLE_BOOKS.filter(b => b.language === 'HE')} currentBookNumber={currentBookNumber} onSelect={selectBook} />
                  <BookSection title="Poetry & Prophets" subtitle="العربية — Arabic" books={BIBLE_BOOKS.filter(b => b.language === 'AR')} currentBookNumber={currentBookNumber} onSelect={selectBook} />
                  <BookSection title="New Testament" subtitle="Ελληνικά — Greek" books={BIBLE_BOOKS.filter(b => b.language === 'GR')} currentBookNumber={currentBookNumber} onSelect={selectBook} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="shrink-0 border-t border-bible-border bg-bible-bg md:hidden z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="px-3 py-3 overflow-x-auto no-scrollbar"><div className="flex gap-1.5">{Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(ch => (<button key={ch} onClick={() => setCurrentChapter(ch)} className={`min-w-[40px] h-10 rounded-xl text-xs font-bold transition-all shrink-0 ${currentChapter === ch ? 'bg-bible-accent text-white shadow-lg' : 'bg-bible-surface text-bible-muted hover:bg-bible-border'}`}>{ch}</button>))}</div></div>
          </div>
          <AnimatePresence>
            {selectedWord && (
              <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-x-0 bottom-0 z-[60] bg-bible-bg border-t border-bible-border shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-3xl md:max-w-[480px] md:mx-auto pb-[env(safe-area-inset-bottom)]">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-serif text-3xl font-bold text-bible-ink mb-1" dir={isRTL(currentBook.language) ? 'rtl' : 'ltr'}>{selectedWord.text}</h3>
                      {selectedWord.entry ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-bible-accent border-bible-accent/30">{selectedWord.strongs}</Badge>
                          <span className="text-sm font-medium text-bible-secondary italic">{selectedWord.entry.transliteration}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-bible-muted">{selectedWord.strongs}</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-bible-surface" onClick={() => setSelectedWord(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedWord.entry ? (
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                      <div>
                        <h4 className="text-[10px] font-extrabold text-bible-secondary uppercase tracking-widest mb-1">Root / Lemma</h4>
                        <p className="font-serif text-lg text-bible-ink" dir={isRTL(currentBook.language) ? 'rtl' : 'ltr'}>{selectedWord.entry.lemma}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-extrabold text-bible-secondary uppercase tracking-widest mb-1">Gloss</h4>
                        <p className="text-sm font-bold text-bible-ink">{selectedWord.entry.gloss}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-extrabold text-bible-secondary uppercase tracking-widest mb-1">Definition</h4>
                        <div className="text-sm text-bible-muted leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: selectedWord.entry.definition }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-bible-accent mb-2" />
                      <p className="text-xs text-bible-muted">Loading dictionary...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const SearchResultCard: React.FC<{ result: SearchResult; onClick: () => void; }> = ({ result, onClick }) => {
  const resultRtl = isRTL(result.language);
  const fontClass = result.language === 'HE' ? 'font-he' : result.language === 'AR' ? 'font-ar' : '';
  return (
    <button onClick={onClick} className="group w-full text-left p-4 bg-bible-surface/50 rounded-2xl border border-bible-border hover:border-bible-accent hover:bg-bible-bg hover:shadow-xl transition-all duration-300 active:scale-[0.99] cursor-pointer">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Badge variant="outline" className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-bible-bg">{result.language}</Badge>
        <span className="text-xs font-bold text-bible-accent truncate">{result.bookName} {result.chapter}:{result.verseNumber}</span>
        <div className="flex gap-1 ml-auto">
          {result.matchedIn.map(src => (<span key={src} className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${src === 'original' ? 'bg-bible-accent text-white' : src === 'en' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>{src === 'original' ? 'ORIG' : src === 'en' ? 'EN' : 'KR'}</span>))}
        </div>
      </div>
      {result.matchedIn.includes('original') && (
        <p className={`text-sm leading-relaxed text-bible-ink line-clamp-2 ${resultRtl ? 'text-right' : ''} ${fontClass}`}>{result.text}</p>
      )}
      {result.matchedIn.includes('en') && result.englishText && (
        <p className="text-[12px] leading-relaxed text-blue-700/80 line-clamp-2 mt-1">
          <span className="text-[9px] font-bold text-blue-400 uppercase mr-1">EN</span>
          {result.englishText}
        </p>
      )}
      {result.matchedIn.includes('kr') && result.koreanText && (
        <p className="text-[12px] leading-relaxed text-emerald-700/80 font-kr line-clamp-2 mt-1">
          <span className="text-[9px] font-bold text-emerald-400 uppercase mr-1">KR</span>
          {result.koreanText}
        </p>
      )}
    </button>
  );
};

const CompactBookPicker: React.FC<{ currentBookNumber: number; onSelect: (book: BookMeta) => void; }> = ({ currentBookNumber, onSelect }) => {
  const [query, setQuery] = useState('');
  const filteredBooks = useMemo(() => {
    const q = query.toLowerCase();
    return BIBLE_BOOKS.filter(b => b.nameEn.toLowerCase().includes(q) || b.nameKr.includes(q) || b.nameOriginal.toLowerCase().includes(q));
  }, [query]);
  return (
    <div className="flex flex-col h-full bg-bible-bg">
      <div className="p-4 pb-0"><div className="relative group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-muted group-focus-within:text-bible-accent transition-colors" /><Input placeholder="Search book..." className="pl-10 h-10 text-sm bg-bible-surface border-none shadow-none rounded-xl focus-visible:ring-1 focus-visible:ring-bible-accent/30" value={query} onChange={(e) => setQuery(e.target.value)} /></div></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {filteredBooks.map(book => (
          <button key={book.number} onClick={() => onSelect(book)} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group ${currentBookNumber === book.number ? 'bg-bible-accent text-white shadow-lg scale-[1.02]' : 'hover:bg-bible-surface text-bible-ink'}`}>
            <div className="flex items-center justify-between mb-0.5"><span className="text-sm font-bold truncate">{book.nameKr}</span><span className={`text-[10px] font-extrabold tracking-widest ${currentBookNumber === book.number ? 'text-white/60' : 'text-bible-muted'}`}>{book.language}</span></div>
            <div className={`text-[11px] truncate ${currentBookNumber === book.number ? 'text-white/80' : 'text-bible-secondary'}`}>{book.nameEn} • <span className="italic opacity-80">{book.nameOriginal}</span></div>
          </button>
        ))}
        {filteredBooks.length === 0 && <div className="text-center py-20 px-6"><p className="text-sm text-bible-muted italic">No scriptures found for "{query}"</p></div>}
      </div>
    </div>
  );
};

const BookSection: React.FC<{ title: string; subtitle: string; books: BookMeta[]; currentBookNumber: number; onSelect: (book: BookMeta) => void; }> = ({ title, subtitle, books, currentBookNumber, onSelect }) => (
  <div className="space-y-4">
    <div className="px-2"><h3 className="text-[11px] font-black text-bible-secondary uppercase tracking-[3px] mb-1">{title}</h3><p className="text-[10px] text-bible-muted font-medium italic">{subtitle}</p></div>
    <div className="grid grid-cols-2 gap-2.5">
      {books.map(book => (
        <button key={book.number} onClick={() => onSelect(book)} className={`text-left px-4 py-4 rounded-2xl transition-all duration-300 ${currentBookNumber === book.number ? 'bg-bible-accent text-white shadow-xl scale-[1.02]' : 'bg-bible-surface text-bible-ink hover:bg-bible-border/50 border border-bible-border/30'}`}>
          <span className="text-base font-bold block truncate mb-1">{book.nameKr}</span>
          <span className={`text-[11px] font-medium block truncate opacity-70 ${currentBookNumber === book.number ? 'text-white' : 'text-bible-muted'}`}>{book.nameEn}</span>
        </button>
      ))}
    </div>
  </div>
);

function handleClickIfNoSelection(callback: () => void) {
  return () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    callback();
  };
}

const VerseItem: React.FC<{ verse: Verse; language: Language; showOriginal: boolean; englishText?: string; koreanText?: string; originalFontSize: FontSizePreset; translationFontSize: FontSizePreset; onOriginalFontCycle: () => void; onTranslationFontCycle: () => void; isHighlighted?: boolean; onWordClick?: (strongs: string, text: string) => void; }> = ({ verse, language, showOriginal, englishText, koreanText, originalFontSize, translationFontSize, onOriginalFontCycle, onTranslationFontCycle, isHighlighted, onWordClick }) => {
  const rtl = isRTL(language);
  const fontClass = language === 'HE' ? 'font-he' : language === 'AR' ? 'font-ar' : '';
  const origSizeClass = rtl ? ORIGINAL_RTL_FONT_SIZES[originalFontSize] : ORIGINAL_FONT_SIZES[originalFontSize];
  const transSizeClass = TRANSLATION_FONT_SIZES[translationFontSize];
  return (
    <div id={`verse-${verse.number}`} className={`py-1.5 border-b border-bible-border/40 transition-all duration-1000 ${isHighlighted ? 'bg-bible-accent/10 border-bible-accent ring-1 ring-bible-accent/30 shadow-inner px-4 -mx-4 rounded-xl' : ''}`}>
      <div className={`flex gap-3 ${rtl ? 'flex-row-reverse' : ''}`}>
        <span className="shrink-0 w-7 h-7 rounded-full bg-bible-surface border border-bible-border flex items-center justify-center mt-1 shadow-sm"><span className="text-[10px] font-black text-bible-accent">{verse.number}</span></span>
        
        <div className="flex-1 flex flex-col justify-center">
          {showOriginal && (
            <div className={`font-serif text-bible-ink hover:bg-bible-surface/30 rounded-lg transition-colors px-2 -mx-2 py-0.5 mb-1.5 cursor-pointer ${fontClass} ${origSizeClass} ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'} onClick={handleClickIfNoSelection(onOriginalFontCycle)}>
              {verse.words && verse.words.length > 0 ? (
                <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                  {verse.words.map((w, i) => (
                    <span key={i} className={w.strongs ? "hover:text-bible-accent transition-colors" : ""} onClick={(e) => {
                      if (w.strongs) {
                        e.stopPropagation();
                        const selection = window.getSelection();
                        if (selection && selection.toString().length > 0) return;
                        onWordClick?.(w.strongs, w.text);
                      }
                    }}>
                      {w.text}
                    </span>
                  ))}
                </div>
              ) : (
                <p>{verse.text}</p>
              )}
            </div>
          )}

          {(englishText || koreanText) && (
            <div className={`space-y-1.5 ${rtl ? 'text-right' : 'text-left'} ${!showOriginal ? 'mt-1' : ''}`}>
              {englishText && (<div className="group cursor-pointer hover:bg-bible-surface/30 rounded-lg transition-colors px-2 -mx-2 py-1" onClick={handleClickIfNoSelection(onTranslationFontCycle)}><span className="text-[9px] font-black text-bible-secondary uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">English</span><p className={`text-bible-muted font-medium leading-relaxed ${transSizeClass}`}>{englishText}</p></div>)}
              {koreanText && (<div className="group cursor-pointer hover:bg-bible-surface/30 rounded-lg transition-colors px-2 -mx-2 py-1" onClick={handleClickIfNoSelection(onTranslationFontCycle)}><span className="text-[9px] font-black text-bible-secondary uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">Korean</span><p className={`text-bible-muted font-kr leading-relaxed ${transSizeClass}`}>{koreanText}</p></div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
