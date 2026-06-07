import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, child, update } from 'firebase/database';
import { AdminClassIncident, AdminPortalPayload, ClassTiming, Employee, MorningAttendanceRecord, ScheduleEntry } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBcKj43w38I4vSD9gdedurxwm8A0-tNjZs",
  authDomain: "school-attendance-b8592.firebaseapp.com",
  projectId: "school-attendance-b8592",
  storageBucket: "school-attendance-b8592.firebasestorage.app",
  messagingSenderId: "155764122686",
  appId: "1:155764122686:web:385248d157a503bbf8dd6f",
  measurementId: "G-QBJWP48T02",
  databaseURL: "https://school-attendance-b8592-default-rtdb.firebaseio.com/"
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

// Function to delete all shared reports from Firebase (Admin/Settings)
export const deleteAllFirebaseReports = async () => {
  try {
    const reportsRef = ref(db, 'shared_reports');
    await set(reportsRef, null);
  } catch (e) {
    console.error("Error deleting all firebase reports: ", e);
    throw e;
  }
};

export const publishMorningAttendanceRoster = async (employees: Employee[], schedule: ScheduleEntry[] = [], timings: ClassTiming[] = []) => {
  const roster = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    employeeCode: emp.employeeCode || '',
    workplace: emp.workplace || '',
  }));
  await set(ref(db, 'morning_attendance_roster'), {
    updatedAt: new Date().toISOString(),
    employees: roster,
  });
  await set(ref(db, 'admin_portal_payload'), {
    updatedAt: new Date().toISOString(),
    employees: roster,
    schedule,
    timings,
  });
};

export const getMorningAttendanceRoster = async () => {
  const snapshot = await get(child(ref(db), 'morning_attendance_roster'));
  if (!snapshot.exists()) return { employees: [], updatedAt: '' };
  return snapshot.val();
};

export const getMorningAttendanceByDate = async (date: string): Promise<Record<string, MorningAttendanceRecord>> => {
  const snapshot = await get(child(ref(db), `morning_attendance/${date}`));
  return snapshot.exists() ? snapshot.val() : {};
};

export const setMorningAttendanceStatus = async (date: string, employee: { id: number; name: string }, status: 'present' | 'absent') => {
  const record: MorningAttendanceRecord = {
    employeeId: employee.id,
    employeeName: employee.name,
    status,
    date,
    updatedAt: new Date().toISOString(),
  };
  await set(ref(db, `morning_attendance/${date}/${employee.id}`), record);
  return record;
};

export const getAdminPortalPayload = async (): Promise<AdminPortalPayload> => {
  const snapshot = await get(child(ref(db), 'admin_portal_payload'));
  if (!snapshot.exists()) return { updatedAt: '', employees: [], schedule: [], timings: [] };
  return snapshot.val();
};

export const setClassIncident = async (incident: AdminClassIncident) => {
  const key = `${incident.date}_${incident.scheduleEntry.day}_${incident.scheduleEntry.session}_${incident.scheduleEntry.grade}_${incident.scheduleEntry.section}_${incident.incidentType}`.replace(/[.#$/\[\]]/g, '-');
  const record = { ...incident, id: key };
  await set(ref(db, `class_incidents/${incident.date}/${key}`), record);
  return record;
};

export const getClassIncidentsByDate = async (date: string): Promise<Record<string, AdminClassIncident>> => {
  const snapshot = await get(child(ref(db), `class_incidents/${date}`));
  return snapshot.exists() ? snapshot.val() : {};
};
