// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7KulHpiU5GtayQcJiPwSkZuYHYFfKm8E",
  authDomain: "shivayledger.firebaseapp.com",
  projectId: "shivayledger",
  storageBucket: "shivayledger.appspot.com",
  messagingSenderId: "382763867915",
  appId: "1:382763867915:web:00cbadac1dece7ecf5cc0e",
  measurementId: "G-B6DZLHJ2WP"
};

// Initialize Firebase first before creating any services
const app = initializeApp(firebaseConfig);

// Then initialize all the services
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Export Firebase services separately
export { db, auth, provider, doc, setDoc, analytics };

// Export default app instance for direct imports elsewhere if needed
export default app;