import { getAdminDb } from '../src/lib/firebase/admin';

function createSearchTokens(text: string): string[] {
  if (!text) return [];

  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  const tokens = new Set<string>();

  // Add individual words
  words.forEach((word) => {
    if (word.length > 0) {
      tokens.add(word);
      // Add n-grams for partial matching
      for (let i = 1; i <= word.length; i++) {
        tokens.add(word.substring(0, i));
      }
    }
  });

  // Add combinations of consecutive words
  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(`${words[i]} ${words[i + 1]}`);
  }

  return Array.from(tokens);
}

async function updateSearchFields() {
  const db = getAdminDb();
  const batch = db.batch();
  let count = 0;
  let batchCount = 0;

  try {
    const snapshot = await db.collection('opportunities').get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const searchableFields = {
        name: createSearchTokens(data.name),
        description: createSearchTokens(data.description),
      };

      batch.update(doc.ref, {
        searchableFields,
        _lastIndexed: new Date().toISOString(),
      });

      count++;
      batchCount++;

      // Commit batch every 500 documents
      if (batchCount === 500) {
        await batch.commit();
        console.log(`Processed ${count} documents`);
        batchCount = 0;
      }
    }

    // Commit any remaining documents
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`Successfully updated ${count} documents`);
  } catch (error) {
    console.error('Error updating documents:', error);
    process.exit(1);
  }
}

updateSearchFields();
