import { getFirestore } from 'firebase/firestore';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function addFeaturedFieldMigration() {
  const db = getFirestore();
  const opportunitiesRef = collection(db, 'opportunities');

  try {
    const snapshot = await getDocs(opportunitiesRef);

    const updatePromises = snapshot.docs.map(async (document) => {
      const data = document.data();

      // Only update if the featured field doesn't exist
      if (!data.metadata?.featured) {
        const docRef = doc(db, 'opportunities', document.id);
        await updateDoc(docRef, {
          'metadata.featured': false,
        });
      }
    });

    await Promise.all(updatePromises);
    console.log('Successfully added featured field to all opportunities');
  } catch (error) {
    console.error('Error during featured field migration:', error);
    throw error;
  }
}
