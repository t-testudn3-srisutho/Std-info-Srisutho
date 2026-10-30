import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  School,
  GraduationCap,
} from 'lucide-react';
import { HomeroomAssignment, AppUser, Classroom, AcademicYear } from '../../types';

interface HomeroomViewProps {
  assignments: HomeroomAssignment[];
  users: AppUser[];
  classrooms: Classroom[];
  academicYears: AcademicYear[];
  onSave: (item: HomeroomAssignment) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  showToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    danger?: boolean
  ) => void;
}

export const HomeroomView: React.FC<HomeroomViewProps> = ({
  assignments,
  users,
  classrooms,
  academicYears,
  onSave,
  onDelete,
  onDeleteAll,
  showToast,
  showConfirm,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomeroomAssignment | null>(null);
  const [selectedTeacherUsername, setSelectedTeacherUsername] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Requirement: max 10 per page

  // Filter only teachers (or users who can be homeroom)
  const teacherList = useMemo(() => {
    return users.filter(u => u.role === 'ครู' || u.role === 'ผู้ดูแลระบบ');
  }, [users]);

  const currentYear = academicYears.find(y => y.isCurrent)?.year || '2567';

  // Pagination calculation
  const totalPages = Math.ceil(assignments.length / itemsPerPage) || 1;
  const currentList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return assignments.slice(start, start + itemsPerPage);
  }, [assignments, currentPage]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSelectedTeacherUsername(teacherList[0]?.username || '');
    const firstCls = classrooms[0];
    setSelectedClassId(firstCls ? `${firstCls.className}_${firstCls.room}` : '');
    setSelectedYear(currentYear);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: HomeroomAssignment) => {
    setEditingItem(item);
    setSelectedTeacherUsername(item.teacherUsername || '');
    setSelectedClassId(`${item.className}_${item.room}`);
    setSelectedYear(item.academicYear);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherUsername || !selectedClassId) {
      showToast('warning', 'กรุณาเลือกครูและชั้นเรียน');
      return;
    }

    const teacher = teacherList.find(t => t.username === selectedTeacherUsername);
    const teacherName = teacher ? teacher.fullName : selectedTeacherUsername;
    const [className, room] = selectedClassId.split('_');

    setIsSubmitting(true);
    try {
      const payload: HomeroomAssignment = {
        id: editingItem ? editingItem.id : `hr_${Date.now()}`,
        teacherUsername: selectedTeacherUsername,
        teacherName,
        className,
        room,
        academicYear: selectedYear || currentYear,
      };

      await onSave(payload);
      showToast('success', editingItem ? 'แก้ไขการมอบหมายสำเร็จ' : 'มอบหมายครูประจำชั้นสำเร็จ');
      setModalOpen(false);
    } catch {
      showToast('error', 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item: HomeroomAssignment) => {
    showConfirm(
      'ยืนยันการลบการมอบหมาย',
      `คุณต้องการยกเลิกการมอบหมาย "${item.teacherName}" ประจำชั้น ${item.className} ห้อง ${item.room} ใช่หรือไม่?`,
      async () => {
        try {
          await onDelete(item.id);
          showToast('success', 'ยกเลิกการมอบหมายเรียบร้อย');
        } catch {
          showToast('error', 'ไม่สามารถลบข้อมูลได้');
        }
      },
      true
    );
  };

  const handleDeleteAll = () => {
    showConfirm(
      'ยืนยันการลบการมอบหมายทั้งหมด!',
      'คำเตือน: คุณกำลังจะยกเลิกการมอบหมายครูประจำชั้นทั้งหมดในระบบ ข้อมูลนี้จะไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?',
      async () => {
        try {
          await onDeleteAll();
          showToast('success', 'ลบข้อมูลการมอบหมายครูประจำชั้นทั้งหมดเรียบร้อยแล้ว');
        } catch {
          showToast('error', 'ไม่สามารถลบข้อมูลได้');
        }
      },
      true
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#0C7C82]" />
            มอบหมายครูประจำชั้น (Homeroom Teachers)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดครูประจำชั้นให้กับห้องเรียนต่างๆ แสดง {itemsPerPage} รายการต่อหน้า
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] text-white font-semibold text-xs shadow-md shadow-teal-800/20 hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> มอบหมายครูประจำชั้น
          </button>

          {assignments.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="ลบข้อมูลการมอบหมายทั้งหมด"
            >
              <Trash2 className="w-4 h-4" /> ลบทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-20">ลำดับ</th>
                <th className="py-4 px-6">ชื่อครูผู้สอน / ครูประจำชั้น</th>
                <th className="py-4 px-6 text-center">ชั้นเรียนที่รับผิดชอบ</th>
                <th className="py-4 px-6 text-center">ห้อง</th>
                <th className="py-4 px-6 text-center">ปีการศึกษา</th>
                <th className="py-4 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    ยังไม่มีข้อมูลการมอบหมายครูประจำชั้น
                  </td>
                </tr>
              ) : (
                currentList.map((item, index) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 text-center text-slate-400 font-mono text-xs">
                        {globalIdx}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0C7C82] flex items-center justify-center font-bold text-xs">
                            {item.teacherName.charAt(0) || 'ค'}
                          </div>
                          <div>
                            <div>{item.teacherName}</div>
                            {item.teacherUsername && (
                              <div className="text-[11px] text-slate-400 font-mono font-normal">
                                @{item.teacherUsername}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-slate-700">
                        {item.className}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-100">
                          ห้อง {item.room}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-xs text-slate-600">
                        {item.academicYear}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (แสดงไม่เกิน 10 รายการ) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            แสดง {assignments.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} ถึง{' '}
            {Math.min(currentPage * itemsPerPage, assignments.length)} จากทั้งหมด{' '}
            <strong className="text-slate-800">{assignments.length}</strong> คน
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#0C7C82] text-white shadow-xs'
                    : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Add / Edit Assignment */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0C7C82]" />
                {editingItem ? 'แก้ไขการมอบหมาย' : 'มอบหมายครูประจำชั้นใหม่'}
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
                  เลือกครูผู้สอน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTeacherUsername}
                  onChange={e => setSelectedTeacherUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] outline-hidden bg-white"
                  required
                >
                  {teacherList.map(t => (
                    <option key={t.id} value={t.username}>
                      {t.fullName} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เลือกชั้นเรียนและห้อง <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] outline-hidden bg-white"
                  required
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={`${c.className}_${c.room}`}>
                      {c.className} ห้อง {c.room}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ปีการศึกษา
                </label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] outline-hidden bg-white font-mono"
                >
                  {academicYears.map(y => (
                    <option key={y.id} value={y.year}>
                      ปีการศึกษา {y.year} {y.isCurrent ? '(ปัจจุบัน)' : ''}
                    </option>
                  ))}
                </select>
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
