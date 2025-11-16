import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyALRi4a_Ev45U7ww4u2Oi7CRX-jmF5CfNc",
  authDomain: "rentease-c2041.firebaseapp.com",
  projectId: "rentease-c2041",
  storageBucket: "rentease-c2041.firebasestorage.app",
  messagingSenderId: "195310046379",
  appId: "1:195310046379:web:632783f0106e4e44067bee",
  measurementId: "G-QTQENNCG0V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);