import React from 'react';
import { SystemSetting } from '../../types';

interface FooterProps {
  settings: SystemSetting;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="mt-auto py-6 px-4 text-center border-t border-slate-100 bg-white/70 backdrop-blur-xs text-xs text-slate-500 no-print">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="font-medium text-slate-700">
          ระบบการจัดการฐานข้อมูลนักเรียน (Student Database System) {settings.schoolName || 'โรงเรียนศรีสุทโธ'}
        </div>
        <div className="text-slate-500">
          โดย <strong className="text-[#0C7C82] font-semibold">รองฯภัทรธีระ ประทุมเม</strong>
        </div>
      </div>
    </footer>
  );
};
