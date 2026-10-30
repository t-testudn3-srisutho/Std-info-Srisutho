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
        // Sort by studentId or gender then name
        return a.studentId.localeCompare(b.studentId, undefined, { numeric: true });
      });
  }, [students, currentClass, currentRoom]);

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
    <div className="space-y-6">
      {/* Control & Filter Header (Hidden in Print) */}
      <div className="no-print bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0C7C82]" />
            บัญชีรายชื่อนักเรียนตามชั้น (Class Document Preview)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            เลือกชั้นเรียนเพื่อพรีวิวเอกสารทางการ พิมพ์ออกกระดาษ หรือส่งออก Excel และ Word
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

      {/* Document Sheet Preview: Standard A4 Landscape Paper Simulation */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-lg text-slate-800 mx-auto max-w-full overflow-hidden print:p-0 print:border-none print:shadow-none print:rounded-none">
        {/* Document Official Header */}
        <div className="text-center pb-4 border-b border-slate-300">
          <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {settings.schoolName || 'โรงเรียนศรีสุทโธ'}
          </div>
          <div className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {settings.affiliation || 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี'}
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 mt-2">
            แบบบันทึกผลการพัฒนาคุณภาพผู้เรียนและบัญชีรายชื่อนักเรียน
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-700 mt-1 flex flex-wrap items-center justify-center gap-4">
            <span>
              ชั้น: <strong className="font-bold text-slate-900">{currentClass || '-'}</strong>
            </span>
            <span>
              ห้อง: <strong className="font-bold text-slate-900">{currentRoom || '-'}</strong>
            </span>
            <span>
              ปีการศึกษา: <strong className="font-bold text-slate-900">{currentYear}</strong>
            </span>
            <span>
              ครูประจำชั้น: <strong className="font-bold text-slate-900">{homeroomTeacher}</strong>
            </span>
            <span>
              จำนวนนักเรียน: <strong className="font-bold text-[#0C7C82]">{classStudents.length}</strong> คน
            </span>
          </div>
        </div>

        {/* Document Table (15 Empty Columns for grading/attendance check) */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                <th rowSpan={2} className="border border-slate-400 p-2 w-12 text-center">
                  ลำดับ
                </th>
                <th rowSpan={2} className="border border-slate-400 p-2 w-24 text-center">
                  รหัสนักเรียน
                </th>
                <th rowSpan={2} className="border border-slate-400 p-2 w-32 text-center">
                  เลขประจำตัวประชาชน
                </th>
                <th rowSpan={2} className="border border-slate-400 p-2 min-w-[180px] text-left">
                  ชื่อ - นามสกุล
                </th>
                <th colSpan={15} className="border border-slate-400 p-1 text-center bg-slate-50 font-medium">
                  ช่องคะแนน / ตรวจสอบการเข้าเรียน (1 - 15)
                </th>
                <th rowSpan={2} className="border border-slate-400 p-2 w-24 text-center">
                  หมายเหตุ
                </th>
              </tr>
              <tr className="bg-slate-50 text-[10px] text-slate-600 font-bold">
                {Array.from({ length: 15 }, (_, i) => (
                  <th key={i} className="border border-slate-400 p-1 w-6 text-center">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={20} className="border border-slate-400 p-8 text-center text-slate-400 text-xs">
                    ไม่พบข้อมูลนักเรียนในชั้นเรียนนี้ (สามารถเพิ่มข้อมูลในเมนูเพิ่มนักเรียน)
                  </td>
                </tr>
              ) : (
                classStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="border border-slate-400 p-2 text-center font-mono font-medium">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-mono font-bold text-slate-800">
                      {s.studentId}
                    </td>
                    <td className="border border-slate-400 p-2 text-center font-mono text-[11px] text-slate-600">
                      {s.citizenId || '-'}
                    </td>
                    <td className="border border-slate-400 p-2 font-medium text-slate-800 whitespace-nowrap">
                      <span className="text-slate-500 mr-1">{s.prefix}</span>
                      {s.firstName} {s.lastName}
                    </td>
                    {/* 15 Empty Check Columns */}
                    {Array.from({ length: 15 }, (_, i) => (
                      <td key={i} className="border border-slate-400 p-1 h-7"></td>
                    ))}
                    <td className="border border-slate-400 p-2 text-center text-[10px] text-slate-500">
                      {s.cannotDischarge ? 'ยังไม่จำหน่าย' : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Document Official Signature Footer */}
        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-700">
          <div className="space-y-1 text-center sm:text-left">
            <div>พิมพ์เมื่อวันที่: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="text-[11px] text-slate-500">ระบบการจัดการฐานข้อมูลนักเรียน (SDS) &bull; {settings.schoolName}</div>
          </div>

          <div className="text-center sm:text-right space-y-2">
            <div>ลงชื่อ..................................................................ครูประจำชั้น</div>
            <div className="font-semibold">( {homeroomTeacher} )</div>
            <div className="text-[11px] text-slate-500">ตำแหน่ง ครูประจำชั้น {currentClass} ห้อง {currentRoom}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
