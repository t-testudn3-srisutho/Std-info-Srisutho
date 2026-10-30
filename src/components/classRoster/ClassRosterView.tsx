import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  GraduationCap,
  SlidersHorizontal,
} from 'lucide-react';
import { Student, Classroom, AcademicYear, HomeroomAssignment, SystemSetting } from '../../types';
import { exportClassRosterToExcel } from '../../utils/excel';
import { exportClassRosterToWord, formatThaiBirthDate } from '../../utils/wordExport';

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

  // Column Customization Options
  // Default: 1 blank column, and only "ชื่อนักเรียน" (showFullName)
  const [blankColCount, setBlankColCount] = useState<number>(1);
  const [showStudentId, setShowStudentId] = useState<boolean>(false);
  const [showCitizenId, setShowCitizenId] = useState<boolean>(false);
  const [showFullName, setShowFullName] = useState<boolean>(true);
  const [showBirthDate, setShowBirthDate] = useState<boolean>(false);
  const [showGuardianName, setShowGuardianName] = useState<boolean>(false);
  const [showGuardianCitizenId, setShowGuardianCitizenId] = useState<boolean>(false);

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

  // Total dynamic column count for empty table colSpan
  const totalColSpan = useMemo(() => {
    let count = 1; // ลำดับ
    if (showStudentId) count++;
    if (showCitizenId) count++;
    if (showFullName) count++;
    if (showBirthDate) count++;
    if (showGuardianName) count++;
    if (showGuardianCitizenId) count++;
    count += blankColCount; // blank check columns
    count++; // หมายเหตุ
    return count;
  }, [showStudentId, showCitizenId, showFullName, showBirthDate, showGuardianName, showGuardianCitizenId, blankColCount]);

  // Dynamic scaling based on student row count and active columns to fit A4 page perfectly
  const tableScale = useMemo(() => {
    const rowCount = classStudents.length;

    let fontSizeNum = 14;
    let headerFontSizeNum = 14;
    let titleFontSizeNum = 14;
    let subTitleFontSizeNum = 13;
    let headerInfoFontSizeNum = 12;
    let cellPaddingY = 'py-1';
    let cellPaddingX = 'px-1.5';
    let rowHeightClass = 'h-7';

    // Vertical Scaling based on row count
    if (rowCount > 40) {
      fontSizeNum = 9.5;
      headerFontSizeNum = 10;
      titleFontSizeNum = 12;
      subTitleFontSizeNum = 11;
      headerInfoFontSizeNum = 10;
      cellPaddingY = 'py-0.5';
      cellPaddingX = 'px-0.5';
      rowHeightClass = 'h-4.5';
    } else if (rowCount > 32) {
      fontSizeNum = 10.5;
      headerFontSizeNum = 11;
      titleFontSizeNum = 12.5;
      subTitleFontSizeNum = 11.5;
      headerInfoFontSizeNum = 10.5;
      cellPaddingY = 'py-0.5';
      cellPaddingX = 'px-1';
      rowHeightClass = 'h-5';
    } else if (rowCount > 24) {
      fontSizeNum = 11.5;
      headerFontSizeNum = 12;
      titleFontSizeNum = 13;
      subTitleFontSizeNum = 12;
      headerInfoFontSizeNum = 11.5;
      cellPaddingY = 'py-0.5';
      cellPaddingX = 'px-1';
      rowHeightClass = 'h-5.5';
    } else if (rowCount > 18) {
      fontSizeNum = 12.5;
      headerFontSizeNum = 13;
      titleFontSizeNum = 13.5;
      subTitleFontSizeNum = 12.5;
      headerInfoFontSizeNum = 12;
      cellPaddingY = 'py-1';
      cellPaddingX = 'px-1.5';
      rowHeightClass = 'h-6';
    }

    // Horizontal Scaling if many columns are enabled
    if (totalColSpan > 14) {
      fontSizeNum = Math.min(fontSizeNum, 10);
      headerFontSizeNum = Math.min(headerFontSizeNum, 10);
      cellPaddingX = 'px-0.5';
    } else if (totalColSpan > 10) {
      fontSizeNum = Math.min(fontSizeNum, 11.5);
      headerFontSizeNum = Math.min(headerFontSizeNum, 11.5);
      cellPaddingX = 'px-1';
    }

    return {
      fontSize: `${fontSizeNum}pt`,
      headerFontSize: `${headerFontSizeNum}pt`,
      titleFontSize: `${titleFontSizeNum}pt`,
      subTitleFontSize: `${subTitleFontSizeNum}pt`,
      headerInfoFontSize: `${headerInfoFontSizeNum}pt`,
      cellPaddingY,
      cellPaddingX,
      rowHeightClass,
      fontSizeNum,
    };
  }, [classStudents.length, totalColSpan]);

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
      affiliation: settings.affiliation || '',
      classLevel: currentClass,
      room: currentRoom,
      academicYear: currentYear,
      teacherName: homeroomTeacher,
      blankColCount,
      showStudentId,
      showCitizenId,
      showFullName,
      showBirthDate,
      showGuardianName,
      showGuardianCitizenId,
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
      affiliation: settings.affiliation || '',
      classLevel: currentClass,
      room: currentRoom,
      academicYear: currentYear,
      teacherName: homeroomTeacher,
      blankColCount,
      showStudentId,
      showCitizenId,
      showFullName,
      showBirthDate,
      showGuardianName,
      showGuardianCitizenId,
      fontSize: tableScale.fontSize,
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

      {/* Configuration Panel for Columns & Check Columns (Hidden in Print) */}
      <div className="no-print bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0C7C82]" />
          <span>ตั้งค่าการแสดงผลคอลัมน์ในตารางและช่องว่างเช็คชื่อ:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Blank Check Columns Checkbox Selection */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <label className="font-bold text-slate-700 block">
              จำนวนช่องว่างสำหรับเช็คชื่อ (ช่องเปล่า):
            </label>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {[1, 5, 10, 15].map(num => (
                <label key={num} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={blankColCount === num}
                    onChange={() => setBlankColCount(num)}
                    className="rounded accent-[#0C7C82] w-4 h-4 cursor-pointer"
                  />
                  <span>{num} ช่อง</span>
                </label>
              ))}
            </div>
          </div>

          {/* Student Data Checkboxes */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <label className="font-bold text-slate-700 block">ข้อมูลนักเรียนและผู้ปกครอง:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={showStudentId}
                  onChange={e => setShowStudentId(e.target.checked)}
                  className="rounded accent-[#0C7C82] w-4 h-4 cursor-pointer"
                />
                <span>รหัสนักเรียน</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={showCitizenId}
                  onChange={e => setShowCitizenId(e.target.checked)}
                  className="rounded accent-[#0C7C82] w-4 h-4 cursor-pointer"
                />
                <span>เลขประชาชน</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={showFullName}
                  onChange={e => setShowFullName(e.target.checked)}
                  className="rounded accent-[#0C7C82] w-4 h-4 cursor-pointer"
                />
                <span>ชื่อนักเรียน</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={showBirthDate}
                  onChange={e => setShowBirthDate(e.target.checked)}
                  className="rounded accent-[#0C7C82] w-4 h-4 cursor-pointer"
                />
                <span>วันเกิด</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={showGuardianName}
                  onChange={e => setShowGuardianName(e.target.checked)}
                  className="rounded accent-[#0C7C82] w-4 h-4 cursor-pointer"
                />
                <span>ชื่อผู้ปกครอง</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={showGuardianCitizenId}
                  onChange={e => setShowGuardianCitizenId(e.target.checked)}
                  className="rounded accent-[#0C7C82] w-4 h-4 cursor-pointer"
                />
                <span>เลขประชาชนผู้ปกครอง</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Document Sheet Preview: Standard A4 Portrait Paper Simulation */}
      <div 
        className="bg-white rounded-2xl p-6 sm:p-8 border border-black/30 shadow-xl text-black mx-auto max-w-[210mm] overflow-hidden print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none" 
        style={{ fontFamily: 'Sarabun, sans-serif', fontSize: tableScale.fontSize, color: '#000' }}
      >
        {/* Document Official Header */}
        <div className="text-center pb-2 border-b border-black space-y-0.5">
          <div className="font-bold text-black leading-snug" style={{ fontSize: tableScale.titleFontSize }}>
            {settings.schoolName || 'โรงเรียนศรีสุทโธ'}
          </div>
          <div className="font-bold text-black mt-1" style={{ fontSize: tableScale.subTitleFontSize }}>
            บัญชีรายชื่อนักเรียน.............................................................
          </div>
          <div className="font-normal text-black mt-0.5 flex flex-wrap items-center justify-center gap-3" style={{ fontSize: tableScale.headerInfoFontSize }}>
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
          <div className="font-normal text-black" style={{ fontSize: tableScale.headerInfoFontSize }}>
            จำนวนนักเรียนทั้งหมด: <strong className="font-bold text-black">{classStudents.length}</strong> คน (ชาย: <strong className="font-bold text-black">{maleCount}</strong> คน, หญิง: <strong className="font-bold text-black">{femaleCount}</strong> คน)
          </div>
        </div>

        {/* Document Table (Dynamic Columns, Dynamic Font Scaling, Non-bold data cells, Pure Black) */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse border border-black text-black" style={{ fontSize: tableScale.fontSize, color: '#000' }}>
            <thead>
              <tr className="bg-slate-100 text-black font-bold text-center" style={{ fontSize: tableScale.headerFontSize }}>
                <th className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} w-10 text-center text-black`}>
                  ลำดับ
                </th>
                {showStudentId && (
                  <th className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} w-20 text-center text-black`}>
                    รหัสนักเรียน
                  </th>
                )}
                {showCitizenId && (
                  <th className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} w-28 text-center text-black`}>
                    เลขประจำตัวประชาชน
                  </th>
                )}
                {showFullName && (
                  <th className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} min-w-[140px] text-left text-black`}>
                    ชื่อ - นามสกุล
                  </th>
                )}
                {showBirthDate && (
                  <th className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} w-24 text-center text-black`}>
                    วันเกิด
                  </th>
                )}
                {showGuardianName && (
                  <th className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} min-w-[120px] text-left text-black`}>
                    ชื่อผู้ปกครอง
                  </th>
                )}
                {showGuardianCitizenId && (
                  <th className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} w-28 text-center text-black`}>
                    เลขประชาชนผู้ปกครอง
                  </th>
                )}

                {/* Dynamic Blank Check Columns - left side touches student name, right side touches remarks */}
                {blankColCount === 1 ? (
                  <th className={`border border-black ${tableScale.cellPaddingY} px-0.5 min-w-[140px] bg-slate-50 text-center`}></th>
                ) : (
                  Array.from({ length: blankColCount }, (_, i) => (
                    <th key={i} className={`border border-black ${tableScale.cellPaddingY} px-0.5 w-6 min-w-[22px] bg-slate-50`}></th>
                  ))
                )}

                <th className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} w-20 text-center text-black`}>
                  หมายเหตุ
                </th>
              </tr>
            </thead>
            <tbody>
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={totalColSpan} className={`border border-black p-6 text-center text-black`} style={{ fontSize: tableScale.fontSize }}>
                    ไม่พบข้อมูลนักเรียนในชั้นเรียนนี้ (สามารถเพิ่มข้อมูลในเมนูเพิ่มนักเรียน)
                  </td>
                </tr>
              ) : (
                classStudents.map((s, idx) => (
                  <tr key={s.id} className={`text-black ${tableScale.rowHeightClass}`} style={{ fontSize: tableScale.fontSize }}>
                    <td className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black`}>
                      {idx + 1}
                    </td>
                    {showStudentId && (
                      <td className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black`}>
                        {s.studentId}
                      </td>
                    )}
                    {showCitizenId && (
                      <td className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black`}>
                        {s.citizenId || '-'}
                      </td>
                    )}
                    {showFullName && (
                      <td className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} font-normal text-black whitespace-nowrap`}>
                        {s.prefix}{s.firstName} {s.lastName}
                      </td>
                    )}
                    {showBirthDate && (
                      <td className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black whitespace-nowrap`}>
                        {formatThaiBirthDate(s.birthDate)}
                      </td>
                    )}
                    {showGuardianName && (
                      <td className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} font-normal text-black whitespace-nowrap`}>
                        {`${s.guardianPrefix || ''}${s.guardianFirstName || ''} ${s.guardianLastName || ''}`.trim() || '-'}
                      </td>
                    )}
                    {showGuardianCitizenId && (
                      <td className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black`}>
                        {s.guardianCitizenId || '-'}
                      </td>
                    )}

                    {/* Dynamic Blank Columns - if 1 column, it is a long wide block */}
                    {blankColCount === 1 ? (
                      <td className={`border border-black p-0 min-w-[140px] ${tableScale.rowHeightClass}`}></td>
                    ) : (
                      Array.from({ length: blankColCount }, (_, i) => (
                        <td key={i} className={`border border-black p-0 w-6 min-w-[22px] ${tableScale.rowHeightClass}`}></td>
                      ))
                    )}

                    <td className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black`}>
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
