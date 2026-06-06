import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, child, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Function to share a report to Firebase
export const shareReportToFirebase = async (reportData: any) => {
  try {
    const reportsRef = ref(db, 'shared_reports');
    const newReportRef = push(reportsRef);
    await set(newReportRef, {
      ...reportData,
      status: 'pending',
      teacherExcuse: '',
      teacherSignature: '',
      sharedAt: new Date().toISOString()
    });
    return newReportRef.key;
  } catch (e) {
    console.error("Error sharing report: ", e);
    throw e;
  }
};

// Function to get a shared report by ID (for the teacher portal)
export const getSharedReport = async (reportId: string) => {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `shared_reports/${reportId}`));
    if (snapshot.exists()) {
      return { id: snapshot.key, ...snapshot.val() };
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
    const reportRef = ref(db, `shared_reports/${reportId}`);
    await update(reportRef, {
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
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'shared_reports'));
    const reports: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        reports.push({ firebaseId: childSnapshot.key, ...childSnapshot.val() });
      });
    }
    return reports;
  } catch (e) {
    console.error("Error fetching all shared reports: ", e);
    return [];
  }
};
