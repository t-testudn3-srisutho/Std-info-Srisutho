import React, { useState } from 'react';
import {
  Building2,
  Image as ImageIcon,
  UserCheck,
  Shield,
  Save,
  RotateCcw,
  Upload,
  CheckCircle,
} from 'lucide-react';
import { SystemSetting } from '../../types';

interface SettingsViewProps {
  settings: SystemSetting;
  onSave: (updated: Partial<SystemSetting>) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSave,
  showToast,
}) => {
  const [formData, setFormData] = useState<SystemSetting>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof SystemSetting, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('warning', 'ไฟล์ภาพมีขนาดใหญ่เกินไป', 'กรุณาเลือกรูปภาพขนาดไม่เกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleChange('schoolLogo', reader.result);
          showToast('success', 'อัพโหลดรูปโลโก้เรียบร้อย', 'อย่าลืมกดปุ่มบันทึกข้อมูล');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolName.trim()) {
      showToast('warning', 'กรุณาระบุชื่อโรงเรียน');
      return;
    }
    if (formData.adminPin && formData.adminPin.length !== 6) {
      showToast('warning', 'รหัส PIN ต้องมี 6 หลัก');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      showToast('success', 'บันทึกการตั้งค่าสำเร็จ', 'ข้อมูลระบบถูกปรับปรุงเรียบร้อยแล้ว');
    } catch {
      showToast('error', 'บันทึกข้อมูลไม่สำเร็จ', 'โปรดตรวจสอบการเชื่อมต่อ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0C7C82]" />
            ตั้งค่าข้อมูลสถานศึกษาและระบบ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดข้อมูลชื่อโรงเรียน สังกัด คณะผู้บริหาร และรหัส PIN ผู้ดูแลระบบ
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: School Identity & Logo */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0C7C82]" />
            ข้อมูลสถานศึกษา
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัสสถานศึกษา (School ID)
              </label>
              <input
                type="text"
                value={formData.schoolId}
                onChange={e => handleChange('schoolId', e.target.value)}
                placeholder="เช่น 41010023"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อโรงเรียน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={e => handleChange('schoolName', e.target.value)}
                placeholder="เช่น โรงเรียนศรีสุทโธ"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden font-medium text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อสังกัด <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.affiliation}
                onChange={e => handleChange('affiliation', e.target.value)}
                placeholder="เช่น สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
              />
            </div>

            {/* School Logo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                รูปโลโก้โรงเรียน (School Logo)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                  {formData.schoolLogo ? (
                    <img
                      src={formData.schoolLogo}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="px-4 py-2 rounded-xl bg-[#0C7C82] text-white text-xs font-semibold hover:bg-[#0C7C82]/90 transition cursor-pointer flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" /> เลือกไฟล์รูปภาพ
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.schoolLogo && (
                      <button
                        type="button"
                        onClick={() => handleChange('schoolLogo', '')}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        ลบรูปภาพ
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    รองรับไฟล์ PNG, JPG, WebP ขนาดไม่เกิน 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: School Administration */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#0C7C82]" />
            ข้อมูลผู้บริหารและหัวหน้างาน
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อผู้อำนวยการโรงเรียน
              </label>
              <input
                type="text"
                value={formData.directorName}
                onChange={e => handleChange('directorName', e.target.value)}
                placeholder="เช่น ดร.วิชาญ พงษ์สิทธิ์"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อรองผู้อำนวยการโรงเรียน
              </label>
              <input
                type="text"
                value={formData.deputyDirectorName}
                onChange={e => handleChange('deputyDirectorName', e.target.value)}
                placeholder="เช่น รองฯภัทรธีระ ประทุมเม"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อหัวหน้างานวิชาการ
              </label>
              <input
                type="text"
                value={formData.headOfAcademicName}
                onChange={e => handleChange('headOfAcademicName', e.target.value)}
                placeholder="เช่น นางสาวศิริพร บุญเสริม"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Security & Quick Admin PIN */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0C7C82]" />
            ความปลอดภัยและรหัส PIN ผู้ดูแลระบบ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัส PIN ผู้ดูแลระบบ 6 หลัก (สำหรับปุ่มลอยหน้าแรก)
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.adminPin}
                onChange={e => handleChange('adminPin', e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm tracking-widest font-mono font-bold text-[#0C7C82] focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ค่าเริ่มต้น: 000000 (กรุณาเปลี่ยนเพื่อความปลอดภัย)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-900 leading-relaxed">
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#0C7C82]" />
                ระบบเชื่อมต่อฐานข้อมูล Firebase
              </div>
              <div>โครงการ: <span className="font-mono font-semibold">std-info-srisutho</span></div>
              <div className="text-[11px] text-teal-700 mt-1">ข้อมูลจะถูกจัดเก็บบน Google Cloud Firestore โดยอัตโนมัติ</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setFormData({ ...settings })}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> รีเซ็ต
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] text-white font-semibold text-sm hover:opacity-95 shadow-lg shadow-teal-800/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </form>
    </div>
  );
};
