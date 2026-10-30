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

  const count = meta.blankColCount || 1;
  const isSingleWide = count === 1;

  // Dynamic font and cell height scaling based on row count
  const docFontSize = meta.fontSize || (students.length > 40 ? '9.5pt' : students.length > 32 ? '10.5pt' : students.length > 24 ? '11.5pt' : students.length > 18 ? '12.5pt' : '14pt');
  const cellHeight = students.length > 35 ? '18px' : students.length > 25 ? '22px' : '26px';
  const cellPadding = students.length > 35 ? '1px 2px' : '2px 3px';

  // Header columns:
  // Column sequence: ลำดับ -> (รหัส) -> (เลขปชช) -> (ชื่อนักเรียน) -> (วันเกิด) -> (ผู้ปกครอง) -> (เลขปชชผู้ปกครอง) -> [ช่องเปล่า] -> หมายเหตุ
  let headerThs = `<th style="width: 35px; text-align: center;">ลำดับ</th>`;
  if (meta.showStudentId) headerThs += `<th style="width: 70px; text-align: center;">รหัสนักเรียน</th>`;
  if (meta.showCitizenId) headerThs += `<th style="width: 105px; text-align: center;">เลขประจำตัวประชาชน</th>`;
  if (meta.showFullName) headerThs += `<th style="width: 140px; text-align: left;">ชื่อ - นามสกุล</th>`;
  if (meta.showBirthDate) headerThs += `<th style="width: 90px; text-align: center;">วันเกิด</th>`;
  if (meta.showGuardianName) headerThs += `<th style="width: 120px; text-align: left;">ชื่อผู้ปกครอง</th>`;
  if (meta.showGuardianCitizenId) headerThs += `<th style="width: 105px; text-align: center;">เลขประชาชนผู้ปกครอง</th>`;

  // Blank check columns
  if (isSingleWide) {
    headerThs += `<th style="min-width: 140px; border: 1px solid #000; padding: ${cellPadding}; text-align: center; font-size: ${docFontSize}; background-color: #f9f9f9; color: #000;"></th>`;
  } else {
    for (let i = 0; i < count; i++) {
      headerThs += `<th style="width: 20px; min-width: 20px; max-width: 20px; border: 1px solid #000; padding: ${cellPadding}; text-align: center; font-size: ${docFontSize}; background-color: #f9f9f9; color: #000;"></th>`;
    }
  }

  headerThs += `<th style="width: 70px; text-align: center;">หมายเหตุ</th>`;

  const rows = students.map((s, idx) => {
    let rowTds = `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000;">${idx + 1}</td>`;
    if (meta.showStudentId) rowTds += `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000;">${s.studentId}</td>`;
    if (meta.showCitizenId) rowTds += `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000;">${s.citizenId || '-'}</td>`;
    if (meta.showFullName) rowTds += `<td style="border: 1px solid #000; padding: ${cellPadding}; font-size: ${docFontSize}; white-space: nowrap; margin: 0; font-weight: normal; color: #000;">${s.prefix}${s.firstName} ${s.lastName}</td>`;
    if (meta.showBirthDate) rowTds += `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; white-space: nowrap; margin: 0; font-weight: normal; color: #000;">${formatThaiBirthDate(s.birthDate)}</td>`;
    if (meta.showGuardianName) rowTds += `<td style="border: 1px solid #000; padding: ${cellPadding}; font-size: ${docFontSize}; white-space: nowrap; margin: 0; font-weight: normal; color: #000;">${s.guardianPrefix || ''}${s.guardianFirstName || ''} ${s.guardianLastName || ''}</td>`;
    if (meta.showGuardianCitizenId) rowTds += `<td style="border: 1px solid #000; text-align: center; padding: ${cellPadding}; font-size: ${docFontSize}; margin: 0; font-weight: normal; color: #000;">${s.guardianCitizenId || '-'}</td>`;

    // Blank column(s) - left side touches student name, right side touches remarks
    if (isSingleWide) {
      rowTds += `<td style="min-width: 140px; border: 1px solid #000; height: ${cellHeight}; padding: 0; margin: 0;"></td>`;
    } else {
      for (let i = 0; i < count; i++) {
        rowTds += `<td style="width: 20px; min-width: 20px; max-width: 20px; border: 1px solid #000; height: ${cellHeight}; padding: 0; margin: 0;"></td>`;
      }
    }

    rowTds += `<td style="border: 1px solid #000; padding: ${cellPadding}; font-size: ${docFontSize}; text-align: center; margin: 0; font-weight: normal; color: #000;">${s.cannotDischarge ? 'ยังไม่จำหน่าย' : ''}</td>`;

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
          margin-top: 1cm;
          margin-bottom: 1cm;
          margin-left: 1cm;
          margin-right: 1cm;
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
        <div class="subtitle" style="font-weight: bold; font-size: 14pt; margin-top: 2px;">
          บัญชีรายชื่อนักเรียน.............................................................
        </div>
        <div class="subtitle" style="margin-top: 2px; font-size: 14pt;">
          ชั้น: <b>${meta.classLevel}</b> &nbsp;&nbsp;&nbsp; ห้อง: <b>${meta.room}</b> &nbsp;&nbsp;&nbsp; ปีการศึกษา: <b>${meta.academicYear}</b> &nbsp;&nbsp;&nbsp; ครูประจำชั้น: <b>${meta.teacherName || '...................................................'}</b>
        </div>
        <div class="subtitle" style="margin-top: 2px; font-size: 14pt;">
          จำนวนนักเรียนทั้งหมด: <b>${students.length}</b> คน (ชาย: <b>${maleCount}</b> คน, หญิง: <b>${femaleCount}</b> คน)
        </div>
      </div>

      <table>
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
