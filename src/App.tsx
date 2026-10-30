import React, { useState, useEffect } from 'react';
import {
  SystemSetting,
  AcademicYear,
  Classroom,
  AppUser,
  Student,
  HomeroomAssignment,
  ActiveTab,
} from './types';
import {
  getSystemSettings,
  saveSystemSettings,
  getAcademicYears,
  saveAcademicYear,
  deleteAcademicYear,
  getClassrooms,
  saveClassroom,
  deleteClassroom,
  deleteAllClassrooms,
  batchSaveClassrooms,
  getUsers,
  saveUser,
  deleteUser,
  deleteAllUsers,
  batchSaveUsers,
  getStudents,
  saveStudent,
  deleteStudent,
  deleteAllStudents,
  batchSaveStudents,
  getHomeroomAssignments,
  saveHomeroomAssignment,
  deleteHomeroomAssignment,
  deleteAllHomeroomAssignments,
  DEFAULT_SETTINGS,
} from './services/db';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { SettingsView } from './components/settings/SettingsView';
import { AcademicYearsView } from './components/academicYears/AcademicYearsView';
import { ClassroomsView, compareClassrooms } from './components/classrooms/ClassroomsView';
import { UsersView } from './components/users/UsersView';
import { StudentsView } from './components/students/StudentsView';
import { HomeroomView } from './components/homeroom/HomeroomView';
import { ClassRosterView } from './components/classRoster/ClassRosterView';
import { StudentReportView } from './components/reports/StudentReportView';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { SweetAlertModal, ToastNotification, AlertConfig, ConfirmConfig } from './components/common/SweetAlert';
import { CardSkeleton, TableSkeleton, ChartSkeleton } from './components/common/Skeleton';

