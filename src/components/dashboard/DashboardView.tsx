import React, { useEffect, useRef } from 'react';
import {
  Users,
  UserCheck,
  Building2,
  GraduationCap,
  HeartHandshake,
  Calendar,
  TrendingUp,
  Award,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Student, Classroom, AcademicYear, SystemSetting } from '../../types';
import Chart from 'chart.js/auto';

interface DashboardViewProps {
  students: Student[];
  classrooms: Classroom[];
  academicYears: AcademicYear[];
  settings: SystemSetting;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  classrooms,
  academicYears,
  settings,
  onNavigateTab,
}) => {
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement | null>(null);
  const disadvantageChartRef = useRef<HTMLCanvasElement | null>(null);

  const barChartInstance = useRef<Chart | null>(null);
  const doughnutChartInstance = useRef<Chart | null>(null);
  const disadvantageChartInstance = useRef<Chart | null>(null);

  // Stats calculation
  const totalStudents = students.length;
  const maleCount = students.filter(s => s.gender === 'ชาย' || s.gender === 'ช').length;
  const femaleCount = students.filter(s => s.gender === 'หญิง' || s.gender === 'ญ').length;
  const malePct = totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 0;
  const femalePct = totalStudents > 0 ? 100 - malePct : 0;

  const totalClasses = classrooms.length;
  const currentYear = academicYears.find(y => y.isCurrent)?.year || '2567';

  const disadvantagedCount = students.filter(
    s => s.disadvantage && s.disadvantage !== 'ไม่ด้อยโอกาส' && s.disadvantage !== 'ไม่มี' && s.disadvantage !== '-'
  ).length;

  const cannotDischargeCount = students.filter(s => s.cannotDischarge).length;

  // Class breakdown
  const classBreakdown = classrooms.map(c => {
    const list = students.filter(s => s.classLevel === c.className && s.room === c.room);
    const m = list.filter(s => s.gender === 'ชาย' || s.gender === 'ช').length;
    const f = list.filter(s => s.gender === 'หญิง' || s.gender === 'ญ').length;
    return {
      label: `${c.className} / ${c.room}`,
      total: list.length,
      m,
      f,
    };
  });

  // Unique class levels for group aggregation
  const classLevels = Array.from(new Set(classrooms.map(c => c.className)));
  const levelSummary = classLevels.map(lvl => {
    const list = students.filter(s => s.classLevel === lvl);
    const m = list.filter(s => s.gender === 'ชาย' || s.gender === 'ช').length;
    const f = list.filter(s => s.gender === 'หญิง' || s.gender === 'ญ').length;
    return {
      level: lvl,
      total: list.length,
      male: m,
      female: f,
      pct: totalStudents > 0 ? Math.round((list.length / totalStudents) * 100) : 0,
    };
  });

  // Disadvantage categories
  const disadvantageCounts: Record<string, number> = {};
  students.forEach(s => {
    const d = s.disadvantage || 'ไม่ด้อยโอกาส';
    disadvantageCounts[d] = (disadvantageCounts[d] || 0) + 1;
  });

  // Render Charts
  useEffect(() => {
    // 1. Bar Chart: Students by class level and gender
    if (barChartRef.current) {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const labels = levelSummary.map(l => l.level);
      const maleData = levelSummary.map(l => l.male);
      const femaleData = levelSummary.map(l => l.female);

      barChartInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'ชาย (คน)',
              data: maleData,
              backgroundColor: '#0C7C82',
              borderRadius: 6,
            },
            {
              label: 'หญิง (คน)',
              data: femaleData,
              backgroundColor: '#FF8A65',
              borderRadius: 6,
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
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Sarabun', size: 11 } },
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 2, font: { family: 'Sarabun', size: 11 } },
              grid: { color: '#f1f5f9' },
            },
          },
        },
      });
    }

    // 2. Doughnut Chart: Gender Breakdown
    if (doughnutChartRef.current) {
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy();
      }

      doughnutChartInstance.current = new Chart(doughnutChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['ชาย', 'หญิง'],
          datasets: [
            {
              data: [maleCount, femaleCount],
              backgroundColor: ['#0C7C82', '#FF8A65'],
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: 'Sarabun', size: 12 },
              },
            },
          },
          cutout: '68%',
        },
      });
    }

    // 3. Polar Area / Disadvantage Chart
    if (disadvantageChartRef.current) {
      if (disadvantageChartInstance.current) {
        disadvantageChartInstance.current.destroy();
      }

      const dLabels = Object.keys(disadvantageCounts);
      const dData = Object.values(disadvantageCounts);
      const palette = ['#26A69A', '#AED581', '#FFCA28', '#EF5350', '#0288D1', '#4A2C6D'];

      disadvantageChartInstance.current = new Chart(disadvantageChartRef.current, {
        type: 'pie',
        data: {
          labels: dLabels,
          datasets: [
            {
              data: dData,
              backgroundColor: palette.slice(0, dLabels.length),
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: 'Sarabun', size: 11 },
              },
            },
          },
        },
      });
    }

    return () => {
      barChartInstance.current?.destroy();
      doughnutChartInstance.current?.destroy();
      disadvantageChartInstance.current?.destroy();
    };
  }, [students, classrooms, levelSummary]);

  return (
    <div className="space-y-6">
      {/* Header Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0C7C82] via-[#26A69A] to-[#35B4B0] rounded-3xl p-6 text-white shadow-xl shadow-teal-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
              แดชบอร์ดสรุปผล
            </span>
            <span className="text-teal-100 text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> ปีการศึกษา {currentYear}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            ภาพรวมข้อมูลนักเรียน {settings.schoolName || 'โรงเรียนศรีสุทโธ'}
          </h2>
          <p className="text-teal-100 text-xs md:text-sm mt-0.5">
            {settings.affiliation || 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('students')}
            className="px-4 py-2 rounded-xl bg-white text-[#0C7C82] hover:bg-teal-50 font-semibold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> จัดการนักเรียน
          </button>
          <button
            onClick={() => onNavigateTab('studentReport')}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-xs backdrop-blur-xs border border-white/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4" /> สรุปสถิติรายชั้น
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#0C7C82]">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
              รวมทั้งหมด
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            {totalStudents} <span className="text-sm font-normal text-slate-500">คน</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            จากทั้งหมด {totalClasses} ห้องเรียน
          </p>
        </div>

        {/* Card 2: Male Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-[#0C7C82]">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
              {malePct}% ของทั้งหมด
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            {maleCount} <span className="text-sm font-normal text-slate-500">คน</span>
          </div>
          {/* Progress fill */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-[#0C7C82] h-full rounded-full transition-all duration-500"
              style={{ width: `${malePct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">นักเรียนชาย</p>
        </div>

        {/* Card 3: Female Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-[#FF8A65]">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
              {femalePct}% ของทั้งหมด
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            {femaleCount} <span className="text-sm font-normal text-slate-500">คน</span>
          </div>
          {/* Progress fill */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-[#FF8A65] h-full rounded-full transition-all duration-500"
              style={{ width: `${femalePct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">นักเรียนหญิง</p>
        </div>

        {/* Card 4: Disadvantaged & Special Needs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-[#FFCA28]">
              <HeartHandshake className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              ช่วยเหลือ
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            {disadvantagedCount} <span className="text-sm font-normal text-slate-500">คน</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            ยังไม่จำหน่าย {cannotDischargeCount} คน
          </p>
        </div>
      </div>

      {/* Charts Row: Chart.js Canvas Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart: Class Level Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                จำนวนนักเรียนจำแนกตามระดับชั้นและเพศ
              </h3>
              <p className="text-xs text-slate-500">
                เปรียบเทียบสัดส่วนนักเรียนชาย-หญิงในแต่ละช่วงชั้น
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              Chart.js Bar
            </span>
          </div>
          <div className="h-72 w-full">
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>

        {/* Doughnut Chart: Gender Ratio */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-800">
                สัดส่วนเพศนักเรียน
              </h3>
              <span className="text-xs font-medium px-2 py-0.5 bg-teal-50 text-teal-700 rounded-lg">
                ภาพรวม
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              ชาย {maleCount} คน ({malePct}%) | หญิง {femaleCount} คน ({femalePct}%)
            </p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <canvas ref={doughnutChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Second Row: Level Progress Fills & Disadvantage Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Progress Bars */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">
              ความหนาแน่นนักเรียนแต่ละระดับชั้น (Progress Fill)
            </h3>
            <span className="text-xs text-slate-400">คิดเป็น % ของทั้งโรงเรียน</span>
          </div>

          <div className="space-y-4">
            {levelSummary.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">ยังไม่มีข้อมูลชั้นเรียน</div>
            ) : (
              levelSummary.map((lvl, index) => {
                const colors = ['#0C7C82', '#35B4B0', '#26A69A', '#AED581', '#FFCA28', '#FF8A65'];
                const color = colors[index % colors.length];
                return (
                  <div key={lvl.level}>
                    <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                      <span className="text-slate-700 font-bold">{lvl.level}</span>
                      <span className="text-slate-500">
                        {lvl.total} คน (ชาย {lvl.male} / หญิง {lvl.female}) &bull; <strong className="text-slate-700">{lvl.pct}%</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(lvl.pct, 4)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Disadvantage Category Breakdown Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-800">
                สถานะความด้อยโอกาสของนักเรียน
              </h3>
              <span className="text-xs font-medium px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg">
                กลุ่มช่วยเหลือ
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              จำแนกตามประเภทความต้องการรับการสนับสนุนทางการศึกษา
            </p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <canvas ref={disadvantageChartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};
