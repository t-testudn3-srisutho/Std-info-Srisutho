import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  X,
  Users,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Classroom, Student } from '../../types';
import {
  exportClassroomsToExcel,
  downloadClassroomTemplate,
  parseClassroomsFromExcel,
} from '../../utils/excel';

export function getGradeOrder(name: string): number {
  if (!name) return 999;
  const n = name.trim();
  if (n.includes('อนุบาล 1') || n.includes('อ.1')) return 1;
  if (n.includes('อนุบาล 2') || n.includes('อ.2')) return 2;
  if (n.includes('อนุบาล 3') || n.includes('อ.3')) return 3;
  if (n.includes('ประถมศึกษาปีที่ 1') || n.includes('ป.1')) return 11;
  if (n.includes('ประถมศึกษาปีที่ 2') || n.includes('ป.2')) return 12;
  if (n.includes('ประถมศึกษาปีที่ 3') || n.includes('ป.3')) return 13;
  if (n.includes('ประถมศึกษาปีที่ 4') || n.includes('ป.4')) return 14;
  if (n.includes('ประถมศึกษาปีที่ 5') || n.includes('ป.5')) return 15;
  if (n.includes('ประถมศึกษาปีที่ 6') || n.includes('ป.6')) return 16;
  if (n.includes('มัธยมศึกษาปีที่ 1') || n.includes('ม.1')) return 21;
  if (n.includes('มัธยมศึกษาปีที่ 2') || n.includes('ม.2')) return 22;
  if (n.includes('มัธยมศึกษาปีที่ 3') || n.includes('ม.3')) return 23;
  if (n.includes('มัธยมศึกษาปีที่ 4') || n.includes('ม.4')) return 24;
  if (n.includes('มัธยมศึกษาปีที่ 5') || n.includes('ม.5')) return 25;
  if (n.includes('มัธยมศึกษาปีที่ 6') || n.includes('ม.6')) return 26;
  return 50;
}

export function compareClassrooms(
  a: { className: string; room: string },
  b: { className: string; room: string }
): number {
  const orderA = getGradeOrder(a.className);
  const orderB = getGradeOrder(b.className);
  if (orderA !== orderB) return orderA - orderB;
  const cmp = a.className.localeCompare(b.className, 'th');
  if (cmp !== 0) return cmp;
  const numA = parseInt(a.room, 10);
  const numB = parseInt(b.room, 10);
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
  return a.room.localeCompare(b.room, 'th');
}

interface ClassroomsViewProps {
  classrooms: Classroom[];
  students: Student[];
  onSave: (classroom: Classroom) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onBatchSave: (classrooms: Classroom[]) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    danger?: boolean
  ) => void;
}

