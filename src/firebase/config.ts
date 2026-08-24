import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAsGi4UPU_CO6hr2c0Lm_mTD3WHXp7NqZQ",
    authDomain: "angel-transports-e60c5.firebaseapp.com",
    projectId: "angel-transports-e60c5",
    storageBucket: "angel-transports-e60c5.firebasestorage.app",
    messagingSenderId: "603157948385",
    appId: "1:603157948385:web:7d0c5390f67c709f2c94a0"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;



