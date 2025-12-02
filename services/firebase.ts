
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Configuration for Firebase
// To enable Firebase storage:
// 1. Create a Firebase project at console.firebase.google.com
// 2. Register a web app
// 3. Copy the configuration object below
// 4. Create a Firestore Database in the console (Start in Test Mode for development)
const firebaseConfig = {
  // Replace these with your actual Firebase project configuration
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "APP_ID"
};

let db: any = null;

try {
  // Only initialize if the configuration has been updated from the defaults
  if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && firebaseConfig.projectId !== "your-project-id") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } else {
    console.warn("Firebase configuration not found. Using LocalStorage for data persistence.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  console.warn("Falling back to LocalStorage.");
}

export { db, collection, addDoc, getDocs, query, where };
