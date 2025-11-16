import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const addTenant = async (tenantData) => {
  try {
    const docRef = await addDoc(collection(db, 'tenants'), {
      ...tenantData,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    
    return { 
      id: docRef.id, 
      ...tenantData
    };
  } catch (error) {
    console.error('Error adding tenant:', error);
    throw error;
  }
};

export const getTenants = async (ownerId) => {
  try {
    const q = query(
      collection(db, 'tenants'),
      where('ownerId', '==', ownerId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching tenants:', error);
    throw error;
  }
};

export const exitTenant = async (tenantId, exitData) => {
  try {
    const tenantRef = doc(db, 'tenants', tenantId);
    await updateDoc(tenantRef, {
      status: 'exited',
      exitDate: exitData.exitDate,
      finalSettlement: exitData.finalSettlement,
      depositRefunded: exitData.depositRefunded,
      exitNotes: exitData.exitNotes,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error exiting tenant:', error);
    throw error;
  }
};