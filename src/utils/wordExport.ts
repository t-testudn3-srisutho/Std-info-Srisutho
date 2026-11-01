import { Student } from '../types';

export function formatThaiBirthDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return '-';
  const clean = dateStr.trim();
  const parts = clean.split(/[-/.]/);
  if (parts.length >= 3) {
    let d = 0;
    let m = 0;
    let y = 0;

    // Determine if format is YYYY-MM-DD or DD/MM/YYYY
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // DD/MM/YYYY
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    } else {
      const p0 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[2], 10);
      if (p0 > 31) {
        y = p0;
        m = parseInt(parts[1], 10);
        d = p2;
      } else {
        d = p0;
        m = parseInt(parts[1], 10);
        y = p2;
      }
    }

    if (isNaN(d) || isNaN(m) || isNaN(y)) return dateStr;

    // Convert CE to Buddhist Era (BE) if < 2400
    if (y < 2400) {
      y += 543;
    }

    const thaiMonths = [
      '',
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    const monthStr = thaiMonths[m] || `${m}`;
    return `${d} ${monthStr} ${y}`;
  }
  return dateStr;
}

export interface RosterOptions {
  schoolName: string;
  affiliation: string;
  classLevel: string;
  room: string;
  academicYear: string;
  teacherName: string;
  blankColCount: number;
  showStudentId: boolean;
  showCitizenId: boolean;
  showFullName: boolean;
  showBirthDate: boolean;
  showGuardianName: boolean;
  showGuardianCitizenId: boolean;
  fontSize?: string;
}

