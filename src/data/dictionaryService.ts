export interface DictionaryEntry {
  lemma: string;
  transliteration: string;
  gloss: string;
  definition: string;
}

class DictionaryService {
  private hebrewDict: Record<string, DictionaryEntry> | null = null;
  private greekDict: Record<string, DictionaryEntry> | null = null;
  
  private hebrewPromise: Promise<void> | null = null;
  private greekPromise: Promise<void> | null = null;

  async loadDictionary(type: 'hebrew' | 'greek'): Promise<void> {
    if (type === 'hebrew') {
      if (this.hebrewDict) return;
      if (this.hebrewPromise) return this.hebrewPromise;

      this.hebrewPromise = fetch('/data/strongs_hebrew.json')
        .then(res => res.json())
        .then(data => {
          this.hebrewDict = data;
        })
        .catch(err => {
          console.error('Failed to load Hebrew Strongs dictionary:', err);
        });
      return this.hebrewPromise;
    } else {
      if (this.greekDict) return;
      if (this.greekPromise) return this.greekPromise;

      this.greekPromise = fetch('/data/strongs_greek.json')
        .then(res => res.json())
        .then(data => {
          this.greekDict = data;
        })
        .catch(err => {
          console.error('Failed to load Greek Strongs dictionary:', err);
        });
      return this.greekPromise;
    }
  }

  prefetch(type: 'hebrew' | 'greek') {
    if (type === 'hebrew' && (this.hebrewDict || this.hebrewPromise)) return;
    if (type === 'greek' && (this.greekDict || this.greekPromise)) return;

    // Fire and forget, but delay it so it doesn't block chapter UI rendering
    setTimeout(() => {
      this.loadDictionary(type);
    }, 1500);
  }

  async getDefinition(strongs: string): Promise<DictionaryEntry | null> {
    const prefix = strongs.charAt(0).toUpperCase();
    const type = prefix === 'H' ? 'hebrew' : 'greek';
    await this.loadDictionary(type);
    
    // Pad the numeric part to 4 digits (e.g. "H430" -> "H0430")
    const numStr = strongs.substring(1).replace(/[^0-9]/g, '');
    const num = parseInt(numStr, 10);
    const paddedStrongs = isNaN(num) ? strongs : `${prefix}${num.toString().padStart(4, '0')}`;
    
    let entry: DictionaryEntry | null = null;
    if (type === 'hebrew' && this.hebrewDict) {
      entry = this.hebrewDict[paddedStrongs] || this.hebrewDict[strongs] || null;
    } else if (type === 'greek' && this.greekDict) {
      entry = this.greekDict[paddedStrongs] || this.greekDict[strongs] || null;
    }

    // Return a fallback entry if not found so the UI stops spinning
    if (!entry) {
      return {
        lemma: 'Unknown',
        transliteration: '-',
        gloss: 'Definition not available',
        definition: 'Could not find a dictionary entry for this Strongs number.'
      };
    }
    return entry;
  }
}

export const dictionaryService = new DictionaryService();
