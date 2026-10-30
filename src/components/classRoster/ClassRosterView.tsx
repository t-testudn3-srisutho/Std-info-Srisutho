import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  Users,
  GraduationCap,
  Calendar,
  School,
  Sparkles,
} from 'lucide-react';
import { Student, Classroom, AcademicYear, HomeroomAssignment, SystemSetting } from '../../types';
import { exportClassRosterToExcel } from '../../utils/excel';
import { exportClassRosterToWord } from '../../utils/wordExport';

interface ClassRosterViewProps {
  students: Student[];
  classrooms: Classroom[];
  academicYears: AcademicYear[];
  assignments: HomeroomAssignment[];
  settings: SystemSetting;
  showToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
}

export const ClassRosterView: React.FC<ClassRosterViewProps> = ({
  students,
  classrooms,
  academicYears,
  assignments,
  settings,
  showToast,
}) => {
  // Default selected classroom
  const defaultClassroom = classrooms[0] ? `${classrooms[0].className}_${classrooms[0].room}` : '';
  const [selectedClassKey, setSelectedClassKey] = useState<string>(defaultClassroom);

  // Active academic year
  const currentYear = academicYears.find(y => y.isCurrent)?.year || '2567';

  // Parse selected classroom
  const [currentClass, currentRoom] = useMemo(() => {
    if (!selectedClassKey) return ['', ''];
    const parts = selectedClassKey.split('_');
    return [parts[0] || '', parts[1] || ''];
  }, [selectedClassKey]);

  // Find homeroom teacher for selected class
  const homeroomTeacher = useMemo(() => {
    const match = assignments.find(
      a => a.className === currentClass && a.room === currentRoom
    );
    return match ? match.teacherName : '...................................................';
  }, [assignments, currentClass, currentRoom]);

  // Filter students in this class and room
  const classStudents = useMemo(() => {
    if (!currentClass || !currentRoom) return [];
    return students
      .filter(s => s.classLevel === currentClass && s.room === currentRoom)
      .sort((a, b) => {
        return a.studentId.localeCompare(b.studentId, undefined, { numeric: true });
      });
  }, [students, currentClass, currentRoom]);

  // Gender counts
  const maleCount = useMemo(
    () => classStudents.filter(s => s.gender === 'ชาย' || s.gender === 'ช').length,
    [classStudents]
  );
  const femaleCount = useMemo(
    () => classStudents.filter(s => s.gender === 'หญิง' || s.gender === 'ญ').length,
    [classStudents]
  );

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (classStudents.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลนักเรียนในห้องที่เลือก');
      return;
    }
    exportClassRosterToExcel(classStudents, {
      schoolName: settings.schoolName || 'โรงเรียนศรีสุทโธ',
      classLevel: currentClass,
      room: currentRoom,
      academicYear: currentYear,
      teacherName: homeroomTeacher,
    });
    showToast('success', 'ส่งออกไฟล์ Excel เรียบร้อยแล้ว');
  };

  const handleExportWord = () => {
    if (classStudents.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลนักเรียนในห้องที่เลือก');
      return;
    }
    exportClassRosterToWord(classStudents, {
      schoolName: settings.schoolName || 'โรงเรียนศรีสุทโธ',
      affiliation: settings.affiliation || 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี',
      classLevel: currentClass,
      room: currentRoom,
      academicYear: currentYear,
      teacherName: homeroomTeacher,
    });
    showToast('success', 'ส่งออกไฟล์ Word (.doc) เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6 text-black">
      {/* Control & Filter Header (Hidden in Print) */}
      <div className="no-print bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0C7C82]" />
            บัญชีรายชื่อนักเรียนตามชั้น (Class Document Preview)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            พรีวิวเอกสารขนาด A4 แนวตั้ง (ขอบแคบ 1 ซม., ตัวอักษรสีดำขนาด 12pt, พอดีหน้ากระดาษ A4)
          </p>
        </div>

        {/* Classroom selector & Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Class Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <GraduationCap className="w-4 h-4 text-[#0C7C82]" />
            <select
              value={selectedClassKey}
              onChange={e => setSelectedClassKey(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
            >
              {classrooms.map(c => (
                <option key={c.id} value={`${c.className}_${c.room}`}>
                  {c.className} ห้อง {c.room}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="ส่งออกไฟล์ Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel</span>
          </button>

          <button
            onClick={handleExportWord}
            className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="ส่งออกไฟล์ Word"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span>ส่งออก Word</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] text-white text-xs font-semibold shadow-md shadow-teal-800/20 hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
            title="พิมพ์เอกสาร"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ (Print)</span>
          </button>
        </div>
      </div>

      {/* Document Sheet Preview: Standard A4 Portrait Paper Simulation (210mm x 297mm approx max-w-[210mm]) */}
      <div 
        className="bg-white rounded-2xl p-6 sm:p-8 border border-black/30 shadow-xl text-black mx-auto max-w-[210mm] overflow-hidden print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none" 
        style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '12pt', color: '#000' }}
      >
        {/* Document Official Header */}
        <div className="text-center pb-2 border-b border-black space-y-0.5">
          <div className="font-bold text-black leading-snug" style={{ fontSize: '14pt' }}>
            {settings.schoolName || 'โรงเรียนศรีสุทโธ'}
          </div>
          <div className="font-bold text-black mt-1" style={{ fontSize: '13pt' }}>
            บัญชีรายชื่อนักเรียน.............................................................
          </div>
          <div className="font-normal text-black mt-0.5 flex flex-wrap items-center justify-center gap-3" style={{ fontSize: '12pt' }}>
            <span>
              ชั้น: <strong className="font-bold text-black">{currentClass || '-'}</strong>
            </span>
            <span>
              ห้อง: <strong className="font-bold text-black">{currentRoom || '-'}</strong>
            </span>
            <span>
              ปีการศึกษา: <strong className="font-bold text-black">{currentYear}</strong>
            </span>
            <span>
              ครูประจำชั้น: <strong className="font-bold text-black">{homeroomTeacher}</strong>
            </span>
          </div>
          <div className="font-normal text-black" style={{ fontSize: '12pt' }}>
            จำนวนนักเรียนทั้งหมด: <strong className="font-bold text-black">{classStudents.length}</strong> คน (ชาย: <strong className="font-bold text-black">{maleCount}</strong> คน, หญิง: <strong className="font-bold text-black">{femaleCount}</strong> คน)
          </div>
        </div>

        {/* Document Table (10 Check Columns, 12pt Font, Non-bold data cells, Pure Black) */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse border border-black text-black" style={{ fontSize: '12pt', color: '#000' }}>
            <thead>
              <tr className="bg-slate-100 text-black font-bold text-center" style={{ fontSize: '12pt' }}>
                <th rowSpan={2} className="border border-black p-1 w-10 text-center text-black" style={{ fontSize: '12pt' }}>
                  ลำดับ
                </th>
                <th rowSpan={2} className="border border-black p-1 w-20 text-center text-black" style={{ fontSize: '12pt' }}>
                  รหัสนักเรียน
                </th>
                <th rowSpan={2} className="border border-black p-1 w-28 text-center text-black" style={{ fontSize: '12pt' }}>
                  เลขประจำตัวประชาชน
                </th>
                <th rowSpan={2} className="border border-black p-1 min-w-[140px] text-left text-black" style={{ fontSize: '12pt' }}>
                  ชื่อ - นามสกุล
                </th>
                {/* 10 equal width check columns without numbers */}
                {Array.from({ length: 10 }, (_, i) => (
                  <th key={i} className="border border-black p-0.5 w-5 min-w-[20px] bg-slate-50"></th>
                ))}
                <th rowSpan={2} className="border border-black p-1 w-20 text-center text-black" style={{ fontSize: '12pt' }}>
                  หมายเหตุ
                </th>
              </tr>
            </thead>
            <tbody>
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={15} className="border border-black p-6 text-center text-black" style={{ fontSize: '12pt' }}>
                    ไม่พบข้อมูลนักเรียนในชั้นเรียนนี้ (สามารถเพิ่มข้อมูลในเมนูเพิ่มนักเรียน)
                  </td>
                </tr>
              ) : (
                classStudents.map((s, idx) => (
                  <tr key={s.id} className="text-black" style={{ fontSize: '12pt' }}>
                    <td className="border border-black p-1 text-center font-normal text-black" style={{ fontSize: '12pt' }}>
                      {idx + 1}
                    </td>
                    <td className="border border-black p-1 text-center font-normal text-black" style={{ fontSize: '12pt' }}>
                      {s.studentId}
                    </td>
                    <td className="border border-black p-1 text-center font-normal text-black" style={{ fontSize: '12pt' }}>
                      {s.citizenId || '-'}
                    </td>
                    <td className="border border-black p-1 font-normal text-black whitespace-nowrap" style={{ fontSize: '12pt' }}>
                      {s.prefix}{s.firstName} {s.lastName}
                    </td>
                    {/* 10 Empty Equal Width Check Columns */}
                    {Array.from({ length: 10 }, (_, i) => (
                      <td key={i} className="border border-black p-0 h-6 w-5 min-w-[20px]"></td>
                    ))}
                    <td className="border border-black p-1 text-center font-normal text-black" style={{ fontSize: '12pt' }}>
                      {s.cannotDischarge ? 'ยังไม่จำหน่าย' : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
