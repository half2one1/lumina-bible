export interface DictionaryEntry {
  lemma: string;
  transliteration: string;
  gloss: string;
  definition: string;
}

class DictionaryService {
  private dictionary: Record<string, DictionaryEntry> | null = null;
  private loadPromise: Promise<void> | null = null;

  async loadDictionary(): Promise<void> {
    if (this.dictionary) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = fetch('/data/strongs_dictionary.json')
      .then(res => res.json())
      .then(data => {
        this.dictionary = data;
      })
      .catch(err => {
        console.error('Failed to load Strongs dictionary:', err);
      });

    return this.loadPromise;
  }

  async getDefinition(strongs: string): Promise<DictionaryEntry | null> {
    await this.loadDictionary();
    if (!this.dictionary) return null;
    return this.dictionary[strongs] || null;
  }
}

export const dictionaryService = new DictionaryService();
