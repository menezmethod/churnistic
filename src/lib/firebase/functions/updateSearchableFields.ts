import * as functions from 'firebase-functions';

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

export const onOpportunityWrite = functions.firestore
  .document('opportunities/{opportunityId}')
  .onWrite(async (change, context) => {
    // If the document was deleted, no need to update search fields
    if (!change.after.exists) {
      return null;
    }

    const data = change.after.data();
    if (!data) return null;

    // Create searchable fields
    const searchableFields = {
      name: createSearchTokens(data.name),
      description: createSearchTokens(data.description),
      // Add more fields as needed
    };

    // Update the document with searchable fields
    try {
      await change.after.ref.update({
        searchableFields,
        _lastIndexed: new Date().toISOString(),
      });

      console.log(
        `Updated search fields for opportunity ${context.params.opportunityId}`
      );
      return null;
    } catch (error) {
      console.error('Error updating search fields:', error);
      throw error;
    }
  });
