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
  const headerCols = Array.from({ length: 15 }, (_, i) => `<th style="width: 28px; border: 1px solid #333; padding: 4px; text-align: center; font-size: 11pt;">${i + 1}</th>`).join('');

  const rows = students.map((s, idx) => {
    const blankCols = Array.from({ length: 15 }, () => `<td style="border: 1px solid #333; height: 26px;"></td>`).join('');
    return `
      <tr>
        <td style="border: 1px solid #333; text-align: center; padding: 4px; font-size: 11pt;">${idx + 1}</td>
        <td style="border: 1px solid #333; text-align: center; padding: 4px; font-size: 11pt;">${s.studentId}</td>
        <td style="border: 1px solid #333; text-align: center; padding: 4px; font-size: 11pt;">${s.citizenId || '-'}</td>
        <td style="border: 1px solid #333; padding: 4px 8px; font-size: 11pt; white-space: nowrap;">${s.prefix}${s.firstName} ${s.lastName}</td>
        ${blankCols}
        <td style="border: 1px solid #333; padding: 4px; font-size: 10pt; text-align: center;">${s.cannotDischarge ? 'ยังไม่จำหน่าย' : ''}</td>
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
          size: landscape;
          margin: 1.5cm;
        }
        body {
          font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 16px;
        }
        .title {
          font-size: 16pt;
          font-weight: bold;
        }
        .subtitle {
          font-size: 13pt;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background-color: #f2f2f2;
          border: 1px solid #333;
          padding: 6px 4px;
          font-size: 11pt;
        }
        .footer {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          font-size: 12pt;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${meta.schoolName}</div>
        <div class="subtitle">${meta.affiliation}</div>
        <div class="subtitle">
          <b>แบบบันทึกข้อมูลและบัญชีรายชื่อนักเรียน</b> ชั้น ${meta.classLevel} ห้อง ${meta.room} ประจำปีการศึกษา ${meta.academicYear}
        </div>
        <div class="subtitle" style="margin-top: 4px;">
          ครูประจำชั้น: <b>${meta.teacherName || '...................................................'}</b> &nbsp;&nbsp;&nbsp;&nbsp; จำนวนนักเรียนทั้งหมด: <b>${students.length}</b> คน
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 40px;">ลำดับ</th>
            <th rowspan="2" style="width: 80px;">รหัสนักเรียน</th>
            <th rowspan="2" style="width: 120px;">เลขประจำตัวประชาชน</th>
            <th rowspan="2" style="width: 200px;">ชื่อ - นามสกุล</th>
            <th colspan="15">ช่องคะแนน / วันที่เช็คชื่อ (1 - 15)</th>
            <th rowspan="2" style="width: 90px;">หมายเหตุ</th>
          </tr>
          <tr>
            ${headerCols}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <br/>
      <div style="width: 100%; text-align: right; margin-top: 30px; font-size: 12pt;">
        ลงชื่อ............................................................ครูประจำชั้น<br/>
        ( ${meta.teacherName || '...................................................'} )<br/>
        วันที่ ......... / ......... / ...............
      </div>
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
