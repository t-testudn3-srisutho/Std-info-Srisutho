import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  SystemSetting,
  AcademicYear,
  Classroom,
  AppUser,
  Student,
  HomeroomAssignment,
} from '../types';

export const DEFAULT_SETTINGS: SystemSetting = {
  schoolId: '41010023',
  schoolName: 'โรงเรียนศรีสุทโธ',
  affiliation: 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี',
  schoolLogo: '',
  directorName: 'ดร.วิชาญ พงษ์สิทธิ์',
  deputyDirectorName: 'รองฯภัทรธีระ ประทุมเม',
  headOfAcademicName: 'นางสาวศิริพร บุญเสริม',
  adminPin: '000000',
};

// Local storage cache keys
const LS_PREFIX = 'sds_v2_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(LS_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Clean old cached data version 1
try {
  const oldKeys = ['sds_students', 'sds_classes', 'sds_academic_years', 'sds_users', 'sds_homeroom_assignments'];
  oldKeys.forEach(k => localStorage.removeItem(k));
} catch {
  // ignore
}

// ==================== SETTINGS ====================
export async function getSystemSettings(): Promise<SystemSetting> {
  const path = 'settings/global';
  try {
    const ref = doc(db, 'settings', 'global');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as SystemSetting;
      setLocal('settings', data);
      return data;
    } else {
      await setDoc(ref, DEFAULT_SETTINGS);
      setLocal('settings', DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return getLocal('settings', DEFAULT_SETTINGS);
  }
}

export async function saveSystemSettings(data: Partial<SystemSetting>): Promise<SystemSetting> {
  const path = 'settings/global';
  try {
    const ref = doc(db, 'settings', 'global');
    const existing = await getSystemSettings();
    const updated = { ...existing, ...data };
    await setDoc(ref, updated, { merge: true });
    setLocal('settings', updated);
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    const existing = getLocal('settings', DEFAULT_SETTINGS);
    const updated = { ...existing, ...data };
    setLocal('settings', updated);
    return updated;
  }
}

// ==================== ACADEMIC YEARS ====================
export async function getAcademicYears(): Promise<AcademicYear[]> {
  const path = 'academic_years';
  try {
    const q = query(collection(db, path), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicYear));
      setLocal('academic_years', list);
      return list;
    }
    setLocal('academic_years', []);
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return getLocal('academic_years', []);
  }
}

export async function saveAcademicYear(item: AcademicYear): Promise<void> {
  const path = `academic_years/${item.id}`;
  try {
    if (item.isCurrent) {
      const all = await getAcademicYears();
      for (const y of all) {
        if (y.id !== item.id && y.isCurrent) {
          await updateDoc(doc(db, 'academic_years', y.id), { isCurrent: false });
        }
      }
    }
    await setDoc(doc(db, 'academic_years', item.id), item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAcademicYear(id: string): Promise<void> {
  const path = `academic_years/${id}`;
  try {
    await deleteDoc(doc(db, 'academic_years', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== CLASSROOMS ====================
export async function getClassrooms(): Promise<Classroom[]> {
  const path = 'classes';
  try {
    const q = query(collection(db, path), orderBy('orderSeq', 'asc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Classroom));
      setLocal('classes', list);
      return list;
    }
    setLocal('classes', []);
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return getLocal('classes', []);
  }
}

export async function saveClassroom(item: Classroom): Promise<void> {
  const path = `classes/${item.id}`;
  try {
    await setDoc(doc(db, 'classes', item.id), item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClassroom(id: string): Promise<void> {
  const path = `classes/${id}`;
  try {
    await deleteDoc(doc(db, 'classes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAllClassrooms(): Promise<void> {
  const path = 'classes';
  try {
    const snap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    setLocal('classes', []);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    setLocal('classes', []);
  }
}

export async function batchSaveClassrooms(items: Classroom[]): Promise<void> {
  const path = 'classes';
  try {
    const batch = writeBatch(db);
    items.forEach(item => {
      const ref = doc(db, path, item.id);
      batch.set(ref, item, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==================== USERS ====================
export async function getUsers(): Promise<AppUser[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
      setLocal('users', list);
      return list;
    }
    setLocal('users', []);
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return getLocal('users', []);
  }
}

export async function saveUser(item: AppUser): Promise<void> {
  const path = `users/${item.id}`;
  try {
    await setDoc(doc(db, 'users', item.id), item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUser(id: string): Promise<void> {
  const path = `users/${id}`;
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAllUsers(): Promise<void> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    setLocal('users', []);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    setLocal('users', []);
  }
}

export async function batchSaveUsers(items: AppUser[]): Promise<void> {
  const path = 'users';
  try {
    const batch = writeBatch(db);
    items.forEach(item => {
      const ref = doc(db, path, item.id);
      batch.set(ref, item, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==================== STUDENTS ====================
export async function getStudents(): Promise<Student[]> {
  const path = 'students';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      setLocal('students', list);
      return list;
    }
    setLocal('students', []);
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return getLocal('students', []);
  }
}

export async function saveStudent(item: Student): Promise<void> {
  const path = `students/${item.id}`;
  try {
    await setDoc(doc(db, 'students', item.id), item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudent(id: string): Promise<void> {
  const path = `students/${id}`;
  try {
    await deleteDoc(doc(db, 'students', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAllStudents(): Promise<void> {
  const path = 'students';
  try {
    const snap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    setLocal('students', []);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    setLocal('students', []);
  }
}

export async function batchSaveStudents(items: Student[]): Promise<void> {
  const path = 'students';
  try {
    for (let i = 0; i < items.length; i += 400) {
      const chunk = items.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(item => {
        const ref = doc(db, path, item.id);
        batch.set(ref, item, { merge: true });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==================== HOMEROOM ASSIGNMENTS ====================
export async function getHomeroomAssignments(): Promise<HomeroomAssignment[]> {
  const path = 'homeroom_assignments';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HomeroomAssignment));
      setLocal('homeroom_assignments', list);
      return list;
    }
    setLocal('homeroom_assignments', []);
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return getLocal('homeroom_assignments', []);
  }
}

export async function saveHomeroomAssignment(item: HomeroomAssignment): Promise<void> {
  const path = `homeroom_assignments/${item.id}`;
  try {
    await setDoc(doc(db, 'homeroom_assignments', item.id), item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteHomeroomAssignment(id: string): Promise<void> {
  const path = `homeroom_assignments/${id}`;
  try {
    await deleteDoc(doc(db, 'homeroom_assignments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAllHomeroomAssignments(): Promise<void> {
  const path = 'homeroom_assignments';
  try {
    const snap = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    setLocal('homeroom_assignments', []);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    setLocal('homeroom_assignments', []);
  }
}
