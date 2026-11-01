import React from 'react';
import {
  Menu,
  GraduationCap,
  Calendar,
  LogOut,
  ShieldCheck,
  School,
  LayoutDashboard,
  Users,
  Settings,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import { AppUser, SystemSetting, AcademicYear, ActiveTab } from '../../types';

interface NavbarProps {
  onOpenSidebar: () => void;
  currentUser: AppUser | null;
  settings: SystemSetting;
  academicYears: AcademicYear[];
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSidebar,
  currentUser,
  settings,
  academicYears,
  activeTab,
  onSelectTab,
  onLogout,
}) => {
  const currentYear = academicYears.find(y => y.isCurrent)?.year || '2567';
  const isAdmin = currentUser?.role === 'ผู้ดูแลระบบ';

  return (
    <>
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center justify-between no-print shadow-2xs">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl text-slate-600 hover:text-[#0C7C82] hover:bg-teal-50 lg:hidden transition cursor-pointer"
            title="เปิดเมนู"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate">
              {settings.schoolName || 'โรงเรียนศรีสุทโธ'}
            </h1>
          </div>
        </div>

        {/* Right: Year Badge, User Role & Profile */}
        <div className="flex items-center gap-3">
          {/* Academic Year Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#0C7C82]" />
            <span>ปีการศึกษา <strong>{currentYear}</strong></span>
          </div>

          {/* Role Badge */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            isAdmin
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-teal-50 text-teal-800 border border-teal-200'
          }`}>
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> : <School className="w-3.5 h-3.5 text-teal-600" />}
            <span className="hidden xs:inline">{currentUser?.role}</span>
          </div>

          {/* User Full Name */}
          <div className="hidden md:block text-xs font-semibold text-slate-700">
            {currentUser?.fullName}
          </div>

          {/* Logout Quick Button - Only visible in Admin Mode */}
          {isAdmin && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="ออกจากโหมดผู้ดูแล"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation Bar (กรอบพื้นหลังลอยมุมโค้งมน) */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 lg:hidden bg-white/95 backdrop-blur-md rounded-2xl p-2 border border-slate-200/80 shadow-2xl flex items-center justify-around no-print">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#0C7C82] font-bold bg-teal-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px]">แดชบอร์ด</span>
        </button>

        <button
          onClick={() => onSelectTab('homeroom')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
            activeTab === 'homeroom' ? 'text-[#0C7C82] font-bold bg-teal-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span className="text-[10px]">ครูประจำชั้น</span>
        </button>

        <button
          onClick={() => onSelectTab('classRoster')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
            activeTab === 'classRoster' ? 'text-[#0C7C82] font-bold bg-teal-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span className="text-[10px]">พิมพ์รายชื่อ</span>
        </button>

        <button
          onClick={() => onSelectTab('studentReport')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
            activeTab === 'studentReport' ? 'text-[#0C7C82] font-bold bg-teal-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px]">รายงานสถิติ</span>
        </button>

        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px]">เมนู</span>
        </button>
      </nav>
    </>
  );
};
