import fs from 'fs';
import path from 'path';
import * as metaxia from '@metaxia/scriptures';

const OUTPUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data');

async function exportStrongs() {
  console.log('Exporting Strongs dictionary...');
  
  const hebrewDict: Record<string, any> = {};
  const greekDict: Record<string, any> = {};
  
  // Hebrew: H0001 to H8674
  for (let i = 1; i <= 8674; i++) {
    const id = `H${i.toString().padStart(4, '0')}`;
    try {
      const defs = await metaxia.lookupStrongs(id);
      if (defs && defs.length > 0) {
        hebrewDict[id] = {
          lemma: defs[0].lemma,
          transliteration: defs[0].transliteration,
          gloss: defs[0].gloss,
          definition: defs[0].definition
        };
      }
    } catch (e) {
      // Ignore missing
    }
    if (i % 1000 === 0) console.log(`Processed ${i} Hebrew...`);
  }

  // Greek: G0001 to G5624
  for (let i = 1; i <= 5624; i++) {
    const id = `G${i.toString().padStart(4, '0')}`;
    try {
      const defs = await metaxia.lookupStrongs(id);
      if (defs && defs.length > 0) {
        greekDict[id] = {
          lemma: defs[0].lemma,
          transliteration: defs[0].transliteration,
          gloss: defs[0].gloss,
          definition: defs[0].definition
        };
      }
    } catch (e) {
      // Ignore missing
    }
    if (i % 1000 === 0) console.log(`Processed ${i} Greek...`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'strongs_hebrew.json'), JSON.stringify(hebrewDict));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'strongs_greek.json'), JSON.stringify(greekDict));
  console.log(`Saved Strongs dictionary! Total Hebrew: ${Object.keys(hebrewDict).length}, Total Greek: ${Object.keys(greekDict).length}`);
}

exportStrongs().catch(console.error);
