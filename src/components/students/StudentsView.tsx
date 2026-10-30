import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Heart,
  MapPin,
  Home,
  ShieldAlert,
  Car,
  Copy,
} from 'lucide-react';
import { Student, Classroom, SystemSetting } from '../../types';
import {
  exportStudentsToExcel,
  downloadStudentTemplate,
  parseStudentsFromExcel,
} from '../../utils/excel';

interface StudentsViewProps {
  students: Student[];
  classrooms: Classroom[];
  settings: SystemSetting;
  onSave: (student: Student) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onBatchSave: (students: Student[]) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    danger?: boolean
  ) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classrooms,
  settings,
  onSave,
  onDelete,
  onDeleteAll,
  onBatchSave,
  showToast,
  showConfirm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40; // Requirement: max 40 per page

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'info' | 'physical' | 'family' | 'parents' | 'address' | 'travel'>('info');
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Default Student with all 86 fields
  const defaultStudent: Student = {
    id: '',
    schoolId: settings.schoolId || '41010023',
    schoolName: settings.schoolName || 'โรงเรียนศรีสุทโธ',
    citizenId: '',
    classLevel: classrooms[0]?.className || 'มัธยมศึกษาปีที่ 1',
    room: classrooms[0]?.room || '1',
    studentId: '',
    gender: 'ชาย',
    prefix: 'เด็กชาย',
    firstName: '',
    lastName: '',
    firstNameEn: '',
    lastNameEn: '',
    birthDate: '2555-01-01',
    ageYears: 13,
    ageMonths: 0,
    bloodGroup: 'O',
    nationality: 'ไทย',
    ethnicity: 'ไทย',
    religion: 'พุทธ',

    olderBrothers: 0,
    youngerBrothers: 0,
    olderSisters: 0,
    youngerSisters: 0,
    childOrder: 1,
    birthOrder: 1,
    studyingSiblings: 0,
    maritalStatusParents: 'อยู่ด้วยกัน',

    fatherCitizenId: '',
    fatherPrefix: 'นาย',
    fatherFirstName: '',
    fatherLastName: '',
    fatherOccupation: '',
    fatherIncome: 0,
    fatherPhone: '',

    motherCitizenId: '',
    motherPrefix: 'นาง',
    motherFirstName: '',
    motherLastName: '',
    motherOccupation: '',
    motherIncome: 0,
    motherPhone: '',

    guardianRelation: 'บิดา',
    guardianCitizenId: '',
    guardianPrefix: 'นาย',
    guardianFirstName: '',
    guardianLastName: '',
    guardianOccupation: '',
    guardianIncome: 0,
    guardianPhone: '',

    regHouseCode: '',
    regHouseNo: '',
    regMoo: '',
    regStreet: '',
    regSubdistrict: '',
    regDistrict: '',
    regProvince: 'อุดรธานี',
    regZipcode: '',
    regPhone: '',

    currHouseCode: '',
    currHouseNo: '',
    currMoo: '',
    currStreet: '',
    currSubdistrict: '',
    currDistrict: '',
    currProvince: 'อุดรธานี',
    currZipcode: '',
    currPhone: '',

    weight: 45,
    height: 150,
    disadvantage: 'ไม่ด้อยโอกาส',
    isBoarding: 'ไป-กลับ',
    lackUniform: 'ไม่ขาดแคลน',
    lackStationery: 'ไม่ขาดแคลน',
    lackTextbook: 'ไม่ขาดแคลน',
    lackLunch: 'ไม่ขาดแคลน',
    disability: 'ไม่พิการ',

    distGravel: 0,
    distPaved: 0,
    distWater: 0,
    travelTime: 15,
    travelMethod: 'รถจักรยานยนต์',

    studentType: 'นักเรียนทั่วไป',
    gpa: 0,
    gpax: 0,
    birthProvince: 'อุดรธานี',
    branchSchoolId: '',
    branchSchoolName: '',
    cannotDischarge: false,
  };

  const [formData, setFormData] = useState<Student>(defaultStudent);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        (s.studentId && s.studentId.includes(searchTerm)) ||
        (s.citizenId && s.citizenId.includes(searchTerm)) ||
        (s.firstName && s.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.lastName && s.lastName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchClass =
        selectedClass === 'all' || `${s.classLevel}_${s.room}` === selectedClass;

      const matchGender =
        selectedGender === 'all' ||
        ((selectedGender === 'ชาย' || selectedGender === 'ช') && (s.gender === 'ชาย' || s.gender === 'ช')) ||
        ((selectedGender === 'หญิง' || selectedGender === 'ญ') && (s.gender === 'หญิง' || s.gender === 'ญ')) ||
        s.gender === selectedGender;

      return matchSearch && matchClass && matchGender;
    });
  }, [students, searchTerm, selectedClass, selectedGender]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const currentStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      ...defaultStudent,
      schoolId: settings.schoolId || '41010023',
      schoolName: settings.schoolName || 'โรงเรียนศรีสุทโธ',
      studentId: `5${String(Math.floor(1000 + Math.random() * 9000))}`,
      classLevel: classrooms[0]?.className || 'มัธยมศึกษาปีที่ 1',
      room: classrooms[0]?.room || '1',
    });
    setActiveFormTab('info');
    setModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingItem(student);
    setFormData({ ...student });
    setActiveFormTab('info');
    setModalOpen(true);
  };

  const handleFormChange = (field: keyof Student, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'gender') {
        if ((value === 'ช' || value === 'ชาย') && (prev.prefix === 'เด็กหญิง' || prev.prefix === 'นางสาว')) updated.prefix = 'เด็กชาย';
        if ((value === 'ญ' || value === 'หญิง') && (prev.prefix === 'เด็กชาย' || prev.prefix === 'นาย')) updated.prefix = 'เด็กหญิง';
      }
      return updated;
    });
  };

  // Helper: Copy registration address to current address
  const copyRegAddressToCurrent = () => {
    setFormData(prev => ({
      ...prev,
      currHouseCode: prev.regHouseCode,
      currHouseNo: prev.regHouseNo,
      currMoo: prev.regMoo,
      currStreet: prev.regStreet,
      currSubdistrict: prev.regSubdistrict,
      currDistrict: prev.regDistrict,
      currProvince: prev.regProvince,
      currZipcode: prev.regZipcode,
      currPhone: prev.regPhone,
    }));
    showToast('success', 'คัดลอกที่อยู่ตามทะเบียนบ้านมายังที่อยู่ปัจจุบันแล้ว');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId?.trim() || !formData.firstName?.trim() || !formData.lastName?.trim()) {
      showToast('warning', 'กรุณากรอกข้อมูลที่จำเป็น', 'รหัสนักเรียน, ชื่อ และนามสกุล');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Student = {
        ...formData,
        id: editingItem ? editingItem.id : `std_${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };

      await onSave(payload);
      showToast('success', editingItem ? 'แก้ไขข้อมูลนักเรียนสำเร็จ' : 'เพิ่มข้อมูลนักเรียนสำเร็จ', `${payload.prefix}${payload.firstName} ${payload.lastName}`);
      setModalOpen(false);
    } catch {
      showToast('error', 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (student: Student) => {
    showConfirm(
      'ยืนยันการลบนักเรียน',
      `คุณต้องการลบข้อมูลของ "${student.prefix}${student.firstName} ${student.lastName}" (รหัส ${student.studentId}) ใช่หรือไม่?`,
      async () => {
        try {
          await onDelete(student.id);
          showToast('success', 'ลบข้อมูลนักเรียนเรียบร้อย');
        } catch {
          showToast('error', 'ไม่สามารถลบข้อมูลได้');
        }
      },
      true
    );
  };

  const handleDeleteAll = () => {
    showConfirm(
      'ยืนยันการลบนักเรียนทั้งหมด!',
      'คำเตือน: คุณกำลังจะลบข้อมูลนักเรียนทั้งหมดในระบบ ข้อมูลนี้จะไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?',
      async () => {
        try {
          await onDeleteAll();
          showToast('success', 'ลบข้อมูลนักเรียนทั้งหมดเรียบร้อยแล้ว');
        } catch {
          showToast('error', 'ไม่สามารถลบข้อมูลได้');
        }
      },
      true
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsed = await parseStudentsFromExcel(
        file,
        settings.schoolId || '41010023',
        settings.schoolName || 'โรงเรียนศรีสุทโธ'
      );
      if (parsed.length === 0) {
        showToast('warning', 'ไม่พบข้อมูลนักเรียนในไฟล์ Excel', 'โปรดตรวจสอบชื่อหัวคอลัมน์ตามเทมเพลต');
      } else {
        await onBatchSave(parsed);
        showToast('success', `นำเข้านักเรียนสำเร็จ ${parsed.length} คน`, 'บันทึกลงฐานข้อมูล Firebase เรียบร้อย');
      }
    } catch {
      showToast('error', 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0C7C82]" />
            จัดการข้อมูลนักเรียน (Student Records)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ฐานข้อมูลนักเรียนแบบละเอียดตามมาตรฐาน สพฐ. (DMC) แสดง {itemsPerPage} รายการต่อหน้า
          </p>
        </div>

        {/* Buttons Group */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
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
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="ส่งออกไฟล์ Excel ทุกคอลัมน์"
          >
            <Download className="w-4 h-4" /> ส่งออก Excel ({filteredStudents.length})
          </button>

          <button
            onClick={downloadStudentTemplate}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
            title="ดาวน์โหลดเทมเพลต Excel ตามโครงสร้างคอลัมน์ใหม่"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> เทมเพลต Excel
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] text-white text-xs font-semibold shadow-md shadow-teal-800/20 hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> เพิ่มนักเรียนใหม่
          </button>

          {students.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium transition cursor-pointer flex items-center gap-1"
              title="ลบนักเรียนทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" /> ลบทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ค้นหาชื่อ, นามสกุล, รหัสนักเรียน, เลขประชาชน 13 หลัก..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedClass}
            onChange={e => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-hidden focus:border-[#0C7C82] w-full md:w-auto"
          >
            <option value="all">ทุกชั้นเรียนและห้อง</option>
            {classrooms.map(c => (
              <option key={c.id} value={`${c.className}_${c.room}`}>
                {c.className} ห้อง {c.room}
              </option>
            ))}
          </select>

          <select
            value={selectedGender}
            onChange={e => {
              setSelectedGender(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-hidden focus:border-[#0C7C82]"
          >
            <option value="all">ทุกเพศ</option>
            <option value="ชาย">ชาย</option>
            <option value="หญิง">หญิง</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-4 text-center w-16">ลำดับ</th>
                <th className="py-4 px-4 text-center w-24">รหัสนักเรียน</th>
                <th className="py-4 px-4">ชื่อ - นามสกุล</th>
                <th className="py-4 px-4 text-center">เพศ</th>
                <th className="py-4 px-4 text-center">ชั้น / ห้อง</th>
                <th className="py-4 px-4 text-center">อายุ</th>
                <th className="py-4 px-4 text-center">หมู่โลหิต</th>
                <th className="py-4 px-4">ผู้ปกครอง</th>
                <th className="py-4 px-4">ความด้อยโอกาส</th>
                <th className="py-4 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    ไม่พบข้อมูลนักเรียน สามารถเพิ่มใหม่หรือนำเข้าผ่าน Excel
                  </td>
                </tr>
              ) : (
                currentStudents.map((s, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const isFemale = s.gender === 'ญ' || s.gender === 'หญิง';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {globalIndex}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#0C7C82]">
                        {s.studentId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <span className="text-slate-500 font-normal mr-1">{s.prefix}</span>
                        {s.firstName} {s.lastName}
                        {s.firstNameEn && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({s.firstNameEn} {s.lastNameEn})
                          </span>
                        )}
                        {s.citizenId && (
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            บัตร: {s.citizenId}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                            isFemale
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-teal-50 text-teal-700 border border-teal-100'
                          }`}
                        >
                          {isFemale ? 'หญิง' : 'ชาย'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {s.classLevel} / {s.room}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {s.ageYears || 0} ปี {s.ageMonths ? `${s.ageMonths} ด.` : ''}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-600">
                        {s.bloodGroup || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 font-medium">
                          {s.guardianFirstName ? `${s.guardianPrefix || ''}${s.guardianFirstName} ${s.guardianLastName || ''}` : '-'}
                        </div>
                        {s.guardianPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            โทร: {s.guardianPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {s.disadvantage && s.disadvantage !== 'ไม่ด้อยโอกาส' ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[10px]">
                            {s.disadvantage}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                            title="แก้ไขข้อมูลนักเรียน"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination Bar (ไม่เกิน 40 รายการต่อหน้า) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            แสดง {filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} ถึง{' '}
            {Math.min(currentPage * itemsPerPage, filteredStudents.length)} จากทั้งหมด{' '}
            <strong className="text-slate-800">{filteredStudents.length}</strong> คน
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

      {/* Comprehensive Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-100 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-[#0C7C82]" />
                {editingItem ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มข้อมูลนักเรียนใหม่ (DMC/สพฐ.)'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0 bg-slate-50/50">
              {[
                { id: 'info', label: '1. ข้อมูลนักเรียนและการศึกษา', icon: User },
                { id: 'physical', label: '2. ร่างกายและสุขภาพ', icon: Heart },
                { id: 'family', label: '3. ครอบครัวและพี่น้อง', icon: Home },
                { id: 'parents', label: '4. บิดา มารดา ผู้ปกครอง', icon: Users },
                { id: 'address', label: '5. ที่อยู่ (ทะเบียน/ปัจจุบัน)', icon: MapPin },
                { id: 'travel', label: '6. สวัสดิการและการเดินทาง', icon: Car },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeFormTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id as any)}
                    className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 border-b-2 -mb-px whitespace-nowrap ${
                      isActive
                        ? 'border-[#0C7C82] text-[#0C7C82] bg-white shadow-2xs font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: STUDENT & SCHOOL INFO */}
              {activeFormTab === 'info' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">รหัสโรงเรียน</label>
                      <input
                        type="text"
                        value={formData.schoolId}
                        onChange={e => handleFormChange('schoolId', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อโรงเรียน</label>
                      <input
                        type="text"
                        value={formData.schoolName}
                        onChange={e => handleFormChange('schoolName', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        รหัสนักเรียน <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={e => handleFormChange('studentId', e.target.value)}
                        required
                        placeholder="เช่น 1001"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#0C7C82] outline-hidden font-mono font-bold text-[#0C7C82]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        เลขประจำตัวประชาชน (13 หลัก)
                      </label>
                      <input
                        type="text"
                        maxLength={13}
                        value={formData.citizenId}
                        onChange={e => handleFormChange('citizenId', e.target.value)}
                        placeholder="13 หลัก"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#0C7C82] outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ชั้น <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.classLevel}
                        onChange={e => handleFormChange('classLevel', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#0C7C82] outline-hidden bg-white"
                      >
                        {classrooms.length === 0 ? (
                          <>
                            <option value="มัธยมศึกษาปีที่ 1">มัธยมศึกษาปีที่ 1</option>
                            <option value="มัธยมศึกษาปีที่ 2">มัธยมศึกษาปีที่ 2</option>
                            <option value="มัธยมศึกษาปีที่ 3">มัธยมศึกษาปีที่ 3</option>
                            <option value="ประถมศึกษาปีที่ 1">ประถมศึกษาปีที่ 1</option>
                          </>
                        ) : (
                          Array.from(new Set(classrooms.map(c => c.className))).map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ห้อง <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.room}
                        onChange={e => handleFormChange('room', e.target.value)}
                        placeholder="เช่น 1 หรือ 2"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#0C7C82] outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        เพศ <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.gender === 'หญิง' || formData.gender === 'ญ' ? 'หญิง' : 'ชาย'}
                        onChange={e => handleFormChange('gender', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#0C7C82] outline-hidden bg-white"
                      >
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">คำนำหน้าชื่อ</label>
                      <input
                        type="text"
                        value={formData.prefix}
                        onChange={e => handleFormChange('prefix', e.target.value)}
                        placeholder="เด็กชาย / เด็กหญิง / นาย / นางสาว"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ชื่อ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={e => handleFormChange('firstName', e.target.value)}
                        required
                        placeholder="ชื่อภาษาไทย"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#0C7C82] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        นามสกุล <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={e => handleFormChange('lastName', e.target.value)}
                        required
                        placeholder="นามสกุลภาษาไทย"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#0C7C82] outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ชื่อ (อังกฤษ)</label>
                      <input
                        type="text"
                        value={formData.firstNameEn}
                        onChange={e => handleFormChange('firstNameEn', e.target.value)}
                        placeholder="เช่น Somchai"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">นามสกุล (อังกฤษ)</label>
                      <input
                        type="text"
                        value={formData.lastNameEn}
                        onChange={e => handleFormChange('lastNameEn', e.target.value)}
                        placeholder="เช่น Jaidee"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">วันเกิด</label>
                      <input
                        type="text"
                        value={formData.birthDate}
                        onChange={e => handleFormChange('birthDate', e.target.value)}
                        placeholder="เช่น 2555-05-14"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">อายุ (ปี)</label>
                      <input
                        type="number"
                        value={formData.ageYears}
                        onChange={e => handleFormChange('ageYears', parseInt(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">อายุ (เดือน)</label>
                      <input
                        type="number"
                        value={formData.ageMonths}
                        onChange={e => handleFormChange('ageMonths', parseInt(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">จังหวัดที่เกิด</label>
                      <input
                        type="text"
                        value={formData.birthProvince}
                        onChange={e => handleFormChange('birthProvince', e.target.value)}
                        placeholder="อุดรธานี"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ประเภทนักเรียน</label>
                      <input
                        type="text"
                        value={formData.studentType}
                        onChange={e => handleFormChange('studentType', e.target.value)}
                        placeholder="นักเรียนทั่วไป / ไป-กลับ"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">GPA</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpa}
                        onChange={e => handleFormChange('gpa', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">GPAX</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.gpax}
                        onChange={e => handleFormChange('gpax', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">รหัส/ชื่อโรงเรียนห้องสาขา</label>
                      <input
                        type="text"
                        value={formData.branchSchoolName}
                        onChange={e => handleFormChange('branchSchoolName', e.target.value)}
                        placeholder="(ถ้ามี)"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PHYSICAL & HEALTH */}
              {activeFormTab === 'physical' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">หมู่โลหิต</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={e => handleFormChange('bloodGroup', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden bg-white"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">สัญชาติ</label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={e => handleFormChange('nationality', e.target.value)}
                        placeholder="ไทย"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">เชื้อชาติ</label>
                      <input
                        type="text"
                        value={formData.ethnicity}
                        onChange={e => handleFormChange('ethnicity', e.target.value)}
                        placeholder="ไทย"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ศาสนา</label>
                      <input
                        type="text"
                        value={formData.religion}
                        onChange={e => handleFormChange('religion', e.target.value)}
                        placeholder="พุทธ"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">น้ำหนัก (กก.)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={e => handleFormChange('weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ส่วนสูง (ซม.)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.height}
                        onChange={e => handleFormChange('height', parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ความพิการ</label>
                      <select
                        value={formData.disability}
                        onChange={e => handleFormChange('disability', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden bg-white"
                      >
                        <option value="ไม่พิการ">ไม่พิการ</option>
                        <option value="การมองเห็น">ทางการเห็น</option>
                        <option value="การได้ยิน">ทางการได้ยิน</option>
                        <option value="สติปัญญา">ทางสติปัญญา</option>
                        <option value="ร่างกายหรือการเคลื่อนไหว">ทางร่างกายหรือการเคลื่อนไหว</option>
                        <option value="การเรียนรู้">ทางการเรียนรู้ (LD)</option>
                        <option value="ออทิสติก">ออทิสติก</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FAMILY & SIBLINGS */}
              {activeFormTab === 'family' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      สถานภาพสมรสของบิดามารดา
                    </label>
                    <select
                      value={formData.maritalStatusParents}
                      onChange={e => handleFormChange('maritalStatusParents', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden bg-white"
                    >
                      <option value="อยู่ด้วยกัน">อยู่ด้วยกัน</option>
                      <option value="แยกกันอยู่">แยกกันอยู่</option>
                      <option value="หย่าร้าง">หย่าร้าง</option>
                      <option value="บิดาถึงแก่กรรม">บิดาถึงแก่กรรม</option>
                      <option value="มารดาถึงแก่กรรม">มารดาถึงแก่กรรม</option>
                      <option value="ทั้งบิดาและมารดาถึงแก่กรรม">ทั้งบิดาและมารดาถึงแก่กรรม</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">จำนวนพี่ชาย (คน)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.olderBrothers}
                        onChange={e => handleFormChange('olderBrothers', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">จำนวนน้องชาย (คน)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.youngerBrothers}
                        onChange={e => handleFormChange('youngerBrothers', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">จำนวนพี่สาว (คน)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.olderSisters}
                        onChange={e => handleFormChange('olderSisters', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">จำนวนน้องสาว (คน)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.youngerSisters}
                        onChange={e => handleFormChange('youngerSisters', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">เป็นบุตรคนที่</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.childOrder}
                        onChange={e => handleFormChange('childOrder', parseInt(e.target.value) || 1)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">เป็นบุตร/ธิดาลำดับที่</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.birthOrder}
                        onChange={e => handleFormChange('birthOrder', parseInt(e.target.value) || 1)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">จำนวนพี่น้องที่ศึกษาอยู่ (คน)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.studyingSiblings}
                        onChange={e => handleFormChange('studyingSiblings', parseInt(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PARENTS & GUARDIAN */}
              {activeFormTab === 'parents' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  {/* Father */}
                  <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-3">
                    <div className="font-bold text-[#0C7C82] flex items-center gap-1.5">
                      <User className="w-4 h-4" /> ข้อมูลบิดา
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">เลขบัตรประชาชนบิดา</label>
                        <input
                          type="text"
                          maxLength={13}
                          value={formData.fatherCitizenId}
                          onChange={e => handleFormChange('fatherCitizenId', e.target.value)}
                          placeholder="13 หลัก"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">คำนำหน้าชื่อ</label>
                        <input
                          type="text"
                          value={formData.fatherPrefix}
                          onChange={e => handleFormChange('fatherPrefix', e.target.value)}
                          placeholder="นาย"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ชื่อบิดา</label>
                        <input
                          type="text"
                          value={formData.fatherFirstName}
                          onChange={e => handleFormChange('fatherFirstName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">นามสกุลบิดา</label>
                        <input
                          type="text"
                          value={formData.fatherLastName}
                          onChange={e => handleFormChange('fatherLastName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">อาชีพบิดา</label>
                        <input
                          type="text"
                          value={formData.fatherOccupation}
                          onChange={e => handleFormChange('fatherOccupation', e.target.value)}
                          placeholder="เช่น เกษตรกรรม / รับจ้าง"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">รายได้ต่อเดือน (บาท)</label>
                        <input
                          type="number"
                          value={formData.fatherIncome}
                          onChange={e => handleFormChange('fatherIncome', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">หมายเลขโทรศัพท์บิดา</label>
                        <input
                          type="text"
                          value={formData.fatherPhone}
                          onChange={e => handleFormChange('fatherPhone', e.target.value)}
                          placeholder="08X-XXXXXXX"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mother */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
                    <div className="font-bold text-rose-700 flex items-center gap-1.5">
                      <User className="w-4 h-4" /> ข้อมูลมารดา
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">เลขบัตรประชาชนมารดา</label>
                        <input
                          type="text"
                          maxLength={13}
                          value={formData.motherCitizenId}
                          onChange={e => handleFormChange('motherCitizenId', e.target.value)}
                          placeholder="13 หลัก"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">คำนำหน้าชื่อ</label>
                        <input
                          type="text"
                          value={formData.motherPrefix}
                          onChange={e => handleFormChange('motherPrefix', e.target.value)}
                          placeholder="นาง / นางสาว"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ชื่อมารดา</label>
                        <input
                          type="text"
                          value={formData.motherFirstName}
                          onChange={e => handleFormChange('motherFirstName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">นามสกุลมารดา</label>
                        <input
                          type="text"
                          value={formData.motherLastName}
                          onChange={e => handleFormChange('motherLastName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">อาชีพมารดา</label>
                        <input
                          type="text"
                          value={formData.motherOccupation}
                          onChange={e => handleFormChange('motherOccupation', e.target.value)}
                          placeholder="เช่น ค้าขาย / รับจ้าง"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">รายได้ต่อเดือน (บาท)</label>
                        <input
                          type="number"
                          value={formData.motherIncome}
                          onChange={e => handleFormChange('motherIncome', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">หมายเลขโทรศัพท์มารดา</label>
                        <input
                          type="text"
                          value={formData.motherPhone}
                          onChange={e => handleFormChange('motherPhone', e.target.value)}
                          placeholder="08X-XXXXXXX"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guardian */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
                    <div className="font-bold text-amber-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" /> ข้อมูลผู้ปกครอง
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ความเกี่ยวข้อง</label>
                        <input
                          type="text"
                          value={formData.guardianRelation}
                          onChange={e => handleFormChange('guardianRelation', e.target.value)}
                          placeholder="บิดา / มารดา / ปู่ / ย่า"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">เลขบัตรประชาชน</label>
                        <input
                          type="text"
                          maxLength={13}
                          value={formData.guardianCitizenId}
                          onChange={e => handleFormChange('guardianCitizenId', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">คำนำหน้าชื่อ</label>
                        <input
                          type="text"
                          value={formData.guardianPrefix}
                          onChange={e => handleFormChange('guardianPrefix', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ชื่อผู้ปกครอง</label>
                        <input
                          type="text"
                          value={formData.guardianFirstName}
                          onChange={e => handleFormChange('guardianFirstName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">นามสกุล</label>
                        <input
                          type="text"
                          value={formData.guardianLastName}
                          onChange={e => handleFormChange('guardianLastName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">อาชีพผู้ปกครอง</label>
                        <input
                          type="text"
                          value={formData.guardianOccupation}
                          onChange={e => handleFormChange('guardianOccupation', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">รายได้ต่อเดือน (บาท)</label>
                        <input
                          type="number"
                          value={formData.guardianIncome}
                          onChange={e => handleFormChange('guardianIncome', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">หมายเลขโทรศัพท์</label>
                        <input
                          type="text"
                          value={formData.guardianPhone}
                          onChange={e => handleFormChange('guardianPhone', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ADDRESS (REGISTRATION & CURRENT) */}
              {activeFormTab === 'address' && (
                <div className="space-y-5 animate-fade-in text-xs">
                  {/* Registration Address */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#0C7C82]" /> ข้อมูลที่อยู่ตามทะเบียนบ้าน
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">รหัสประจำบ้าน</label>
                        <input
                          type="text"
                          value={formData.regHouseCode}
                          onChange={e => handleFormChange('regHouseCode', e.target.value)}
                          placeholder="เช่น 4101-001234-5"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">เลขที่บ้าน</label>
                        <input
                          type="text"
                          value={formData.regHouseNo}
                          onChange={e => handleFormChange('regHouseNo', e.target.value)}
                          placeholder="เช่น 25/1"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">หมู่ที่</label>
                        <input
                          type="text"
                          value={formData.regMoo}
                          onChange={e => handleFormChange('regMoo', e.target.value)}
                          placeholder="เช่น 3"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ถนน</label>
                        <input
                          type="text"
                          value={formData.regStreet}
                          onChange={e => handleFormChange('regStreet', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ตำบล</label>
                        <input
                          type="text"
                          value={formData.regSubdistrict}
                          onChange={e => handleFormChange('regSubdistrict', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">อำเภอ</label>
                        <input
                          type="text"
                          value={formData.regDistrict}
                          onChange={e => handleFormChange('regDistrict', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">จังหวัด</label>
                        <input
                          type="text"
                          value={formData.regProvince}
                          onChange={e => handleFormChange('regProvince', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">รหัสไปรษณีย์</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={formData.regZipcode}
                          onChange={e => handleFormChange('regZipcode', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">หมายเลขโทรศัพท์</label>
                        <input
                          type="text"
                          value={formData.regPhone}
                          onChange={e => handleFormChange('regPhone', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Current Address */}
                  <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#0C7C82] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> ข้อมูลที่อยู่ปัจจุบัน
                      </div>
                      <button
                        type="button"
                        onClick={copyRegAddressToCurrent}
                        className="px-2.5 py-1 rounded-lg bg-teal-100/80 hover:bg-teal-200 text-[#0C7C82] text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" /> คัดลอกจากทะเบียนบ้าน
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">รหัสประจำบ้าน</label>
                        <input
                          type="text"
                          value={formData.currHouseCode}
                          onChange={e => handleFormChange('currHouseCode', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">เลขที่บ้าน</label>
                        <input
                          type="text"
                          value={formData.currHouseNo}
                          onChange={e => handleFormChange('currHouseNo', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">หมู่ที่</label>
                        <input
                          type="text"
                          value={formData.currMoo}
                          onChange={e => handleFormChange('currMoo', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ถนน</label>
                        <input
                          type="text"
                          value={formData.currStreet}
                          onChange={e => handleFormChange('currStreet', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ตำบล</label>
                        <input
                          type="text"
                          value={formData.currSubdistrict}
                          onChange={e => handleFormChange('currSubdistrict', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">อำเภอ</label>
                        <input
                          type="text"
                          value={formData.currDistrict}
                          onChange={e => handleFormChange('currDistrict', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">จังหวัด</label>
                        <input
                          type="text"
                          value={formData.currProvince}
                          onChange={e => handleFormChange('currProvince', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">รหัสไปรษณีย์</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={formData.currZipcode}
                          onChange={e => handleFormChange('currZipcode', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">หมายเลขโทรศัพท์</label>
                        <input
                          type="text"
                          value={formData.currPhone}
                          onChange={e => handleFormChange('currPhone', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-hidden bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: WELFARE & TRAVEL */}
              {activeFormTab === 'travel' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ความด้อยโอกาส</label>
                      <select
                        value={formData.disadvantage}
                        onChange={e => handleFormChange('disadvantage', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden bg-white"
                      >
                        <option value="ไม่ด้อยโอกาส">ไม่ด้อยโอกาส</option>
                        <option value="ยากจน">ยากจน</option>
                        <option value="ยากจนพิเศษ">ยากจนพิเศษ (กสศ.)</option>
                        <option value="เด็กกำพร้า">เด็กกำพร้า</option>
                        <option value="ถูกทอดทิ้ง/ไม่มีผู้ดูแล">ถูกทอดทิ้ง/ไม่มีผู้ดูแล</option>
                        <option value="ชนกลุ่มน้อย">ชนกลุ่มน้อย</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">การพักนอนประจำ</label>
                      <select
                        value={formData.isBoarding}
                        onChange={e => handleFormChange('isBoarding', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-hidden bg-white"
                      >
                        <option value="ไป-กลับ">ไป-กลับ</option>
                        <option value="พักนอนประจำ">พักนอนประจำ</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                    <div className="font-bold text-amber-900">สถานะความขาดแคลนด้านต่างๆ</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ขาดแคลนเครื่องแบบ</label>
                        <select
                          value={formData.lackUniform}
                          onChange={e => handleFormChange('lackUniform', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="ไม่ขาดแคลน">ไม่ขาดแคลน</option>
                          <option value="ขาดแคลน">ขาดแคลน</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ขาดแคลนเครื่องเขียน</label>
                        <select
                          value={formData.lackStationery}
                          onChange={e => handleFormChange('lackStationery', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="ไม่ขาดแคลน">ไม่ขาดแคลน</option>
                          <option value="ขาดแคลน">ขาดแคลน</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ขาดแคลนแบบเรียน</label>
                        <select
                          value={formData.lackTextbook}
                          onChange={e => handleFormChange('lackTextbook', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="ไม่ขาดแคลน">ไม่ขาดแคลน</option>
                          <option value="ขาดแคลน">ขาดแคลน</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ขาดแคลนอาหารกลางวัน</label>
                        <select
                          value={formData.lackLunch}
                          onChange={e => handleFormChange('lackLunch', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="ไม่ขาดแคลน">ไม่ขาดแคลน</option>
                          <option value="ขาดแคลน">ขาดแคลน</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
                    <div className="font-bold text-sky-900">การเดินทางจากบ้านถึงโรงเรียน</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ระยะทางถนนลูกรัง (กม.)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.distGravel}
                          onChange={e => handleFormChange('distGravel', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ระยะทางถนนลาดยาง (กม.)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.distPaved}
                          onChange={e => handleFormChange('distPaved', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ระยะทางทางน้ำ (กม.)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.distWater}
                          onChange={e => handleFormChange('distWater', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ระยะเวลาเดินทาง (นาที)</label>
                        <input
                          type="number"
                          value={formData.travelTime}
                          onChange={e => handleFormChange('travelTime', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">ลักษณะการเดินทางมาโรงเรียน</label>
                        <input
                          type="text"
                          value={formData.travelMethod}
                          onChange={e => handleFormChange('travelMethod', e.target.value)}
                          placeholder="เช่น เดินเท้า / รถจักรยานยนต์ / รถรับส่งนักเรียน"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0">
                <div className="text-xs text-slate-400">
                  {editingItem ? `กำลังแก้ไขรหัส ${formData.studentId}` : 'นักเรียนใหม่'}
                </div>

                <div className="flex items-center gap-2">
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
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
