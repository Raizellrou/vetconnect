// src/firebase/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage"; // Optional (skip if not using Storage yet)

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzYLGhyGNTy-ZDjoSQWay8QTasbdGfT8s",
  authDomain: "vetconnect-2025.firebaseapp.com",
  projectId: "vetconnect-2025",
  storageBucket: "vetconnect-2025.firebasestorage.app", // ❌ this seems off — see note below
  messagingSenderId: "439926395077",
  appId: "1:439926395077:web:7f1404777447c45099a0ac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage = getStorage(app);