export const ClassroomsView: React.FC<ClassroomsViewProps> = ({
  classrooms,
  students,
  onSave,
  onDelete,
  onDeleteAll,
  onBatchSave,
  showToast,
  showConfirm,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Classroom | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [orderSeqInput, setOrderSeqInput] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Calculate student statistics grouped by (className, room)
  const studentStatsMap = useMemo(() => {
    const map = new Map<string, { male: number; female: number; total: number }>();
    students.forEach(s => {
      const c = (s.classLevel || '').trim();
      const r = (s.room || '').trim();
      if (!c || !r) return;
      const key = `${c}_${r}`;
      const isFemale = s.gender === 'ญ' || s.gender === 'หญิง';
      const existing = map.get(key) || { male: 0, female: 0, total: 0 };
      existing.total += 1;
      if (isFemale) existing.female += 1;
      else existing.male += 1;
      map.set(key, existing);
    });
    return map;
  }, [students]);

  // 2. Extract distinct classrooms directly from student records
  const extractedClassroomsFromStudents = useMemo<Classroom[]>(() => {
    const list: Classroom[] = [];
    studentStatsMap.forEach((_, key) => {
      const [className, room] = key.split('_');
      list.push({
        id: `extracted_${key}`,
        className,
        room,
        orderSeq: 0,
      });
    });

    list.sort(compareClassrooms);
    return list.map((item, idx) => ({
      ...item,
      orderSeq: idx + 1,
    }));
  }, [studentStatsMap]);

  // 3. Combined/Active list of classrooms to display
  // Prioritizes pulling classrooms from students and merges with any manually created ones
  const displayClassrooms = useMemo(() => {
    const map = new Map<string, Classroom>();

    // If stored classrooms is empty, directly display the extracted classrooms from students
    if (classrooms.length === 0) {
      return extractedClassroomsFromStudents;
    }

    // Otherwise, add stored classrooms
    classrooms.forEach(c => {
      const key = `${c.className.trim()}_${c.room.trim()}`;
      map.set(key, c);
    });

    // Also include any classrooms found in students that are not yet stored
    extractedClassroomsFromStudents.forEach(ext => {
      const key = `${ext.className}_${ext.room}`;
      if (!map.has(key)) {
        map.set(key, ext);
      }
    });

    const combined = Array.from(map.values());
    combined.sort((a, b) => {
      if (a.orderSeq && b.orderSeq && a.orderSeq !== b.orderSeq) {
        return a.orderSeq - b.orderSeq;
      }
      return compareClassrooms(a, b);
    });
    return combined;
  }, [classrooms, extractedClassroomsFromStudents]);

  // Sync classrooms extracted from student records into the database
  const handleSyncFromStudents = async () => {
    if (extractedClassroomsFromStudents.length === 0) {
      showToast('warning', 'ไม่พบข้อมูลชั้นเรียนในฐานข้อมูลนักเรียน', 'โปรดเพิ่มหรือนำเข้าข้อมูลนักเรียนก่อนดำเนินการ');
      return;
    }

    setIsSyncing(true);
    try {
      const itemsToSave: Classroom[] = extractedClassroomsFromStudents.map((ext, idx) => ({
        id: `c_${Date.now()}_${idx}`,
        className: ext.className,
        room: ext.room,
        orderSeq: idx + 1,
      }));

      await onBatchSave(itemsToSave);
      showToast(
        'success',
        'ดึงข้อมูลชั้นเรียนจากนักเรียนสำเร็จ',
        `ดึงข้อมูลและบันทึกชั้นเรียน ${itemsToSave.length} ห้องเรียน พร้อมจัดลำดับอัตโนมัติ`
      );
    } catch {
      showToast('error', 'ไม่สามารถบันทึกชั้นเรียนที่ดึงมาได้');
    } finally {
      setIsSyncing(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setClassNameInput('มัธยมศึกษาปีที่ 1');
    setRoomInput('1');
    setOrderSeqInput(displayClassrooms.length + 1);
    setModalOpen(true);
  };

  const openEditModal = (item: Classroom) => {
    setEditingItem(item);
    setClassNameInput(item.className);
    setRoomInput(item.room);
    setOrderSeqInput(item.orderSeq);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim() || !roomInput.trim()) {
      showToast('warning', 'กรุณากรอกชื่อชั้นเรียนและห้อง');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Classroom = {
        id: editingItem && !editingItem.id.startsWith('extracted_') ? editingItem.id : `c_${Date.now()}`,
        className: classNameInput.trim(),
        room: roomInput.trim(),
        orderSeq: Number(orderSeqInput) || displayClassrooms.length + 1,
      };

      await onSave(payload);
      showToast('success', editingItem ? 'แก้ไขชั้นเรียนสำเร็จ' : 'เพิ่มชั้นเรียนสำเร็จ');
      setModalOpen(false);
    } catch {
      showToast('error', 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item: Classroom) => {
    showConfirm(
      'ยืนยันการลบชั้นเรียน',
      `คุณต้องการลบห้อง "${item.className} ห้อง ${item.room}" ใช่หรือไม่?`,
      async () => {
        try {
          if (!item.id.startsWith('extracted_')) {
            await onDelete(item.id);
          }
          showToast('success', 'ลบชั้นเรียนเรียบร้อย');
        } catch {
          showToast('error', 'ไม่สามารถลบข้อมูลได้');
        }
      },
      true
    );
  };

  const handleDeleteAll = () => {
    showConfirm(
      'ยืนยันการลบชั้นเรียนทั้งหมด!',
      'คำเตือน: คุณกำลังจะลบรายการชั้นเรียนทั้งหมดในระบบ ข้อมูลนี้จะไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?',
      async () => {
        try {
          await onDeleteAll();
          showToast('success', 'ลบข้อมูลชั้นเรียนทั้งหมดเรียบร้อยแล้ว');
        } catch {
          showToast('error', 'ไม่สามารถลบข้อมูลได้');
        }
      },
      true
    );
  };

  // Move sequence up / down
  const handleMoveOrder = async (item: Classroom, direction: 'up' | 'down') => {
    const sorted = [...displayClassrooms].sort((a, b) => a.orderSeq - b.orderSeq);
    const currentIndex = sorted.findIndex(
      c => c.id === item.id || (c.className === item.className && c.room === item.room)
    );
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetItem = sorted[targetIndex];
    const tempSeq = item.orderSeq || currentIndex + 1;
    const targetSeq = targetItem.orderSeq || targetIndex + 1;

    const updatedItem: Classroom = {
      ...item,
      id: item.id.startsWith('extracted_') ? `c_${Date.now()}_1` : item.id,
      orderSeq: targetSeq,
    };
    const updatedTarget: Classroom = {
      ...targetItem,
      id: targetItem.id.startsWith('extracted_') ? `c_${Date.now()}_2` : targetItem.id,
      orderSeq: tempSeq,
    };

    try {
      await onSave(updatedItem);
      await onSave(updatedTarget);
      showToast('success', 'ปรับเปลี่ยนลำดับเรียบร้อย');
    } catch {
      showToast('error', 'ไม่สามารถเปลี่ยนลำดับได้');
    }
  };

  // Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsed = await parseClassroomsFromExcel(file);
      if (parsed.length === 0) {
        showToast('warning', 'ไม่พบข้อมูลชั้นเรียนในไฟล์ Excel', 'โปรดตรวจสอบชื่อคอลัมน์ตามเทมเพลต');
      } else {
        await onBatchSave(parsed as Classroom[]);
        showToast('success', `นำเข้าชั้นเรียนสำเร็จ ${parsed.length} รายการ`, 'รองรับภาษาไทย UTF-8');
      }
    } catch {
      showToast('error', 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Informational Banner: Displaying Classrooms Derived From Students */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-sky-50 rounded-3xl p-5 sm:p-6 border border-teal-100/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0C7C82] to-[#35B4B0] text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-700/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              ดึงข้อมูลชั้นเรียนจากฐานข้อมูลนักเรียน
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-100/70 text-teal-800 border border-teal-200">
                <CheckCircle2 className="w-3 h-3 text-teal-600" /> อัตโนมัติ
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              ระบบตรวจพบชั้นเรียนที่มีนักเรียนจริงทั้งหมด{' '}
              <strong className="text-[#0C7C82] font-bold">{extractedClassroomsFromStudents.length} ห้องเรียน</strong> จากนักเรียน{' '}
              <strong className="text-[#0C7C82] font-bold">{students.length} คน</strong>{' '}
              พร้อมสรุปยอดนักเรียนชาย-หญิงประจำแต่ละห้อง
            </p>
          </div>
        </div>

        {extractedClassroomsFromStudents.length > 0 && (
          <button
            onClick={handleSyncFromStudents}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] text-white text-xs font-semibold shadow-md shadow-teal-800/20 hover:opacity-95 transition cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
            title="บันทึกชั้นเรียนที่ดึงมาจากนักเรียนลงฐานข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังบันทึกลงฐานข้อมูล...' : 'บันทึกซิงค์ลงฐานข้อมูล'}</span>
          </button>
        )}
      </div>

      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#0C7C82]" />
            จัดการชั้นเรียน (Classroom Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            แสดงชั้นเรียนทั้งหมด {displayClassrooms.length} ห้องเรียน พร้อมสถิติจำนวนนักเรียนในแต่ละชั้น
          </p>
        </div>

        {/* Buttons Group */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <label className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0C7C82] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-teal-200">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'กำลังนำเข้า...' : 'นำเข้า Excel'}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => exportClassroomsToExcel(displayClassrooms)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="ส่งออกไฟล์ Excel"
          >
            <Download className="w-4 h-4" /> ส่งออก Excel
          </button>

          <button
            onClick={downloadClassroomTemplate}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
            title="ดาวน์โหลดเทมเพลต Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> เทมเพลต
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] text-white text-xs font-semibold shadow-md shadow-teal-800/20 hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> เพิ่มชั้นเรียน
          </button>

          {displayClassrooms.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium transition cursor-pointer flex items-center gap-1"
              title="ลบข้อมูลทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" /> ลบทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Classroom Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-20">ลำดับที่</th>
                <th className="py-4 px-6">ชื่อชั้นเรียน</th>
                <th className="py-4 px-6 text-center w-28">ห้อง</th>
                <th className="py-4 px-6 text-center">จำนวนนักเรียนในห้อง</th>
                <th className="py-4 px-6 text-center">แหล่งข้อมูล</th>
                <th className="py-4 px-6 text-center w-24">ปรับลำดับ</th>
                <th className="py-4 px-6 text-right w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {displayClassrooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600 text-sm">ยังไม่มีข้อมูลชั้นเรียนในระบบ</p>
                      <p className="text-xs text-slate-400">
                        เมื่อคุณเพิ่มหรือนำเข้าข้อมูลนักเรียน ระบบจะดึงชั้นเรียนและห้องมาแสดงที่นี่โดยอัตโนมัติ
                        หรือสามารถกดปุ่ม "เพิ่มชั้นเรียน" ได้ทันที
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayClassrooms.map((item, index, arr) => {
                  const key = `${item.className.trim()}_${item.room.trim()}`;
                  const stats = studentStatsMap.get(key) || { male: 0, female: 0, total: 0 };
                  const isFromStudents = Boolean(studentStatsMap.has(key));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-bold">
                          {item.orderSeq || index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {item.className}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-100">
                          ห้อง {item.room}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {stats.total > 0 ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 text-xs">
                            <Users className="w-3.5 h-3.5 text-[#0C7C82]" />
                            <span className="font-bold text-slate-800">{stats.total} คน</span>
                            <span className="text-[11px] text-slate-400">|</span>
                            <span className="text-[11px] text-teal-700 font-medium">ชาย: {stats.male}</span>
                            <span className="text-[11px] text-rose-600 font-medium">หญิง: {stats.female}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">ไม่มีนักเรียนในห้องนี้</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isFromStudents ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            <Sparkles className="w-3 h-3 text-emerald-500" /> ข้อมูลนักเรียน
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            สร้างในระบบ
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(item, 'up')}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="เลื่อนขึ้น"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === arr.length - 1}
                            onClick={() => handleMoveOrder(item, 'down')}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="เลื่อนลง"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Classroom */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#0C7C82]" />
                {editingItem ? 'แก้ไขชั้นเรียน' : 'เพิ่มชั้นเรียนใหม่'}
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
                  ชื่อชั้นเรียน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={classNameInput}
                  onChange={e => setClassNameInput(e.target.value)}
                  placeholder="เช่น มัธยมศึกษาปีที่ 1 หรือ ประถมศึกษาปีที่ 1"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ห้อง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomInput}
                    onChange={e => setRoomInput(e.target.value)}
                    placeholder="เช่น 1 หรือ 2"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ลำดับที่ (Order)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={orderSeqInput}
                    onChange={e => setOrderSeqInput(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
                  />
                </div>
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
