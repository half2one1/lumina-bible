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
    // Strong's numbers start with 'H' for Hebrew or 'G' for Greek
    const type = strongs.startsWith('H') ? 'hebrew' : 'greek';
    await this.loadDictionary(type);
    
    if (type === 'hebrew' && this.hebrewDict) {
      return this.hebrewDict[strongs] || null;
    } else if (type === 'greek' && this.greekDict) {
      return this.greekDict[strongs] || null;
    }
    return null;
  }
}

export const dictionaryService = new DictionaryService();
