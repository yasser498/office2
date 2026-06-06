import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Function to share a report to Firebase
export const shareReportToFirebase = async (reportData: any) => {
  try {
    const docRef = await addDoc(collection(db, "shared_reports"), {
      ...reportData,
      status: 'pending',
      teacherExcuse: '',
      teacherSignature: '',
      sharedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error sharing report: ", e);
    throw e;
  }
};

// Function to get a shared report by ID (for the teacher portal)
export const getSharedReport = async (reportId: string) => {
  try {
    const docRef = doc(db, "shared_reports", reportId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (e) {
    console.error("Error getting report: ", e);
    throw e;
  }
};

// Function for the teacher to submit their response
export const submitTeacherResponse = async (reportId: string, excuse: string, signature: string) => {
  try {
    const docRef = doc(db, "shared_reports", reportId);
    await updateDoc(docRef, {
      teacherExcuse: excuse,
      teacherSignature: signature,
      status: 'signed',
      signedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error submitting response: ", e);
    throw e;
  }
};

// Function for Admin to get all shared reports
export const getAllSharedReports = async () => {
  try {
    const q = query(collection(db, "shared_reports"));
    const querySnapshot = await getDocs(q);
    const reports: any[] = [];
    querySnapshot.forEach((doc) => {
      reports.push({ firebaseId: doc.id, ...doc.data() });
    });
    return reports;
  } catch (e) {
    console.error("Error fetching all shared reports: ", e);
    return [];
  }
};
