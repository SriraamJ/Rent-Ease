import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export const recordPayment = async (paymentData) => {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...paymentData };
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

export const getPayments = async (ownerId) => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('ownerId', '==', ownerId),
      orderBy('paidDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};