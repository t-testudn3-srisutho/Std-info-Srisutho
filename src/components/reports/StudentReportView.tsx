import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart3,
  Users,
  GraduationCap,
  Download,
  Printer,
  Filter,
  Check,
  ChevronDown,
  RotateCcw,
  PieChart as PieIcon,
  Table as TableIcon,
  Layers,
  School,
  AlertCircle,
  FileText,
  HelpCircle,
  X,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { Student, Classroom, AcademicYear, SystemSetting, HomeroomAssignment } from '../../types';
import { compareClassrooms, getGradeOrder } from '../classrooms/ClassroomsView';
import { exportStudentSummaryReportToExcel, ClassSummaryReportRow } from '../../utils/excel';
import Chart from 'chart.js/auto';

interface StudentReportViewProps {
  students: Student[];
  classrooms: Classroom[];
  academicYears: AcademicYear[];
  assignments: HomeroomAssignment[];
  settings: SystemSetting;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const StudentReportView: React.FC<StudentReportViewProps> = ({
  students,
  classrooms,
  academicYears,
  assignments,
  settings,
  showToast,
}) => {
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'table' | 'charts'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartInstance = useRef<Chart | null>(null);
  const doughnutChartInstance = useRef<Chart | null>(null);

  const currentYear = academicYears.find(y => y.isCurrent)?.year || '2567';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Gather all unique classrooms (merging configured classrooms and student-extracted classrooms)
  const combinedClassrooms = useMemo(() => {
    const map = new Map<string, { className: string; room: string; orderSeq: number }>();

    classrooms.forEach(c => {
      const key = `${c.className.trim()}_${c.room.trim()}`;
      map.set(key, {
        className: c.className.trim(),
        room: c.room.trim(),
        orderSeq: c.orderSeq || 999,
      });
    });

    students.forEach(s => {
      const c = (s.classLevel || '').trim();
      const r = (s.room || '').trim();
      if (!c || !r) return;
      const key = `${c}_${r}`;
      if (!map.has(key)) {
        map.set(key, {
          className: c,
          room: r,
          orderSeq: 999,
        });
      }
    });

    return Array.from(map.values()).sort(compareClassrooms);
  }, [classrooms, students]);

  // Unique grade levels sorted canonically
  const uniqueGradeLevels = useMemo(() => {
    const set = new Set<string>();
    combinedClassrooms.forEach(c => set.add(c.className));
    return Array.from(set).sort((a, b) => getGradeOrder(a) - getGradeOrder(b));
  }, [combinedClassrooms]);

  // 2. Compute statistics for each classroom
  const reportRows: ClassSummaryReportRow[] = useMemo(() => {
    // Map homeroom teacher
    const teacherMap = new Map<string, string>();
    assignments.forEach(a => {
      if (!a.academicYear || a.academicYear === currentYear) {
        const key = `${(a.className || '').trim()}_${(a.room || '').trim()}`;
        teacherMap.set(key, a.teacherName);
      }
    });

    return combinedClassrooms.map((cls, idx) => {
      const key = `${cls.className}_${cls.room}`;
      const classStudents = students.filter(
        s => (s.classLevel || '').trim() === cls.className && (s.room || '').trim() === cls.room
      );

      const maleCount = classStudents.filter(s => s.gender === 'ชาย' || s.gender === 'ช').length;
      const femaleCount = classStudents.filter(s => s.gender === 'หญิง' || s.gender === 'ญ').length;
      const totalCount = classStudents.length;

      const malePct = totalCount > 0 ? `${Math.round((maleCount / totalCount) * 100)}%` : '0%';
      const femalePct = totalCount > 0 ? `${Math.round((femaleCount / totalCount) * 100)}%` : '0%';

      const disadvantagedCount = classStudents.filter(
        s => s.disadvantage && s.disadvantage !== 'ไม่ด้อยโอกาส' && s.disadvantage !== 'ไม่มี' && s.disadvantage !== '-'
      ).length;

      const cannotDischargeCount = classStudents.filter(s => s.cannotDischarge).length;

      return {
        index: idx + 1,
        className: cls.className,
        room: cls.room,
        teacherName: teacherMap.get(key) || '-',
        maleCount,
        femaleCount,
        totalCount,
        malePct,
        femalePct,
        disadvantagedCount,
        cannotDischargeCount,
      };
    });
  }, [combinedClassrooms, students, assignments, currentYear]);

  // Grade level options with counts for dropdown
  const gradeLevelOptions = useMemo(() => {
    return uniqueGradeLevels.map(grade => {
      const classRows = reportRows.filter(r => r.className === grade);
      const rooms = classRows.length;
      const male = classRows.reduce((acc, r) => acc + r.maleCount, 0);
      const female = classRows.reduce((acc, r) => acc + r.femaleCount, 0);
      const total = male + female;
      return {
        grade,
        rooms,
        male,
        female,
        total,
      };
    });
  }, [uniqueGradeLevels, reportRows]);

  // Total summary across all levels
  const allLevelsStats = useMemo(() => {
    const rooms = reportRows.length;
    const male = reportRows.reduce((acc, r) => acc + r.maleCount, 0);
    const female = reportRows.reduce((acc, r) => acc + r.femaleCount, 0);
    const total = male + female;
    return { rooms, male, female, total };
  }, [reportRows]);

  // Filtered rows based on selected grade
  const filteredRows = useMemo(() => {
    if (selectedLevelFilter === 'all') return reportRows;
    return reportRows.filter(r => r.className === selectedLevelFilter);
  }, [reportRows, selectedLevelFilter]);

  // Overall totals for active filter
  const overallStats = useMemo(() => {
    const totalMale = filteredRows.reduce((acc, r) => acc + r.maleCount, 0);
    const totalFemale = filteredRows.reduce((acc, r) => acc + r.femaleCount, 0);
    const grandTotal = totalMale + totalFemale;
    const totalDisadvantaged = filteredRows.reduce((acc, r) => acc + r.disadvantagedCount, 0);
    const totalCannotDischarge = filteredRows.reduce((acc, r) => acc + r.cannotDischargeCount, 0);
    const totalClasses = filteredRows.length;
    const avgPerClass = totalClasses > 0 ? (grandTotal / totalClasses).toFixed(1) : '0';

    const maleRatio = grandTotal > 0 ? Math.round((totalMale / grandTotal) * 100) : 0;
    const femaleRatio = grandTotal > 0 ? 100 - maleRatio : 0;

    return {
      totalMale,
      totalFemale,
      grandTotal,
      totalDisadvantaged,
      totalCannotDischarge,
      totalClasses,
      avgPerClass,
      maleRatio,
      femaleRatio,
    };
  }, [filteredRows]);

  // Subtotal grouped by class level
  const levelSubtotals = useMemo(() => {
    const map = new Map<string, { male: number; female: number; total: number; rooms: number }>();
    filteredRows.forEach(r => {
      const existing = map.get(r.className) || { male: 0, female: 0, total: 0, rooms: 0 };
      existing.male += r.maleCount;
      existing.female += r.femaleCount;
      existing.total += r.totalCount;
      existing.rooms += 1;
      map.set(r.className, existing);
    });
    return Array.from(map.entries()).map(([level, stats]) => ({
      level,
      ...stats,
    }));
  }, [filteredRows]);

  // Render Charts
  useEffect(() => {
    if (viewMode === 'table') return;

    // Stacked Bar Chart: Male vs Female per Room
    if (barChartRef.current) {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const labels = filteredRows.map(r => {
        const shortLevel = r.className
          .replace('มัธยมศึกษาปีที่ ', 'ม.')
          .replace('ประถมศึกษาปีที่ ', 'ป.')
          .replace('อนุบาล ', 'อ.');
        return `${shortLevel}/${r.room}`;
      });
      const maleData = filteredRows.map(r => r.maleCount);
      const femaleData = filteredRows.map(r => r.femaleCount);

      barChartInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'ชาย (คน)',
              data: maleData,
              backgroundColor: '#0C7C82',
              borderRadius: 4,
            },
            {
              label: 'หญิง (คน)',
              data: femaleData,
              backgroundColor: '#F43F5E',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: { family: 'Sarabun', size: 12 },
              },
            },
            tooltip: {
              titleFont: { family: 'Sarabun' },
              bodyFont: { family: 'Sarabun' },
              callbacks: {
                footer: tooltipItems => {
                  let sum = 0;
                  tooltipItems.forEach(item => {
                    sum += Number(item.parsed.y || 0);
                  });
                  return `รวมทั้งห้อง: ${sum} คน`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Sarabun', size: 11 } },
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 5, font: { family: 'Sarabun' } },
            },
          },
        },
      });
    }

    // Doughnut Chart: Overall Gender Distribution
    if (doughnutChartRef.current) {
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy();
      }

      doughnutChartInstance.current = new Chart(doughnutChartRef.current, {
        type: 'doughnut',
        data: {
          labels: [`ชาย (${overallStats.totalMale} คน)`, `หญิง (${overallStats.totalFemale} คน)`],
          datasets: [
            {
              data: [overallStats.totalMale, overallStats.totalFemale],
              backgroundColor: ['#0C7C82', '#F43F5E'],
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: 'Sarabun', size: 12 },
                padding: 16,
              },
            },
            tooltip: {
              titleFont: { family: 'Sarabun' },
              bodyFont: { family: 'Sarabun' },
            },
          },
        },
      });
    }

    return () => {
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
    };
  }, [filteredRows, overallStats, viewMode]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      exportStudentSummaryReportToExcel(
        filteredRows,
        settings.schoolName || 'โรงเรียนศรีสุทโธ',
        currentYear,
        overallStats
      );
      showToast('success', 'ส่งออกรายงานสำเร็จ', 'ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว');
    } catch {
      showToast('error', 'ไม่สามารถส่งออกไฟล์ Excel ได้');
    }
  };

  // Direct Print
  const handlePrint = () => {
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helper title for print and UI
  const currentGradeDisplay = selectedLevelFilter === 'all' ? 'ทุกระดับชั้น' : selectedLevelFilter;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar (Hidden in Print) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs print:hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#0C7C82] shadow-xs shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800">รายงานสรุปข้อมูลนักเรียนรายชั้นเรียน</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0C7C82] border border-teal-100">
                  ปีการศึกษา {currentYear}
                </span>
                {selectedLevelFilter !== 'all' && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {selectedLevelFilter}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                สรุปสถิติจำนวนนักเรียน ชาย-หญิง จำแนกตามชั้นเรียนและห้องเรียน สัดส่วนเปอร์เซ็นต์ พร้อมกราฟวิเคราะห์และพิมพ์รายงาน/ดาวน์โหลด PDF
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'all' ? 'bg-white text-slate-800 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
                title="แสดงทั้งตารางและกราฟ"
              >
                <Layers className="w-3.5 h-3.5" /> ทั้งหมด
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-white text-slate-800 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
                title="เฉพาะตารางสรุป"
              >
                <TableIcon className="w-3.5 h-3.5" /> ตาราง
              </button>
              <button
                onClick={() => setViewMode('charts')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'charts' ? 'bg-white text-slate-800 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
                title="เฉพาะกราฟสถิติ"
              >
                <PieIcon className="w-3.5 h-3.5" /> กราฟ
              </button>
            </div>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="ส่งออกรายงานเป็นไฟล์ Excel"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>ส่งออก Excel</span>
            </button>

            {/* Print / PDF Button with helper modal option */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] hover:from-[#096368] hover:to-[#2a9491] text-white text-xs font-semibold shadow-md shadow-teal-800/20 transition cursor-pointer flex items-center gap-1.5"
                title="สั่งพิมพ์รายงานทางการ หรือ บันทึกเป็นไฟล์ PDF"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์รายงาน / บันทึก PDF</span>
              </button>

              <button
                onClick={() => setShowPrintModal(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="คำแนะนำการสั่งพิมพ์และบันทึกเป็น PDF"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Interactive Class Level Filter Dropdown & Quick Chips */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#0C7C82]" />
              <span className="text-xs font-bold text-slate-700">กรองข้อมูลตามระดับชั้นเรียน:</span>
            </div>

            {/* Active selection badge & reset button */}
            {selectedLevelFilter !== 'all' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  กำลังแสดงเฉพาะ <strong className="text-teal-800 font-bold">{selectedLevelFilter}</strong> ({filteredRows.length} ห้อง • {overallStats.grandTotal} คน)
                </span>
                <button
                  onClick={() => setSelectedLevelFilter('all')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้างตัวกรอง</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Custom Interactive Dropdown Menu */}
            <div className="relative min-w-[280px]" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`w-full px-4 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-medium transition cursor-pointer ${
                  selectedLevelFilter !== 'all'
                    ? 'bg-teal-50/70 border-teal-300 text-[#0C7C82]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-4 h-4 text-[#0C7C82] shrink-0" />
                  <span className="font-bold text-slate-800">
                    {selectedLevelFilter === 'all'
                      ? 'ทุกระดับชั้น (ทั้งหมด)'
                      : selectedLevelFilter}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate">
                    ({selectedLevelFilter === 'all'
                      ? `${allLevelsStats.rooms} ห้อง • ${allLevelsStats.total} คน`
                      : `${overallStats.totalClasses} ห้อง • ${overallStats.grandTotal} คน`})
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isDropdownOpen ? 'rotate-180 text-[#0C7C82]' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu Popup */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-fade-in max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>เลือกระดับชั้น</span>
                    <span>จำนวนห้อง / นักเรียน</span>
                  </div>

                  {/* Option: All Levels */}
                  <button
                    onClick={() => {
                      setSelectedLevelFilter('all');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-2 hover:bg-slate-50 transition cursor-pointer ${
                      selectedLevelFilter === 'all' ? 'bg-teal-50/60 font-bold text-[#0C7C82]' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                          selectedLevelFilter === 'all'
                            ? 'bg-[#0C7C82] text-white'
                            : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold">ทุกระดับชั้น (แสดงทั้งหมด)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {allLevelsStats.rooms} ห้อง • {allLevelsStats.total} คน
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* Individual Grade Levels */}
                  {gradeLevelOptions.map(opt => {
                    const isSelected = selectedLevelFilter === opt.grade;
                    return (
                      <button
                        key={opt.grade}
                        onClick={() => {
                          setSelectedLevelFilter(opt.grade);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-2 hover:bg-slate-50 transition cursor-pointer ${
                          isSelected ? 'bg-teal-50/60 font-bold text-[#0C7C82]' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                              isSelected
                                ? 'bg-[#0C7C82] text-white'
                                : 'border border-slate-300 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span>{opt.grade}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="text-slate-500">{opt.rooms} ห้อง</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[#0C7C82] font-semibold">{opt.total} คน</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Filter Chips (One-click Grade Switch) */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedLevelFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  selectedLevelFilter === 'all'
                    ? 'bg-[#0C7C82] text-white border-[#0C7C82] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                ทุกชั้น ({combinedClassrooms.length})
              </button>

              {uniqueGradeLevels.map(lvl => {
                const isSelected = selectedLevelFilter === lvl;
                // Abbreviate grade for chips if needed
                const shortLabel = lvl
                  .replace('มัธยมศึกษาปีที่ ', 'ม.')
                  .replace('ประถมศึกษาปีที่ ', 'ป.')
                  .replace('อนุบาล ', 'อ.');
                const gradeInfo = gradeLevelOptions.find(o => o.grade === lvl);

                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelFilter(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#0C7C82] text-white border-[#0C7C82] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    title={`${lvl} (${gradeInfo?.rooms || 0} ห้องเรียน)`}
                  >
                    <span>{shortLabel}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-teal-900/40 text-teal-100' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {gradeInfo?.total || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official School Header for Print View (Visible only when Printing) */}
      <div className="hidden print:block text-center space-y-2 mb-6 border-b-2 border-slate-800 pb-4">
        {settings.schoolLogo && (
          <img
            src={settings.schoolLogo}
            alt={settings.schoolName}
            className="w-16 h-16 object-contain mx-auto mb-2"
          />
        )}
        <h1 className="text-xl font-bold text-slate-900 tracking-wide">
          {settings.schoolName || 'โรงเรียนศรีสุทโธ'}
        </h1>
        <p className="text-sm text-slate-700">
          {settings.affiliation || 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี'}
        </p>
        <h2 className="text-base font-bold text-slate-900 mt-2">
          {selectedLevelFilter === 'all'
            ? 'รายงานสรุปสถิติจำนวนนักเรียน จำแนกตามชั้นเรียนและเพศ (ทุกระดับชั้น)'
            : `รายงานสรุปสถิติจำนวนนักเรียน ระดับชั้น${selectedLevelFilter}`}
        </h2>
        <div className="flex items-center justify-center gap-6 text-xs text-slate-600 mt-1">
          <span>ปีการศึกษา {currentYear}</span>
          <span>•</span>
          <span>
            ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span>•</span>
          <span>
            เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
          </span>
        </div>

        {/* Print Summary Highlights */}
        <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-300 text-xs">
          <div className="p-2 border border-slate-300 rounded-sm">
            <span className="block text-slate-500 text-[10px]">ระดับชั้น</span>
            <span className="font-bold">{currentGradeDisplay}</span>
          </div>
          <div className="p-2 border border-slate-300 rounded-sm">
            <span className="block text-slate-500 text-[10px]">จำนวนห้องเรียน</span>
            <span className="font-bold">{overallStats.totalClasses} ห้อง</span>
          </div>
          <div className="p-2 border border-slate-300 rounded-sm">
            <span className="block text-slate-500 text-[10px]">นักเรียนชาย</span>
            <span className="font-bold">{overallStats.totalMale} คน ({overallStats.maleRatio}%)</span>
          </div>
          <div className="p-2 border border-slate-300 rounded-sm">
            <span className="block text-slate-500 text-[10px]">นักเรียนหญิง</span>
            <span className="font-bold">{overallStats.totalFemale} คน ({overallStats.femaleRatio}%)</span>
          </div>
          <div className="p-2 border border-slate-300 rounded-sm bg-slate-50">
            <span className="block text-slate-500 text-[10px]">รวมทั้งหมด</span>
            <span className="font-bold text-black">{overallStats.grandTotal} คน</span>
          </div>
        </div>
      </div>

      {/* 4. KPI Summary Cards (Hidden in Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 print:hidden">
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">นักเรียนทั้งหมด</span>
            <Users className="w-4 h-4 text-[#0C7C82]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-800 font-mono">
              {overallStats.grandTotal}
            </span>
            <span className="text-xs text-slate-400">คน</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <School className="w-3 h-3 text-slate-400" />
            <span>รวม {overallStats.totalClasses} ห้องเรียน</span>
          </div>
        </div>

        {/* Male Students */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-teal-800">นักเรียนชาย</span>
            <span className="text-xs font-bold font-mono text-[#0C7C82]">{overallStats.maleRatio}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#0C7C82] font-mono">
              {overallStats.totalMale}
            </span>
            <span className="text-xs text-slate-400">คน</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#0C7C82] h-full rounded-full transition-all duration-500"
              style={{ width: `${overallStats.maleRatio}%` }}
            />
          </div>
        </div>

        {/* Female Students */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-rose-700">นักเรียนหญิง</span>
            <span className="text-xs font-bold font-mono text-rose-600">{overallStats.femaleRatio}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-600 font-mono">
              {overallStats.totalFemale}
            </span>
            <span className="text-xs text-slate-400">คน</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallStats.femaleRatio}%` }}
            />
          </div>
        </div>

        {/* Average per class */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">เฉลี่ยต่อห้อง</span>
            <GraduationCap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-800 font-mono">
              {overallStats.avgPerClass}
            </span>
            <span className="text-xs text-slate-400">คน/ห้อง</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>เกณฑ์ สพฐ. 40 คน/ห้อง</span>
          </div>
        </div>

        {/* Disadvantaged Students */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-indigo-700">เด็กด้อยโอกาส</span>
            <AlertCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-indigo-600 font-mono">
              {overallStats.totalDisadvantaged}
            </span>
            <span className="text-xs text-slate-400">คน</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>จำหน่ายไม่ได้: {overallStats.totalCannotDischarge} คน</span>
          </div>
        </div>
      </div>

      {/* 5. Visual Graphs Section (Interactive Charts - Hidden in Print) */}
      {(viewMode === 'all' || viewMode === 'charts') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          {/* Stacked Bar Chart: Students per classroom */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#0C7C82]" />
                  เปรียบเทียบจำนวนนักเรียน ชาย - หญิง รายห้องเรียน
                  {selectedLevelFilter !== 'all' && (
                    <span className="text-xs font-medium text-[#0C7C82]">({selectedLevelFilter})</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  แท่งกราฟแสดงยอดนักเรียนจำแนกเพศในแต่ละชั้นและห้อง
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#0C7C82]" />
                  ชาย
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#F43F5E]" />
                  หญิง
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <canvas ref={barChartRef} />
            </div>
          </div>

          {/* Doughnut Chart: Overall Gender Ratio & Level summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#0C7C82]" />
                สัดส่วนเพศ {selectedLevelFilter !== 'all' ? selectedLevelFilter : 'รวมทั้งโรงเรียน'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เปอร์เซ็นต์สัดส่วนเพศ ชาย : หญิง
              </p>
            </div>

            <div className="h-52 w-full my-auto relative flex items-center justify-center">
              <canvas ref={doughnutChartRef} />
              <div className="absolute text-center pointer-events-none">
                <div className="text-xs font-semibold text-slate-400">รวมที่แสดง</div>
                <div className="text-xl font-bold text-slate-800 font-mono">
                  {overallStats.grandTotal}
                </div>
                <div className="text-[10px] text-slate-400">คน</div>
              </div>
            </div>

            {/* Quick Level Subtotals */}
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                <span>สรุปตามระดับชั้น ({levelSubtotals.length} ระดับ)</span>
                {selectedLevelFilter !== 'all' && (
                  <button
                    onClick={() => setSelectedLevelFilter('all')}
                    className="text-[#0C7C82] hover:underline cursor-pointer"
                  >
                    ดูทุกชั้น
                  </button>
                )}
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {levelSubtotals.map(item => (
                  <div key={item.level} className="flex items-center justify-between py-0.5 text-slate-600">
                    <span className="truncate max-w-[130px] font-medium">{item.level}</span>
                    <span className="font-mono text-slate-700">
                      <strong>{item.total}</strong> คน ({item.rooms} ห้อง)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Detailed Summary Table */}
      {(viewMode === 'all' || viewMode === 'table') && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
          {/* Table Header inside Card (Hidden in Print) */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-[#0C7C82]" />
                ตารางสรุปสถิตินักเรียนรายชั้นเรียน (Classroom Statistics Table)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ข้อมูลละเอียดแสดงจำนวนนักเรียนชาย หญิง ยอดรวม สัดส่วน และครูประจำชั้น
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                แสดง {filteredRows.length} ห้องเรียน
              </span>
              {selectedLevelFilter !== 'all' && (
                <button
                  onClick={() => setSelectedLevelFilter('all')}
                  className="text-xs font-semibold text-[#0C7C82] hover:underline cursor-pointer"
                >
                  (แสดงทุกชั้น)
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse min-w-[850px] print:min-w-full print:border print:border-black">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider print:bg-slate-100 print:text-black">
                  <th className="py-3 px-4 text-center w-12 print:border print:border-black">ลำดับ</th>
                  <th className="py-3 px-4 print:border print:border-black">ระดับชั้น</th>
                  <th className="py-3 px-4 text-center w-20 print:border print:border-black">ห้อง</th>
                  <th className="py-3 px-4 print:border print:border-black">ครูประจำชั้น</th>
                  <th className="py-3 px-4 text-center text-teal-800 w-24 print:border print:border-black print:text-black">
                    ชาย (คน)
                  </th>
                  <th className="py-3 px-4 text-center text-rose-700 w-24 print:border print:border-black print:text-black">
                    หญิง (คน)
                  </th>
                  <th className="py-3 px-4 text-center text-slate-800 font-bold w-24 print:border print:border-black print:text-black">
                    รวม (คน)
                  </th>
                  <th className="py-3 px-4 text-center w-36 print:border print:border-black">
                    สัดส่วน ชาย : หญิง
                  </th>
                  <th className="py-3 px-4 text-center w-24 print:border print:border-black">
                    ด้อยโอกาส
                  </th>
                  <th className="py-3 px-4 text-center w-28 print:hidden">
                    สถานะห้อง
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs print:divide-slate-800">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 print:text-black">
                      ไม่พบข้อมูลชั้นเรียนหรือนักเรียนในระดับชั้นที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const malePctNum = row.totalCount > 0 ? Math.round((row.maleCount / row.totalCount) * 100) : 0;
                    const femalePctNum = 100 - malePctNum;

                    // Capacity status
                    let statusLabel = 'ปานกลาง';
                    let statusClass = 'bg-teal-50 text-teal-700 border-teal-100';
                    if (row.totalCount > 40) {
                      statusLabel = 'หนาแน่น';
                      statusClass = 'bg-rose-50 text-rose-700 border-rose-100';
                    } else if (row.totalCount === 0) {
                      statusLabel = 'ว่าง';
                      statusClass = 'bg-slate-100 text-slate-500 border-slate-200';
                    } else if (row.totalCount <= 25) {
                      statusLabel = 'ห้องเล็ก';
                      statusClass = 'bg-sky-50 text-sky-700 border-sky-100';
                    }

                    return (
                      <tr
                        key={`${row.className}_${row.room}`}
                        className="hover:bg-slate-50/70 transition print:hover:bg-transparent"
                      >
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400 print:text-black print:border print:border-black">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 print:text-black print:border print:border-black">
                          {row.className}
                        </td>
                        <td className="py-2.5 px-4 text-center print:border print:border-black">
                          <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-100 text-[11px] print:border-none print:bg-transparent print:text-black">
                            ห้อง {row.room}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 print:text-black print:border print:border-black">
                          {row.teacherName !== '-' ? (
                            <span className="font-medium text-slate-800">{row.teacherName}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] print:text-slate-600">ยังไม่ระบุ</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-[#0C7C82] print:text-black print:border print:border-black">
                          {row.maleCount}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-600 print:text-black print:border print:border-black">
                          {row.femaleCount}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-extrabold text-slate-900 bg-slate-50/50 print:bg-transparent print:border print:border-black">
                          {row.totalCount}
                        </td>
                        <td className="py-2.5 px-4 text-center print:border print:border-black">
                          {row.totalCount > 0 ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono print:text-black">
                                <span>{malePctNum}% ชาย</span>
                                <span>{femalePctNum}% หญิง</span>
                              </div>
                              <div className="w-full bg-rose-200 h-1.5 rounded-full overflow-hidden flex print:hidden">
                                <div
                                  className="bg-[#0C7C82] h-full"
                                  style={{ width: `${malePctNum}%` }}
                                />
                                <div
                                  className="bg-rose-500 h-full"
                                  style={{ width: `${femalePctNum}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-600 print:text-black print:border print:border-black">
                          {row.disadvantagedCount > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200 print:border-none print:bg-transparent print:text-black">
                              {row.disadvantagedCount} คน
                            </span>
                          ) : (
                            <span className="text-slate-300 print:text-black">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center print:hidden">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Grand Total Summary Row */}
              {filteredRows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/90 border-t-2 border-slate-300 text-xs font-bold text-slate-800 print:bg-slate-100 print:border-t-2 print:border-black print:text-black">
                    <td colSpan={4} className="py-3 px-4 text-right print:border print:border-black">
                      รวมทั้งสิ้น ({overallStats.totalClasses} ห้องเรียน):
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-base text-[#0C7C82] print:text-black print:border print:border-black">
                      {overallStats.totalMale}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-base text-rose-600 print:text-black print:border print:border-black">
                      {overallStats.totalFemale}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-lg font-black text-slate-900 bg-teal-50/50 print:bg-transparent print:border print:border-black">
                      {overallStats.grandTotal}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600 print:text-black print:border print:border-black">
                      ชาย {overallStats.maleRatio}% : หญิง {overallStats.femaleRatio}%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-indigo-700 print:text-black print:border print:border-black">
                      {overallStats.totalDisadvantaged} คน
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 text-[11px] print:hidden">
                      เฉลี่ย {overallStats.avgPerClass} คน/ห้อง
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* 7. Official Signatures Block for Print View */}
      <div className="hidden print:block mt-12 pt-6 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-12">
            <p className="text-slate-800">ลงชื่อ ...........................................................</p>
            <div>
              <p className="font-bold text-slate-900">( ........................................................... )</p>
              <p className="text-slate-600 mt-1">ครูผู้รายงานข้อมูลสถิติ</p>
              <p className="text-slate-500 text-[10px] mt-1">วันที่ ..... เดือน .................... พ.ศ. ........</p>
            </div>
          </div>

          <div className="space-y-12">
            <p className="text-slate-800">ลงชื่อ ...........................................................</p>
            <div>
              <p className="font-bold text-slate-900">
                ( {settings.headOfAcademicName || '...........................................................'} )
              </p>
              <p className="text-slate-600 mt-1">หัวหน้ากลุ่มบริหารงานวิชาการ</p>
              <p className="text-slate-500 text-[10px] mt-1">วันที่ ..... เดือน .................... พ.ศ. ........</p>
            </div>
          </div>

          <div className="space-y-12">
            <p className="text-slate-800">ลงชื่อ ...........................................................</p>
            <div>
              <p className="font-bold text-slate-900">
                ( {settings.directorName || '...........................................................'} )
              </p>
              <p className="text-slate-600 mt-1">ผู้อำนวยการสถานศึกษา</p>
              <p className="text-slate-500 text-[10px] mt-1">วันที่ ..... เดือน .................... พ.ศ. ........</p>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Print Instructions / PDF Export Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#0C7C82]">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">พิมพ์รายงานและดาวน์โหลด PDF</h3>
                  <p className="text-xs text-slate-500">คำแนะนำสำหรับการพิมพ์หรือบันทึกเป็นไฟล์เอกสาร</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-600">
              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#0C7C82] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-teal-900 block mb-0.5">ข้อมูลที่พร้อมพิมพ์:</span>
                  <span>
                    ระดับชั้น: <strong>{currentGradeDisplay}</strong> ({filteredRows.length} ห้องเรียน • รวม {overallStats.grandTotal} คน)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0C7C82]" />
                  <span>วิธีบันทึกเป็นไฟล์ PDF:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-2 text-slate-600">
                  <li>เมื่อกดปุ่ม <strong>"สั่งพิมพ์ทันที"</strong> ด้านล่าง หน้าต่างพิมพ์ของเบราว์เซอร์จะเปิดขึ้น</li>
                  <li>
                    ตรงช่อง <strong>ปลายทาง (Destination)</strong> ให้เลือก <strong>"บันทึกเป็น PDF (Save as PDF)"</strong>
                  </li>
                  <li>
                    เลือกการจัดวางเป็น <strong>"แนวนอน (Landscape)"</strong> เพื่อความสวยงามและแสดงตารางได้ครบถ้วน
                  </li>
                  <li>กดปุ่ม <strong>"บันทึก (Save)"</strong> เพื่อดาวน์โหลดไฟล์ PDF ลงในเครื่องคอมพิวเตอร์ของคุณ</li>
                </ol>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>วิธีพิมพ์ลงกระดาษ A4:</span>
                </div>
                <p className="pl-2 text-slate-600">
                  เลือกเครื่องพิมพ์ที่เชื่อมต่ออยู่ และกำหนดขนาดกระดาษเป็น <strong>A4 แนวนอน</strong> เพื่อการจัดหน้าทางการที่สมบูรณ์แบบ
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] hover:from-[#096368] hover:to-[#2a9491] text-white font-bold text-xs shadow-md shadow-teal-800/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์ทันที (Print Now)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
