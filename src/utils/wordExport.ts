import { Student } from '../types';

export function exportClassRosterToWord(
  students: Student[],
  meta: {
    schoolName: string;
    affiliation: string;
    classLevel: string;
    room: string;
    academicYear: string;
    teacherName: string;
  }
) {
  const maleCount = students.filter(s => s.gender === 'ชาย' || s.gender === 'ช').length;
  const femaleCount = students.filter(s => s.gender === 'หญิง' || s.gender === 'ญ').length;

  // 10 equal width check columns fitting A4 portrait width
  const headerCols = Array.from({ length: 10 }, () => `<th style="width: 18px; min-width: 18px; max-width: 18px; border: 1px solid #000; padding: 2px; text-align: center; font-size: 12pt; background-color: #f9f9f9; color: #000;"></th>`).join('');

  const rows = students.map((s, idx) => {
    const blankCols = Array.from({ length: 10 }, () => `<td style="width: 18px; min-width: 18px; max-width: 18px; border: 1px solid #000; height: 24px; padding: 0; margin: 0;"></td>`).join('');
    return `
      <tr>
        <td style="border: 1px solid #000; text-align: center; padding: 2px; font-size: 12pt; margin: 0; font-weight: normal; color: #000;">${idx + 1}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 2px; font-size: 12pt; margin: 0; font-weight: normal; color: #000;">${s.studentId}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 2px; font-size: 12pt; margin: 0; font-weight: normal; color: #000;">${s.citizenId || '-'}</td>
        <td style="border: 1px solid #000; padding: 2px 4px; font-size: 12pt; white-space: nowrap; margin: 0; font-weight: normal; color: #000;">${s.prefix}${s.firstName} ${s.lastName}</td>
        ${blankCols}
        <td style="border: 1px solid #000; padding: 2px; font-size: 12pt; text-align: center; margin: 0; font-weight: normal; color: #000;">${s.cannotDischarge ? 'ยังไม่จำหน่าย' : ''}</td>
      </tr>
    `;
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
          font-size: 12pt;
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
          font-size: 12pt;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 4px;
        }
        .title {
          font-size: 14pt;
          font-weight: bold;
          color: #000;
        }
        .subtitle {
          font-size: 12pt;
          color: #000;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 3px;
          font-size: 12pt;
          color: #000;
        }
        th, td {
          border: 1px solid #000;
          padding: 2px 3px;
          margin: 0;
          font-size: 12pt;
          color: #000;
          font-weight: normal;
        }
        th {
          background-color: #f2f2f2;
          font-size: 12pt;
          font-weight: bold;
          color: #000;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${meta.schoolName}</div>
        <div class="subtitle" style="font-weight: bold; font-size: 13pt; margin-top: 2px;">
          บัญชีรายชื่อนักเรียน.............................................................
        </div>
        <div class="subtitle" style="margin-top: 2px; font-size: 12pt;">
          ชั้น: <b>${meta.classLevel}</b> &nbsp;&nbsp;&nbsp; ห้อง: <b>${meta.room}</b> &nbsp;&nbsp;&nbsp; ปีการศึกษา: <b>${meta.academicYear}</b> &nbsp;&nbsp;&nbsp; ครูประจำชั้น: <b>${meta.teacherName || '...................................................'}</b>
        </div>
        <div class="subtitle" style="margin-top: 2px; font-size: 12pt;">
          จำนวนนักเรียนทั้งหมด: <b>${students.length}</b> คน (ชาย: <b>${maleCount}</b> คน, หญิง: <b>${femaleCount}</b> คน)
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 35px; text-align: center;">ลำดับ</th>
            <th rowspan="2" style="width: 70px; text-align: center;">รหัสนักเรียน</th>
            <th rowspan="2" style="width: 105px; text-align: center;">เลขประจำตัวประชาชน</th>
            <th rowspan="2" style="width: 140px; text-align: left;">ชื่อ - นามสกุล</th>
            <th colspan="10" style="background-color: #f2f2f2;"></th>
            <th rowspan="2" style="width: 70px; text-align: center;">หมายเหตุ</th>
          </tr>
          <tr>
            ${headerCols}
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
