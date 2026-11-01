import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  GraduationCap,
  UserCheck,
  Calendar,
  Settings,
  LogOut,
  X,
  School,
} from 'lucide-react';
import { ActiveTab, AppUser, SystemSetting, AcademicYear } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: AppUser | null;
  settings: SystemSetting;
  academicYears: AcademicYear[];
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  settings,
  academicYears,
  isOpen,
  onClose,
  onLogout,
}) => {
  const isAdmin = currentUser?.role === 'ผู้ดูแลระบบ';
  const currentYear = academicYears.find(y => y.isCurrent)?.year || '2567';

  const menuItems = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ด',
      icon: LayoutDashboard,
      teacherAllowed: true,
    },
    {
      id: 'homeroom',
      label: 'มอบหมายครูประจำชั้น',
      icon: UserCheck,
      teacherAllowed: true,
    },
    {
      id: 'classRoster',
      label: 'พิมพ์รายชื่อนักเรียน',
      icon: GraduationCap,
      teacherAllowed: true,
    },
    {
      id: 'studentReport',
      label: 'รายงานสถิติ',
      icon: BarChart3,
      teacherAllowed: true,
    },
    {
      id: 'students',
      label: 'จัดการข้อมูลนักเรียน',
      icon: Users,
      teacherAllowed: false,
    },
    {
      id: 'classrooms',
      label: 'จัดการชั้นเรียน',
      icon: School,
      teacherAllowed: false,
    },
    {
      id: 'academicYears',
      label: 'จัดการปีการศึกษา',
      icon: Calendar,
      teacherAllowed: false,
    },
    {
      id: 'settings',
      label: 'ตั้งค่าระบบ',
      icon: Settings,
      teacherAllowed: false,
    },
  ];

  const visibleItems = menuItems.filter(item => isAdmin || item.teacherAllowed);

  return (
    <>
      {/* Mobile Backdrop overlay (คลิกที่ว่างให้ซ่อนเมนูกลับ) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Sidebar (สไลด์ออกมา และซ่อนเมื่อคลิกที่ว่าง) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } no-print`}
      >
        {/* Top: School Brand */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.schoolLogo ? (
                <img
                  src={settings.schoolLogo}
                  alt="School Logo"
                  className="w-11 h-11 rounded-2xl object-cover border border-teal-100 shadow-xs"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0C7C82] to-[#35B4B0] text-white flex items-center justify-center shadow-md shadow-teal-700/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
              )}
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-[#0C7C82] truncate">
                  {settings.schoolName || 'โรงเรียนศรีสุทโธ'}
                </div>
                <div className="text-[11px] font-medium text-slate-500 truncate">
                  Student Database System
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>ปีการศึกษา: <strong>{currentYear}</strong></span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
              isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-teal-50 text-teal-700'
            }`}>
              {currentUser?.role || 'ผู้ใช้งาน'}
            </span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            เมนูหลัก
          </div>

          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id as ActiveTab);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] text-white shadow-md shadow-teal-800/20 font-bold'
                    : 'text-slate-600 hover:bg-teal-50/70 hover:text-[#0C7C82]'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-teal-100 text-[#0C7C82]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom: Current User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-teal-100 text-[#0C7C82] flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.fullName.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">
                {currentUser?.fullName}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                @{currentUser?.username}
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={onLogout}
              className="w-full py-2 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากโหมดผู้ดูแล</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
