import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcKj43w38I4vSD9gdedurxwm8A0-tNjZs",
  authDomain: "school-attendance-b8592.firebaseapp.com",
  projectId: "school-attendance-b8592",
  storageBucket: "school-attendance-b8592.firebasestorage.app",
  messagingSenderId: "155764122686",
  appId: "1:155764122686:web:385248d157a503bbf8dd6f",
  measurementId: "G-QBJWP48T02"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const docRef = await addDoc(collection(db, "test_collection"), {
      test: "hello"
    });
    console.log("SUCCESS! Document written with ID: ", docRef.id);
    process.exit(0);
  } catch (e) {
    console.error("FAILED! Error adding document: ", e);
    process.exit(1);
  }
}

test();
