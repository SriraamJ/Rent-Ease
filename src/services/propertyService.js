import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const addProperty = async (propertyData, ownerId) => {
  try {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...propertyData,
      ownerId,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...propertyData };
  } catch (error) {
    console.error('Error adding property:', error);
    throw error;
  }
};

export const getProperties = async (ownerId) => {
  try {
    const q = query(
      collection(db, 'properties'),
      where('ownerId', '==', ownerId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};