export function exportClassRosterToWord(
  students: Student[],
  meta: RosterOptions
) {
  const maleCount = students.filter(s => s.gender === 'ชาย' || s.gender === 'ช').length;
  const femaleCount = students.filter(s => s.gender === 'หญิง' || s.gender === 'ญ').length;

  const count = typeof meta.blankColCount === 'number' ? Math.min(15, Math.max(0, meta.blankColCount)) : 1;

  // Calculate active column count
  let activeInfoCols = 2; // ลำดับ + หมายเหตุ
  if (meta.showStudentId) activeInfoCols++;
  if (meta.showCitizenId) activeInfoCols++;
  if (meta.showFullName) activeInfoCols++;
  if (meta.showBirthDate) activeInfoCols++;
  if (meta.showGuardianName) activeInfoCols++;
  if (meta.showGuardianCitizenId) activeInfoCols++;
  const totalCols = activeInfoCols + count;

  // 1. Column count scaling (Horizontal overflow prevention)
  let colFontNum = 14;
  let cellPadding = '2px 3px';
  if (totalCols > 20) {
    colFontNum = 7.5;
    cellPadding = '1px 1px';
  } else if (totalCols > 16) {
    colFontNum = 8.5;
    cellPadding = '1px 2px';
  } else if (totalCols > 12) {
    colFontNum = 9.5;
    cellPadding = '1.5px 2px';
  } else if (totalCols > 8) {
    colFontNum = 11;
    cellPadding = '2px 2.5px';
  } else if (totalCols > 5) {
    colFontNum = 12.5;
    cellPadding = '2px 3px';
  }

  // 2. Row count scaling (Vertical overflow prevention on A4)
  let rowFontNum = 14;
  let cellHeight = '24px';
  if (students.length > 40) {
    rowFontNum = 9.5;
    cellHeight = '16px';
    cellPadding = '1px 1.5px';
  } else if (students.length > 32) {
    rowFontNum = 10.5;
    cellHeight = '18px';
    cellPadding = '1.5px 2px';
  } else if (students.length > 24) {
    rowFontNum = 11.5;
    cellHeight = '20px';
  } else if (students.length > 18) {
    rowFontNum = 12.5;
    cellHeight = '22px';
  }

  const effectiveFontSizeNum = Math.min(rowFontNum, colFontNum);
  const docFontSize = meta.fontSize || `${effectiveFontSizeNum}pt`;

  // Calculate exact percentage weights so total is strictly 100%
  const orderW = 4.5;
  const studentIdW = meta.showStudentId ? 8.5 : 0;
  const citizenIdW = meta.showCitizenId ? 14.5 : 0;
  const fullNameW = meta.showFullName ? (meta.showGuardianName ? 24 : 33) : 0;
  const birthDateW = meta.showBirthDate ? 11 : 0;
  const guardianNameW = meta.showGuardianName ? 23 : 0;
  const guardianCitizenIdW = meta.showGuardianCitizenId ? 14.5 : 0;
  const remarksW = 9.5;

  const infoTotalW = orderW + studentIdW + citizenIdW + fullNameW + birthDateW + guardianNameW + guardianCitizenIdW + remarksW;

  let blankPoolW: number;
  if (count <= 0) {
    blankPoolW = 0;
  } else if (infoTotalW <= 50) {
    blankPoolW = count === 1 ? 52 : Math.max(50, count * 5);
  } else if (infoTotalW <= 80) {
    blankPoolW = count === 1 ? 28 : Math.max(30, count * 3.8);
  } else {
    blankPoolW = count === 1 ? 16 : Math.max(22, count * 2.5);
  }

  const totalW = infoTotalW + blankPoolW;
  const orderPct = (orderW / totalW) * 100;
  const studentIdPct = (studentIdW / totalW) * 100;
  const citizenIdPct = (citizenIdW / totalW) * 100;
  const fullNamePct = (fullNameW / totalW) * 100;
  const birthDatePct = (birthDateW / totalW) * 100;
  const guardianNamePct = (guardianNameW / totalW) * 100;
  const guardianCitizenIdPct = (guardianCitizenIdW / totalW) * 100;
  const eachBlankPct = count > 0 ? ((blankPoolW / count) / totalW) * 100 : 0;
  const remarksPct = (remarksW / totalW) * 100;

  // Header columns (strictly single-line)
  let headerThs = `<th style="border: 1px solid #000; padding: ${cellPadding}; text-align: center; font-size: ${docFontSize}; background-color: #f2f2f2; color: #000; white-space: nowrap; overflow: hidden;">ลำดับ</th>`;
  if (meta.showStudentId) headerThs += `<th style="border: 1px solid #000; padding: ${cellPadding}; text-align: center; font-size: ${docFontSize}; background-color: #f2f2f2; color: #000; white-space: nowrap; overflow: hidden;">รหัสนักเรียน</th>`;
  if (meta.showCitizenId) headerThs += `<th style="border: 1px solid #000; padding: ${cellPadding}; text-align: center; font-size: ${docFontSize}; background-color: #f2f2f2; color: #000; white-space: nowrap; overflow: hidden;">เลขประจำตัวประชาชน</th>`;
  if (meta.showFullName) headerThs += `<th style="border: 1px solid #000; padding: ${cellPadding}; text-align: left; font-size: ${docFontSize}; background-color: #f2f2f2; color: #000; white-space: nowrap; overflow: hidden;">ชื่อ - นามสกุล</th>`;
  if (meta.showBirthDate) headerThs += `<th style="border: 1px solid #000; padding: ${cellPadding}; text-align: center; font-size: ${docFontSize}; background-color: #f2f2f2; color: #000; white-space: nowrap; overflow: hidden;">วันเกิด</th>`;
  if (meta.showGuardianName) headerThs += `<th style="border: 1px solid #000; padding: ${cellPadding}; text-align: left; font-size: ${docFontSize}; background-color: #f2f2f2; color: #000; white-space: nowrap; overflow: hidden;">ชื่อผู้ปกครอง</th>`;
  if (meta.showGuardianCitizenId) headerThs += `<th style="border: 1px solid #000; padding: ${cellPadding}; text-align: center; font-size: ${docFontSize}; background-color: #f2f2f2; color: #000; white-space: nowrap; overflow: hidden;">เลขประชาชนผู้ปกครอง</th>`;

  // Blank check columns - each expands equally
  for (let i = 0; i < count; i++) {
    headerThs += `<th style="border: 1px solid #000; padding: ${cellPadding}; text-align: center; font-size: ${docFontSize}; background-color: #f9f9f9; color: #000; white-space: nowrap;"></th>`;
  }

  headerThs += `<th style="border: 1px solid #000; padding: ${cellPadding}; text-align: center; font-size: ${docFontSize}; background-color: #f2f2f2; color: #000; white-space: nowrap; overflow: hidden;">หมายเหตุ</th>`;

  const rows = students.map((s, idx) => {
    let rowTds = `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000; white-space: nowrap; overflow: hidden;">${idx + 1}</td>`;
    if (meta.showStudentId) rowTds += `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000; white-space: nowrap; overflow: hidden;">${s.studentId}</td>`;
    if (meta.showCitizenId) rowTds += `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000; white-space: nowrap; overflow: hidden;">${s.citizenId || '-'}</td>`;
    if (meta.showFullName) rowTds += `<td style="border: 1px solid #000; text-align: left; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000; white-space: nowrap; overflow: hidden;">${s.prefix}${s.firstName} ${s.lastName}</td>`;
    if (meta.showBirthDate) rowTds += `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000; white-space: nowrap; overflow: hidden;">${formatThaiBirthDate(s.birthDate)}</td>`;
    if (meta.showGuardianName) rowTds += `<td style="border: 1px solid #000; text-align: left; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000; white-space: nowrap; overflow: hidden;">${s.guardianPrefix || ''}${s.guardianFirstName || ''} ${s.guardianLastName || ''}</td>`;
    if (meta.showGuardianCitizenId) rowTds += `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000; white-space: nowrap; overflow: hidden;">${s.guardianCitizenId || '-'}</td>`;

    // Blank column(s) - all expanding equally, contiguous between info and remarks
    for (let i = 0; i < count; i++) {
      rowTds += `<td style="border: 1px solid #000; height: ${cellHeight}; padding: 0; margin: 0; background-color: #ffffff;"></td>`;
    }

    rowTds += `<td style="border: 1px solid #000; padding: ${cellPadding}; font-size: ${docFontSize}; text-align: center; margin: 0; font-weight: normal; color: #000; white-space: nowrap; overflow: hidden;">${s.cannotDischarge ? 'ยังไม่จำหน่าย' : ''}</td>`;

    return `<tr>${rowTds}</tr>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>บัญชีรายชื่อนักเรียน ${meta.classLevel} ห้อง ${meta.room}</title>
      <style>
        @page {
          size: A4 portrait;
          margin-top: 0.8cm;
          margin-bottom: 0.8cm;
          margin-left: 0.8cm;
          margin-right: 0.8cm;
        }
        body {
          font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
          color: #000;
          font-size: ${docFontSize};
          margin: 0;
          padding: 0;
          line-height: 1.15;
        }
        p, div, span, table, th, td {
          margin: 0;
          padding: 0;
          margin-top: 0;
          margin-bottom: 0;
          line-height: 1.15;
          font-size: ${docFontSize};
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 4px;
        }
        .title {
          font-size: 13.5pt;
          font-weight: bold;
          color: #000;
        }
        .subtitle {
          font-size: ${docFontSize};
          color: #000;
        }
        table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          margin-top: 3px;
          font-size: ${docFontSize};
          color: #000;
        }
        th, td {
          border: 1px solid #000;
          padding: ${cellPadding};
          margin: 0;
          font-size: ${docFontSize};
          color: #000;
          font-weight: normal;
          overflow: hidden;
        }
        th {
          background-color: #f2f2f2;
          font-size: ${docFontSize};
          font-weight: bold;
          color: #000;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${meta.schoolName}</div>
        <div class="subtitle" style="font-weight: bold; font-size: 13.5pt; margin-top: 2px;">
          บัญชีรายชื่อนักเรียน.............................................................
        </div>
        <div class="subtitle" style="margin-top: 2px; font-size: ${docFontSize};">
          ชั้น: <b>${meta.classLevel}</b> &nbsp;&nbsp;&nbsp; ห้อง: <b>${meta.room}</b> &nbsp;&nbsp;&nbsp; ปีการศึกษา: <b>${meta.academicYear}</b>
        </div>
        <div class="subtitle" style="margin-top: 2px; font-size: ${docFontSize};">
          ครูประจำชั้น: <b>${meta.teacherName || '...................................................'}</b>
        </div>
        <div class="subtitle" style="margin-top: 2px; font-size: ${docFontSize};">
          จำนวนนักเรียนทั้งหมด: <b>${students.length}</b> คน (ชาย: <b>${maleCount}</b> คน, หญิง: <b>${femaleCount}</b> คน)
        </div>
      </div>

      <table>
        <colgroup>
          <col style="width: ${orderPct.toFixed(2)}%;" />
          ${meta.showStudentId ? `<col style="width: ${studentIdPct.toFixed(2)}%;" />` : ''}
          ${meta.showCitizenId ? `<col style="width: ${citizenIdPct.toFixed(2)}%;" />` : ''}
          ${meta.showFullName ? `<col style="width: ${fullNamePct.toFixed(2)}%;" />` : ''}
          ${meta.showBirthDate ? `<col style="width: ${birthDatePct.toFixed(2)}%;" />` : ''}
          ${meta.showGuardianName ? `<col style="width: ${guardianNamePct.toFixed(2)}%;" />` : ''}
          ${meta.showGuardianCitizenId ? `<col style="width: ${guardianCitizenIdPct.toFixed(2)}%;" />` : ''}
          ${Array.from({ length: count }, () => `<col style="width: ${eachBlankPct.toFixed(2)}%;" />`).join('')}
          <col style="width: ${remarksPct.toFixed(2)}%;" />
        </colgroup>
        <thead>
          <tr>
            ${headerThs}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `บัญชีรายชื่อ_${meta.classLevel}_ห้อง_${meta.room}_ปี${meta.academicYear}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
