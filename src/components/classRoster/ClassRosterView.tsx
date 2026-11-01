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

  // Find homeroom teacher(s) for selected class (support multiple teachers joined by comma)
  const homeroomTeachers = useMemo(() => {
    if (!currentClass || !currentRoom) return [];
    const matched = assignments.filter(
      a => a.className === currentClass && a.room === currentRoom
    );
    const names: string[] = [];
    matched.forEach(m => {
      if (m.teacherName && m.teacherName.trim()) {
        const split = m.teacherName.split(/[,/،、]/).map(t => t.trim()).filter(Boolean);
        if (split.length > 0) {
          names.push(...split);
        } else {
          names.push(m.teacherName.trim());
        }
      }
    });
    return Array.from(new Set(names));
  }, [assignments, currentClass, currentRoom]);

  const homeroomTeacher = useMemo(() => {
    if (homeroomTeachers.length === 0) {
      return '...................................................';
    }
    return homeroomTeachers.join(', ');
  }, [homeroomTeachers]);

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

  // Proportional column widths ensuring blank slots automatically expand and share equal width
  // without compressing student/guardian names or causing ellipses (...)
  const columnWidths = useMemo(() => {
    const orderW = 4.5;
    const studentIdW = showStudentId ? 8.5 : 0;
    const citizenIdW = showCitizenId ? 14.5 : 0;
    // When fewer fields are selected, give student name generous space (34%) so it never truncates
    const fullNameW = showFullName ? (showGuardianName ? 24 : 33) : 0;
    const birthDateW = showBirthDate ? 11 : 0;
    const guardianNameW = showGuardianName ? 23 : 0;
    const guardianCitizenIdW = showGuardianCitizenId ? 14.5 : 0;
    const remarksW = 9.5;

    const infoTotalW = orderW + studentIdW + citizenIdW + fullNameW + birthDateW + guardianNameW + guardianCitizenIdW + remarksW;

    // Blank pool expands to fill remaining space
    let blankPoolW: number;
    if (blankColCount <= 0) {
      blankPoolW = 0;
    } else if (infoTotalW <= 50) {
      // Default / few fields: blank slots expand to absorb all remaining space up to remarks
      blankPoolW = blankColCount === 1 ? 52 : Math.max(50, blankColCount * 5);
    } else if (infoTotalW <= 80) {
      blankPoolW = blankColCount === 1 ? 28 : Math.max(30, blankColCount * 3.8);
    } else {
      // Many student fields active -> balanced allocation
      blankPoolW = blankColCount === 1 ? 16 : Math.max(22, blankColCount * 2.5);
    }

    const totalW = infoTotalW + blankPoolW;
    const eachBlankW = blankColCount > 0 ? blankPoolW / blankColCount : 0;

    return {
      order: (orderW / totalW) * 100,
      studentId: (studentIdW / totalW) * 100,
      citizenId: (citizenIdW / totalW) * 100,
      fullName: (fullNameW / totalW) * 100,
      birthDate: (birthDateW / totalW) * 100,
      guardianName: (guardianNameW / totalW) * 100,
      guardianCitizenId: (guardianCitizenIdW / totalW) * 100,
      eachBlank: (eachBlankW / totalW) * 100,
      remarks: (remarksW / totalW) * 100,
    };
  }, [showStudentId, showCitizenId, showFullName, showBirthDate, showGuardianName, showGuardianCitizenId, blankColCount]);

  // Measure max text lengths in active classroom to adjust cell font sizes accurately
  const maxLengths = useMemo(() => {
    let maxName = 14;
    let maxGuardian = 12;
    let maxStudentId = 5;
    let maxCitizen = 13;
    let maxGuardianCitizen = 13;

    classStudents.forEach(s => {
      const name = `${s.prefix || ''}${s.firstName || ''} ${s.lastName || ''}`.trim();
      if (name.length > maxName) maxName = name.length;

      const gName = `${s.guardianPrefix || ''}${s.guardianFirstName || ''} ${s.guardianLastName || ''}`.trim();
      if (gName.length > maxGuardian) maxGuardian = gName.length;

      if (s.studentId && s.studentId.length > maxStudentId) maxStudentId = s.studentId.length;
      if (s.citizenId && s.citizenId.length > maxCitizen) maxCitizen = s.citizenId.length;
      if (s.guardianCitizenId && s.guardianCitizenId.length > maxGuardianCitizen) maxGuardianCitizen = s.guardianCitizenId.length;
    });

    return { maxName, maxGuardian, maxStudentId, maxCitizen, maxGuardianCitizen };
  }, [classStudents]);

  // Dynamic scaling based on student row count and active columns to fit A4 page perfectly without right-edge overflow
  // and guarantee strict single-line text in every cell
  const tableScale = useMemo(() => {
    const rowCount = classStudents.length;

    // 1. Column count scaling (Horizontal overflow prevention)
    let colFontNum = 13;
    let colHeaderFontNum = 13;
    let cellPaddingX = 'px-1.5';
    let cellPaddingY = 'py-1';

    if (totalColSpan > 20) {
      colFontNum = 6.5;
      colHeaderFontNum = 6.5;
      cellPaddingX = 'px-[2px]';
      cellPaddingY = 'py-[2px]';
    } else if (totalColSpan > 16) {
      colFontNum = 7.5;
      colHeaderFontNum = 7.5;
      cellPaddingX = 'px-[2px]';
      cellPaddingY = 'py-0.5';
    } else if (totalColSpan > 12) {
      colFontNum = 8.5;
      colHeaderFontNum = 9;
      cellPaddingX = 'px-1';
      cellPaddingY = 'py-0.5';
    } else if (totalColSpan > 8) {
      colFontNum = 10;
      colHeaderFontNum = 10.5;
      cellPaddingX = 'px-1';
      cellPaddingY = 'py-0.5';
    } else if (totalColSpan > 5) {
      colFontNum = 11.5;
      colHeaderFontNum = 12;
      cellPaddingX = 'px-1.5';
      cellPaddingY = 'py-1';
    }

    // 2. Row count scaling (Vertical overflow prevention on A4)
    let rowFontNum = 13.5;
    let rowHeaderFontNum = 13.5;
    let rowTitleFontNum = 13.5;
    let rowSubTitleFontNum = 12.5;
    let rowHeaderInfoFontNum = 12;
    let rowHeightClass = 'h-7';

    if (rowCount > 40) {
      rowFontNum = 9;
      rowHeaderFontNum = 9.5;
      rowTitleFontNum = 11;
      rowSubTitleFontNum = 10;
      rowHeaderInfoFontNum = 9.5;
      rowHeightClass = 'h-4.5';
      cellPaddingY = 'py-0.5';
    } else if (rowCount > 32) {
      rowFontNum = 10;
      rowHeaderFontNum = 10.5;
      rowTitleFontNum = 11.5;
      rowSubTitleFontNum = 10.5;
      rowHeaderInfoFontNum = 10;
      rowHeightClass = 'h-5';
      cellPaddingY = 'py-0.5';
    } else if (rowCount > 24) {
      rowFontNum = 11;
      rowHeaderFontNum = 11.5;
      rowTitleFontNum = 12.5;
      rowSubTitleFontNum = 11.5;
      rowHeaderInfoFontNum = 11;
      rowHeightClass = 'h-5.5';
      cellPaddingY = 'py-0.5';
    } else if (rowCount > 18) {
      rowFontNum = 12;
      rowHeaderFontNum = 12.5;
      rowTitleFontNum = 13;
      rowSubTitleFontNum = 12;
      rowHeaderInfoFontNum = 11.5;
      rowHeightClass = 'h-6';
    }

    // Combine both dimensions: take minimum font so neither axis overflows
    const baseFontSizeNum = Math.min(rowFontNum, colFontNum);
    const baseHeaderFontSizeNum = Math.min(rowHeaderFontNum, colHeaderFontNum);
    const titleFontSizeNum = Math.min(rowTitleFontNum, Math.max(10, baseFontSizeNum + 1.5));
    const subTitleFontSizeNum = Math.min(rowSubTitleFontNum, Math.max(9.5, baseFontSizeNum + 0.5));
    const headerInfoFontSizeNum = Math.min(rowHeaderInfoFontNum, Math.max(9, baseFontSizeNum));

    // A4 printable width is approx 550pt (194mm printable area with 8mm margins)
    const printableWidthPt = 550;
    const paddingPt = totalColSpan > 16 ? 2 : totalColSpan > 10 ? 3 : 5;

    // Helper to calculate maximum fitting font size for single-line text without overflow or wrapping
    const calcFitFont = (colPct: number, charCount: number, isDigit = false): number => {
      if (colPct <= 0 || charCount <= 0) return baseFontSizeNum;
      const cellWidthPt = printableWidthPt * (colPct / 100);
      const netWidthPt = Math.max(8, cellWidthPt - paddingPt);
      const charWidthFactor = isDigit ? 0.52 : 0.48;
      const fit = (netWidthPt * 0.94) / (charCount * charWidthFactor);
      return Math.max(5, Math.min(baseFontSizeNum, Math.round(fit * 10) / 10));
    };

    const calcHeaderFitFont = (colPct: number, headerText: string): number => {
      if (colPct <= 0 || !headerText) return baseHeaderFontSizeNum;
      const cellWidthPt = printableWidthPt * (colPct / 100);
      const netWidthPt = Math.max(8, cellWidthPt - paddingPt);
      const fit = (netWidthPt * 0.94) / (headerText.length * 0.47);
      return Math.max(5, Math.min(baseHeaderFontSizeNum, Math.round(fit * 10) / 10));
    };

    // Specific font sizes for columns to strictly guarantee single line without overflow
    const colFonts = {
      order: `${calcFitFont(columnWidths.order, 3, true)}pt`,
      studentId: `${calcFitFont(columnWidths.studentId, maxLengths.maxStudentId, true)}pt`,
      citizenId: `${calcFitFont(columnWidths.citizenId, maxLengths.maxCitizen, true)}pt`,
      fullName: `${calcFitFont(columnWidths.fullName, maxLengths.maxName, false)}pt`,
      birthDate: `${calcFitFont(columnWidths.birthDate, 12, false)}pt`,
      guardianName: `${calcFitFont(columnWidths.guardianName, maxLengths.maxGuardian, false)}pt`,
      guardianCitizenId: `${calcFitFont(columnWidths.guardianCitizenId, maxLengths.maxGuardianCitizen, true)}pt`,
      remarks: `${calcFitFont(columnWidths.remarks, 13, false)}pt`,
    };

    const headerFonts = {
      order: `${calcHeaderFitFont(columnWidths.order, 'ลำดับ')}pt`,
      studentId: `${calcHeaderFitFont(columnWidths.studentId, 'รหัสนักเรียน')}pt`,
      citizenId: `${calcHeaderFitFont(columnWidths.citizenId, 'เลขประจำตัวประชาชน')}pt`,
      fullName: `${calcHeaderFitFont(columnWidths.fullName, 'ชื่อ - นามสกุล')}pt`,
      birthDate: `${calcHeaderFitFont(columnWidths.birthDate, 'วันเกิด')}pt`,
      guardianName: `${calcHeaderFitFont(columnWidths.guardianName, 'ชื่อผู้ปกครอง')}pt`,
      guardianCitizenId: `${calcHeaderFitFont(columnWidths.guardianCitizenId, 'เลขประชาชนผู้ปกครอง')}pt`,
      remarks: `${calcHeaderFitFont(columnWidths.remarks, 'หมายเหตุ')}pt`,
    };

    return {
      fontSize: `${baseFontSizeNum}pt`,
      headerFontSize: `${baseHeaderFontSizeNum}pt`,
      titleFontSize: `${titleFontSizeNum}pt`,
      subTitleFontSize: `${subTitleFontSizeNum}pt`,
      headerInfoFontSize: `${headerInfoFontSizeNum}pt`,
      cellPaddingY,
      cellPaddingX,
      rowHeightClass,
      fontSizeNum: baseFontSizeNum,
      colFonts,
      headerFonts,
    };
  }, [classStudents.length, totalColSpan, columnWidths, maxLengths]);

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
            พิมพ์รายชื่อนักเรียน (Class Roster Print Preview)
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
          {/* Blank Check Columns Numeric Input (Max 15) */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 block">
                  จำนวนช่องว่างสำหรับเช็คชื่อ (ช่องเปล่า):
                </label>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  ไม่เกิน 15 ช่อง
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                ระบุจำนวนช่องว่างสำหรับติ๊กเช็คชื่อ (0 - 15 ช่อง) โดยระบบจะปรับขนาดตารางอัตโนมัติ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Stepper with direct numeric input */}
              <div className="flex items-center rounded-xl border border-slate-300 bg-white shadow-xs overflow-hidden focus-within:border-[#0C7C82] focus-within:ring-2 focus-within:ring-[#0C7C82]/20">
                <button
                  type="button"
                  onClick={() => setBlankColCount(prev => Math.max(0, prev - 1))}
                  disabled={blankColCount <= 0}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-bold text-sm select-none"
                  title="ลด 1 ช่อง"
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={blankColCount}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setBlankColCount(0);
                      return;
                    }
                    const val = parseInt(raw, 10);
                    if (!isNaN(val)) {
                      setBlankColCount(Math.min(15, Math.max(0, val)));
                    }
                  }}
                  className="w-12 h-8 text-center font-bold text-slate-800 text-sm outline-hidden border-x border-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="จำนวนช่องว่างสำหรับเช็คชื่อ (0 - 15 ช่อง)"
                />
                <button
                  type="button"
                  onClick={() => setBlankColCount(prev => Math.min(15, prev + 1))}
                  disabled={blankColCount >= 15}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-bold text-sm select-none"
                  title="เพิ่ม 1 ช่อง"
                >
                  +
                </button>
              </div>

              <span className="text-xs font-semibold text-slate-700">ช่อง</span>

              {/* Quick shortcut presets */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[11px] text-slate-400 hidden sm:inline">ลัด:</span>
                {[0, 1, 5, 10, 15].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBlankColCount(num)}
                    className={`px-2 py-0.5 text-xs rounded-lg font-semibold transition cursor-pointer ${
                      blankColCount === num
                        ? 'bg-[#0C7C82] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
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

      {/* Injected Print Stylesheet for A4 Portrait Roster Print */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm !important;
          }
        }
      `}</style>

      {/* Document Sheet Preview: Standard A4 Portrait Paper Simulation */}
      <div 
        className="bg-white rounded-2xl p-6 sm:p-8 border border-black/30 shadow-xl text-black mx-auto max-w-[210mm] w-full overflow-hidden print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none" 
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

        {/* Document Table (Dynamic Columns, Dynamic Font Scaling, Single-Line Cells, Pure Black, Table-Fixed) */}
        <div className="mt-3 w-full overflow-x-hidden">
          <table className="w-full table-fixed border-collapse border border-black text-black" style={{ fontSize: tableScale.fontSize, color: '#000' }}>
            <colgroup>
              <col style={{ width: `${columnWidths.order}%` }} />
              {showStudentId && <col style={{ width: `${columnWidths.studentId}%` }} />}
              {showCitizenId && <col style={{ width: `${columnWidths.citizenId}%` }} />}
              {showFullName && <col style={{ width: `${columnWidths.fullName}%` }} />}
              {showBirthDate && <col style={{ width: `${columnWidths.birthDate}%` }} />}
              {showGuardianName && <col style={{ width: `${columnWidths.guardianName}%` }} />}
              {showGuardianCitizenId && <col style={{ width: `${columnWidths.guardianCitizenId}%` }} />}
              {Array.from({ length: blankColCount }, (_, i) => (
                <col key={`col-blank-${i}`} style={{ width: `${columnWidths.eachBlank}%` }} />
              ))}
              <col style={{ width: `${columnWidths.remarks}%` }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-100 text-black font-bold text-center" style={{ fontSize: tableScale.headerFontSize }}>
                <th 
                  className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center text-black font-bold whitespace-nowrap overflow-hidden`}
                  style={{ fontSize: tableScale.headerFonts.order }}
                >
                  ลำดับ
                </th>
                {showStudentId && (
                  <th 
                    className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center text-black font-bold whitespace-nowrap overflow-hidden`}
                    style={{ fontSize: tableScale.headerFonts.studentId }}
                  >
                    รหัสนักเรียน
                  </th>
                )}
                {showCitizenId && (
                  <th 
                    className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center text-black font-bold whitespace-nowrap overflow-hidden`}
                    style={{ fontSize: tableScale.headerFonts.citizenId }}
                  >
                    เลขประจำตัวประชาชน
                  </th>
                )}
                {showFullName && (
                  <th 
                    className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-left text-black font-bold whitespace-nowrap overflow-hidden`}
                    style={{ fontSize: tableScale.headerFonts.fullName }}
                  >
                    ชื่อ - นามสกุล
                  </th>
                )}
                {showBirthDate && (
                  <th 
                    className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center text-black font-bold whitespace-nowrap overflow-hidden`}
                    style={{ fontSize: tableScale.headerFonts.birthDate }}
                  >
                    วันเกิด
                  </th>
                )}
                {showGuardianName && (
                  <th 
                    className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-left text-black font-bold whitespace-nowrap overflow-hidden`}
                    style={{ fontSize: tableScale.headerFonts.guardianName }}
                  >
                    ชื่อผู้ปกครอง
                  </th>
                )}
                {showGuardianCitizenId && (
                  <th 
                    className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center text-black font-bold whitespace-nowrap overflow-hidden`}
                    style={{ fontSize: tableScale.headerFonts.guardianCitizenId }}
                  >
                    เลขประชาชนผู้ปกครอง
                  </th>
                )}

                {/* Dynamic Blank Check Columns - all expanding equally, contiguous between info and remarks */}
                {Array.from({ length: blankColCount }, (_, i) => (
                  <th key={`th-blank-${i}`} className={`border border-black ${tableScale.cellPaddingY} bg-slate-50 text-center`}></th>
                ))}

                <th 
                  className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center text-black font-bold whitespace-nowrap overflow-hidden`}
                  style={{ fontSize: tableScale.headerFonts.remarks }}
                >
                  หมายเหตุ
                </th>
              </tr>
            </thead>
            <tbody>
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={totalColSpan} className={`border border-black p-6 text-center text-black whitespace-nowrap`} style={{ fontSize: tableScale.fontSize }}>
                    ไม่พบข้อมูลนักเรียนในชั้นเรียนนี้ (สามารถเพิ่มข้อมูลในเมนูเพิ่มนักเรียน)
                  </td>
                </tr>
              ) : (
                classStudents.map((s, idx) => (
                  <tr key={s.id} className={`text-black ${tableScale.rowHeightClass}`} style={{ fontSize: tableScale.fontSize }}>
                    <td 
                      className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black whitespace-nowrap overflow-hidden`}
                      style={{ fontSize: tableScale.colFonts.order }}
                    >
                      {idx + 1}
                    </td>
                    {showStudentId && (
                      <td 
                        className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black whitespace-nowrap overflow-hidden`}
                        style={{ fontSize: tableScale.colFonts.studentId }}
                      >
                        {s.studentId}
                      </td>
                    )}
                    {showCitizenId && (
                      <td 
                        className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black whitespace-nowrap overflow-hidden`}
                        style={{ fontSize: tableScale.colFonts.citizenId }}
                      >
                        {s.citizenId || '-'}
                      </td>
                    )}
                    {showFullName && (
                      <td 
                        className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-left font-normal text-black whitespace-nowrap overflow-hidden`}
                        style={{ fontSize: tableScale.colFonts.fullName }}
                      >
                        {s.prefix}{s.firstName} {s.lastName}
                      </td>
                    )}
                    {showBirthDate && (
                      <td 
                        className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black whitespace-nowrap overflow-hidden`}
                        style={{ fontSize: tableScale.colFonts.birthDate }}
                      >
                        {formatThaiBirthDate(s.birthDate)}
                      </td>
                    )}
                    {showGuardianName && (
                      <td 
                        className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-left font-normal text-black whitespace-nowrap overflow-hidden`}
                        style={{ fontSize: tableScale.colFonts.guardianName }}
                      >
                        {`${s.guardianPrefix || ''}${s.guardianFirstName || ''} ${s.guardianLastName || ''}`.trim() || '-'}
                      </td>
                    )}
                    {showGuardianCitizenId && (
                      <td 
                        className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black whitespace-nowrap overflow-hidden`}
                        style={{ fontSize: tableScale.colFonts.guardianCitizenId }}
                      >
                        {s.guardianCitizenId || '-'}
                      </td>
                    )}

                    {/* Dynamic Blank Columns - all expanding equally, contiguous between info and remarks */}
                    {Array.from({ length: blankColCount }, (_, i) => (
                      <td key={`td-blank-${i}`} className={`border border-black p-0 ${tableScale.rowHeightClass}`}></td>
                    ))}

                    <td 
                      className={`border border-black ${tableScale.cellPaddingY} ${tableScale.cellPaddingX} text-center font-normal text-black whitespace-nowrap overflow-hidden`}
                      style={{ fontSize: tableScale.colFonts.remarks }}
                    >
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
