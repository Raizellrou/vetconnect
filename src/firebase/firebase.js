// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDzYLGhyGNTy-ZDjoSQWay8QTasbdGfT8s",
  authDomain: "vetconnect-2025.firebaseapp.com",
  projectId: "vetconnect-2025",
  storageBucket: "vetconnect-2025.firebasestorage.app",
  messagingSenderId: "439926395077",
  appId: "1:439926395077:web:7f1404777447c45099a0ac"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
