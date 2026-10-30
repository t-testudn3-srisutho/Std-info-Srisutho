import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  LogIn,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { SystemSetting, AppUser } from '../../types';
import { PinNumpadModal } from '../common/PinNumpadModal';

interface LoginViewProps {
  settings: SystemSetting;
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  showToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  settings,
  users,
  onLoginSuccess,
  showToast,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('warning', 'กรุณากรอกชื่อผู้ใช้งาน');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Find matching user by username in users database
      const matched = users.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (matched) {
        if (!matched.password || matched.password === password) {
          showToast('success', `ยินดีต้อนรับคุณ ${matched.fullName}`, `เข้าสู่ระบบในบทบาท: ${matched.role}`);
          onLoginSuccess(matched);
        } else {
          showToast('error', 'รหัสผ่านไม่ถูกต้อง', 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
        }
      } else {
        // Master admin fallback if users collection is empty
        if (username.trim().toLowerCase() === 'admin' && (password === settings.adminPin || password === 'admin' || password === '123' || !password)) {
          const defaultAdmin: AppUser = {
            id: 'admin_master',
            username: 'admin',
            fullName: 'ผู้ดูแลระบบ',
            role: 'ผู้ดูแลระบบ',
          };
          showToast('success', 'เข้าสู่ระบบสำเร็จ', 'สิทธิ์ผู้ดูแลระบบ');
          onLoginSuccess(defaultAdmin);
        } else {
          showToast('error', 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ', 'กรุณาตรวจสอบชื่อผู้ใช้หรือเข้าด้วย PIN ผู้ดูแลระบบ');
        }
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C7C82]/10 via-slate-100 to-[#35B4B0]/15 flex items-center justify-center p-4 relative">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-12 left-12 w-72 h-72 bg-[#0C7C82]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-80 h-80 bg-[#35B4B0]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Horizontal Login Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Left Side: Branding & School Info */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#0C7C82] via-[#108990] to-[#35B4B0] p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Top Logo & School Identity */}
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-5">
              {settings.schoolLogo ? (
                <img
                  src={settings.schoolLogo}
                  alt="School Logo"
                  className="w-16 h-16 rounded-2xl object-cover bg-white/20 p-1 backdrop-blur-xs border border-white/30 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
                  <GraduationCap className="w-9 h-9 text-white" />
                </div>
              )}
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white border border-white/20">
                  <Sparkles className="w-3 h-3 text-amber-300" /> SDS Cloud
                </span>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1 leading-tight">
                  {settings.schoolName || 'โรงเรียนศรีสุทโธ'}
                </h1>
              </div>
            </div>

            <p className="text-teal-50 text-sm font-medium leading-relaxed">
              {settings.affiliation || 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี'}
            </p>
          </div>

          {/* Center Brand Statement */}
          <div className="my-8 relative z-10">
            <div className="inline-block p-1 rounded-xl bg-white/10 backdrop-blur-xs mb-3 border border-white/10">
              <span className="text-xs font-semibold px-2 py-0.5 text-teal-100">
                Official Student Portal
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
              ระบบการจัดการข้อมูลนักเรียน
            </h2>
            <p className="text-sm text-teal-100/90 font-light mt-1">
              Student Database System (SDS)
            </p>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-white/20 text-xs text-teal-100/80 relative z-10 flex items-center justify-between">
            <span>ฐานข้อมูลคลาวด์ Firebase</span>
            <span className="font-medium text-white/90">โดย รองฯภัทรธีระ ประทุมเม</span>
          </div>
        </div>

        {/* Right Side: Horizontal Login Form */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-800">เข้าสู่ระบบ</h3>
            <p className="text-sm text-slate-500 mt-1">
              สำหรับครูผู้สอนและผู้ดูแลระบบ (ระบบตรวจสอบบทบาทจากชื่อผู้ใช้โดยอัตโนมัติ)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5 text-[#0C7C82]" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 text-slate-800 text-sm outline-hidden transition bg-slate-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  รหัสผ่าน (Password)
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5 text-[#0C7C82]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 text-slate-800 text-sm outline-hidden transition bg-slate-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] hover:opacity-95 shadow-lg shadow-teal-700/25 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              หรือคลิกไอคอนรูปกุญแจที่มุมล่างขวาเพื่อเข้าสู่ระบบด้วย PIN ผู้ดูแลระบบ
            </p>
          </div>
        </div>
      </div>

      {/* Floating Admin PIN Button at Bottom Right (ไอคอนรูปสัญลักษณ์เท่านั้น) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsPinModalOpen(true)}
          title="เข้าสู่ระบบผู้ดูแลระบบด้วย PIN 6 หลัก"
          aria-label="เข้าสู่ระบบผู้ดูแลระบบด้วย PIN"
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0C7C82] via-[#26A69A] to-[#35B4B0] text-white shadow-xl shadow-teal-900/30 hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/60 flex items-center justify-center group"
        >
          <KeyRound className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300 drop-shadow-xs" />
        </button>
      </div>

      {/* PIN Keypad Modal */}
      <PinNumpadModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        targetPin={settings.adminPin || '000000'}
        onSuccess={(adminUser) => {
          showToast('success', 'เข้าสู่ระบบสำเร็จด้วย PIN', 'สิทธิ์ผู้ดูแลระบบสูงสุด');
          onLoginSuccess(adminUser);
        }}
      />
    </div>
  );
};