export default function App() {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('sds_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data states
  const [settings, setSettings] = useState<SystemSetting>(DEFAULT_SETTINGS);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [homeroomAssignments, setHomeroomAssignments] = useState<HomeroomAssignment[]>([]);

  // Loading states (Skeleton & Lazy Loading)
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // SweetAlert & Confirm modals
  const [toast, setToast] = useState<AlertConfig | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, danger = false) => {
    setConfirmConfig({
      title,
      message,
      onConfirm,
      danger,
    });
  };

  // Initial Data Fetching from Firestore with lazy loading
  const loadAllData = async () => {
    setIsInitialLoading(true);
    try {
      const [stgs, yrs, cls, usr, std, hmr] = await Promise.all([
        getSystemSettings(),
        getAcademicYears(),
        getClassrooms(),
        getUsers(),
        getStudents(),
        getHomeroomAssignments(),
      ]);

      let activeClassrooms = cls;
      if (activeClassrooms.length === 0 && std.length > 0) {
        const extractedMap = new Map<string, { className: string; room: string }>();
        std.forEach(s => {
          const c = (s.classLevel || '').trim();
          const r = (s.room || '').trim();
          if (c && r) {
            extractedMap.set(`${c}_${r}`, { className: c, room: r });
          }
        });

        if (extractedMap.size > 0) {
          const sorted = Array.from(extractedMap.values()).sort(compareClassrooms);
          activeClassrooms = sorted.map((c, i) => ({
            id: `c_${Date.now()}_${i}`,
            className: c.className,
            room: c.room,
            orderSeq: i + 1,
          }));
          batchSaveClassrooms(activeClassrooms).catch(console.warn);
        }
      }

      setSettings(stgs);
      setAcademicYears(yrs);
      setClassrooms(activeClassrooms);
      setUsers(usr);
      setStudents(std);
      setHomeroomAssignments(hmr);
    } catch (err) {
      console.error('Error loading Firestore data:', err);
      showToast('error', 'โหลดข้อมูลไม่สำเร็จ', 'ระบบกำลังใช้งานฐานข้อมูลแบบออฟไลน์');
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync user state to localStorage
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('sds_current_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    showConfirm(
      'ยืนยันการออกจากระบบ',
      'คุณต้องการออกจากระบบการจัดการฐานข้อมูลนักเรียนใช่หรือไม่?',
      () => {
        setCurrentUser(null);
        try {
          localStorage.removeItem('sds_current_user');
        } catch {
          // ignore
        }
        showToast('info', 'ออกจากระบบเรียบร้อยแล้ว');
      },
      false
    );
  };

  // Handlers for Firestore actions
  const handleSaveSettings = async (updated: Partial<SystemSetting>) => {
    const res = await saveSystemSettings(updated);
    setSettings(res);
  };

  const handleSaveAcademicYear = async (item: AcademicYear) => {
    await saveAcademicYear(item);
    const yrs = await getAcademicYears();
    setAcademicYears(yrs);
  };

  const handleDeleteAcademicYear = async (id: string) => {
    await deleteAcademicYear(id);
    setAcademicYears(prev => prev.filter(y => y.id !== id));
  };

  const handleSaveClassroom = async (item: Classroom) => {
    await saveClassroom(item);
    const cls = await getClassrooms();
    setClassrooms(cls);
  };

  const handleDeleteClassroom = async (id: string) => {
    await deleteClassroom(id);
    setClassrooms(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteAllClassrooms = async () => {
    await deleteAllClassrooms();
    setClassrooms([]);
  };

  const handleBatchSaveClassrooms = async (items: Classroom[]) => {
    await batchSaveClassrooms(items);
    const cls = await getClassrooms();
    setClassrooms(cls);
  };

  const handleSaveUser = async (item: AppUser) => {
    await saveUser(item);
    const usr = await getUsers();
    setUsers(usr);
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleDeleteAllUsers = async () => {
    await deleteAllUsers();
    setUsers([]);
  };

  const handleBatchSaveUsers = async (items: AppUser[]) => {
    await batchSaveUsers(items);
    const usr = await getUsers();
    setUsers(usr);
  };

  const syncClassroomsFromStudents = async (studentList: Student[]) => {
    const cls = await getClassrooms();
    const existingKeys = new Set(cls.map(c => `${c.className.trim()}_${c.room.trim()}`));
    const newItems: Classroom[] = [];

    studentList.forEach(s => {
      const c = (s.classLevel || '').trim();
      const r = (s.room || '').trim();
      if (!c || !r) return;
      const key = `${c}_${r}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        newItems.push({
          id: `c_${Date.now()}_${newItems.length}`,
          className: c,
          room: r,
          orderSeq: cls.length + newItems.length + 1,
        });
      }
    });

    if (newItems.length > 0) {
      await batchSaveClassrooms(newItems);
      const updated = await getClassrooms();
      setClassrooms(updated);
    }
  };

  const handleSaveStudent = async (item: Student) => {
    await saveStudent(item);
    const std = await getStudents();
    setStudents(std);
    await syncClassroomsFromStudents(std);
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudent(id);
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleDeleteAllStudents = async () => {
    await deleteAllStudents();
    setStudents([]);
  };

  const handleBatchSaveStudents = async (items: Student[]) => {
    await batchSaveStudents(items);
    const std = await getStudents();
    setStudents(std);
    await syncClassroomsFromStudents(std);
  };

  const handleSaveHomeroom = async (item: HomeroomAssignment) => {
    await saveHomeroomAssignment(item);
    const hmr = await getHomeroomAssignments();
    setHomeroomAssignments(hmr);
  };

  const handleDeleteHomeroom = async (id: string) => {
    await deleteHomeroomAssignment(id);
    setHomeroomAssignments(prev => prev.filter(h => h.id !== id));
  };

  const handleDeleteAllHomeroom = async () => {
    await deleteAllHomeroomAssignments();
    setHomeroomAssignments([]);
  };

  // If user is not logged in, show the Login page with horizontal card and PIN numpad modal
  if (!currentUser) {
    return (
      <>
        <LoginView
          settings={settings}
          users={users}
          onLoginSuccess={handleLoginSuccess}
          showToast={showToast}
        />
        <SweetAlertModal confirmState={confirmConfig} onClose={() => setConfirmConfig(null)} />
        <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Sidebar (Desktop fixed left, Mobile sliding drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        settings={settings}
        academicYears={academicYears}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-h-screen transition-all print:pl-0 print:m-0">
        {/* Top Navbar */}
        <Navbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          currentUser={currentUser}
          settings={settings}
          academicYears={academicYears}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLogout={handleLogout}
        />

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12 print:p-0 print:m-0 print:max-w-none">
          {isInitialLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><ChartSkeleton /></div>
                <div><ChartSkeleton /></div>
              </div>
              <TableSkeleton rows={5} />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  students={students}
                  classrooms={classrooms}
                  academicYears={academicYears}
                  settings={settings}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'students' && (
                <StudentsView
                  students={students}
                  classrooms={classrooms}
                  settings={settings}
                  onSave={handleSaveStudent}
                  onDelete={handleDeleteStudent}
                  onDeleteAll={handleDeleteAllStudents}
                  onBatchSave={handleBatchSaveStudents}
                  showToast={showToast}
                  showConfirm={showConfirm}
                />
              )}

              {activeTab === 'classRoster' && (
                <ClassRosterView
                  students={students}
                  classrooms={classrooms}
                  academicYears={academicYears}
                  assignments={homeroomAssignments}
                  settings={settings}
                  showToast={showToast}
                />
              )}

              {activeTab === 'studentReport' && (
                <StudentReportView
                  students={students}
                  classrooms={classrooms}
                  academicYears={academicYears}
                  assignments={homeroomAssignments}
                  settings={settings}
                  showToast={showToast}
                />
              )}

              {activeTab === 'homeroom' && (
                <HomeroomView
                  assignments={homeroomAssignments}
                  users={users}
                  classrooms={classrooms}
                  academicYears={academicYears}
                  onSave={handleSaveHomeroom}
                  onDelete={handleDeleteHomeroom}
                  onDeleteAll={handleDeleteAllHomeroom}
                  showToast={showToast}
                  showConfirm={showConfirm}
                />
              )}

              {activeTab === 'classrooms' && (
                <ClassroomsView
                  classrooms={classrooms}
                  students={students}
                  onSave={handleSaveClassroom}
                  onDelete={handleDeleteClassroom}
                  onDeleteAll={handleDeleteAllClassrooms}
                  onBatchSave={handleBatchSaveClassrooms}
                  showToast={showToast}
                  showConfirm={showConfirm}
                />
              )}

              {activeTab === 'academicYears' && (
                <AcademicYearsView
                  academicYears={academicYears}
                  onSave={handleSaveAcademicYear}
                  onDelete={handleDeleteAcademicYear}
                  showToast={showToast}
                  showConfirm={showConfirm}
                />
              )}

              {activeTab === 'users' && (
                <UsersView
                  users={users}
                  onSave={handleSaveUser}
                  onDelete={handleDeleteUser}
                  onDeleteAll={handleDeleteAllUsers}
                  onBatchSave={handleBatchSaveUsers}
                  showToast={showToast}
                  showConfirm={showConfirm}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  onSave={handleSaveSettings}
                  showToast={showToast}
                />
              )}
            </>
          )}
        </main>

        {/* Global School Footer */}
        <Footer settings={settings} />
      </div>

      {/* Global SweetAlert Confirm Modal */}
      <SweetAlertModal confirmState={confirmConfig} onClose={() => setConfirmConfig(null)} />

      {/* Global Toast Notification */}
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
