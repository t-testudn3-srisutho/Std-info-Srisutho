import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { AcademicYear } from '../../types';

interface AcademicYearsViewProps {
  academicYears: AcademicYear[];
  onSave: (year: AcademicYear) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    danger?: boolean
  ) => void;
}

export const AcademicYearsView: React.FC<AcademicYearsViewProps> = ({
  academicYears,
  onSave,
  onDelete,
  showToast,
  showConfirm,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYear | null>(null);
  const [yearInput, setYearInput] = useState('');
  const [isCurrentInput, setIsCurrentInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingItem(null);
    setYearInput('');
    setIsCurrentInput(false);
    setModalOpen(true);
  };

  const openEditModal = (item: AcademicYear) => {
    setEditingItem(item);
    setYearInput(item.year);
    setIsCurrentInput(item.isCurrent);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearInput.trim()) {
      showToast('warning', 'กรุณาระบุชื่อปีการศึกษา');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AcademicYear = {
        id: editingItem ? editingItem.id : `yr_${yearInput.trim()}`,
        year: yearInput.trim(),
        isCurrent: isCurrentInput,
        order: editingItem ? editingItem.order : academicYears.length + 1,
      };

      await onSave(payload);
      showToast(
        'success',
        editingItem ? 'แก้ไขปีการศึกษาสำเร็จ' : 'เพิ่มปีการศึกษาสำเร็จ',
        `ปีการศึกษา ${yearInput}`
      );
      setModalOpen(false);
    } catch {
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item: AcademicYear) => {
    showConfirm(
      'ยืนยันการลบปีการศึกษา',
      `คุณต้องการลบปีการศึกษา "${item.year}" ใช่หรือไม่?`,
      async () => {
        try {
          await onDelete(item.id);
          showToast('success', 'ลบปีการศึกษาเรียบร้อยแล้ว');
        } catch {
          showToast('error', 'ไม่สามารถลบข้อมูลได้');
        }
      },
      true
    );
  };

  const handleSetCurrent = async (item: AcademicYear) => {
    try {
      await onSave({ ...item, isCurrent: true });
      showToast('success', 'เปลี่ยนปีการศึกษาปัจจุบันเรียบร้อย', `ปีการศึกษา ${item.year}`);
    } catch {
      showToast('error', 'ไม่สามารถเปลี่ยนปีการศึกษาได้');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0C7C82]" />
            จัดการปีการศึกษา
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดและเลือกปีการศึกษาที่ใช้งานปัจจุบันในระบบ
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] text-white font-semibold text-xs shadow-md shadow-teal-800/20 hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> เพิ่มปีการศึกษา
        </button>
      </div>

      {/* Academic Years List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-20">ลำดับ</th>
                <th className="py-4 px-6">ชื่อปีการศึกษา</th>
                <th className="py-4 px-6 text-center">สถานะ</th>
                <th className="py-4 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {academicYears.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลปีการศึกษา
                  </td>
                </tr>
              ) : (
                academicYears.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 text-center text-slate-400 font-mono text-xs">
                      {index + 1}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      ปีการศึกษา {item.year}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          ปีการศึกษาปัจจุบัน
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetCurrent(item)}
                          className="text-xs text-slate-500 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-3 py-1 rounded-full transition cursor-pointer border border-slate-200"
                        >
                          ตั้งเป็นปัจจุบัน
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0C7C82]" />
                {editingItem ? 'แก้ไขปีการศึกษา' : 'เพิ่มปีการศึกษาใหม่'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อปีการศึกษา (พ.ศ.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={yearInput}
                  onChange={e => setYearInput(e.target.value)}
                  placeholder="เช่น 2567 หรือ 2568"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isCurrentCheck"
                  checked={isCurrentInput}
                  onChange={e => setIsCurrentInput(e.target.checked)}
                  className="w-4 h-4 text-[#0C7C82] rounded border-slate-300 focus:ring-[#0C7C82]"
                />
                <label htmlFor="isCurrentCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  กำหนดให้เป็นปีการศึกษาปัจจุบัน
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0C7C82] text-white text-xs font-semibold hover:bg-[#0C7C82]/90 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
