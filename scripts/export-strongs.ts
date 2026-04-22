import fs from 'fs';
import path from 'path';
import * as metaxia from '@metaxia/scriptures';

const OUTPUT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data');

async function exportStrongs() {
  console.log('Exporting Strongs dictionary...');
  
  // Actually, metaxia has 'stepbible-tbesh' and 'stepbible-tbesg'.
  // We can just iterate through H0001 to H8674, and G0001 to G5624.
  const dict: Record<string, any> = {};
  
  // Hebrew: H0001 to H8674
  for (let i = 1; i <= 8674; i++) {
    const id = `H${i.toString().padStart(4, '0')}`;
    try {
      const defs = await metaxia.lookupStrongs(id);
      if (defs && defs.length > 0) {
        dict[id] = {
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
        dict[id] = {
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
  fs.writeFileSync(path.join(OUTPUT_DIR, 'strongs_dictionary.json'), JSON.stringify(dict));
  console.log(`Saved Strongs dictionary! Total entries: ${Object.keys(dict).length}`);
}

exportStrongs().catch(console.error);
