import * as XLSX from 'xlsx';
import { Classroom, AppUser, Student } from '../types';

// ==================== CLASSROOM EXCEL ====================
export function exportClassroomsToExcel(classes: Classroom[], filename = 'รายการชั้นเรียน.xlsx') {
  const data = classes.map((c, index) => ({
    'ลำดับที่': c.orderSeq || index + 1,
    'ชื่อชั้นเรียน': c.className,
    'ห้อง': c.room,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ชั้นเรียน');
  XLSX.writeFile(wb, filename);
}

export function downloadClassroomTemplate() {
  const sample = [
    { 'ลำดับที่': 1, 'ชื่อชั้นเรียน': 'มัธยมศึกษาปีที่ 1', 'ห้อง': '1' },
    { 'ลำดับที่': 2, 'ชื่อชั้นเรียน': 'มัธยมศึกษาปีที่ 1', 'ห้อง': '2' },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Classroom');
  XLSX.writeFile(wb, 'เทมเพลต_ชั้นเรียน.xlsx');
}

export async function parseClassroomsFromExcel(file: File): Promise<Partial<Classroom>[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[firstSheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return json.map((row, idx) => {
    const className = String(row['ชื่อชั้นเรียน'] || row['ชั้น'] || row['className'] || '').trim();
    const room = String(row['ห้อง'] || row['room'] || '').trim();
    const orderSeq = Number(row['ลำดับที่'] || row['orderSeq'] || idx + 1);
    return {
      id: `c_${Date.now()}_${idx}`,
      className,
      room,
      orderSeq: isNaN(orderSeq) ? idx + 1 : orderSeq,
    };
  }).filter(c => c.className && c.room);
}

// ==================== USER EXCEL ====================
export function exportUsersToExcel(users: AppUser[], filename = 'รายการผู้ใช้งานระบบ.xlsx') {
  const data = users.map((u, index) => ({
    'ลำดับ': index + 1,
    'ชื่อผู้ใช้ (Username)': u.username,
    'รหัสผ่าน (Password)': u.password || '******',
    'ชื่อ-นามสกุล': u.fullName,
    'บทบาท': u.role,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ผู้ใช้งาน');
  XLSX.writeFile(wb, filename);
}

export function downloadUserTemplate() {
  const sample = [
    { 'ชื่อผู้ใช้ (Username)': 'teacher1', 'รหัสผ่าน (Password)': '123456', 'ชื่อ-นามสกุล': 'ครูสมชาย มุ่งมั่น', 'บทบาท': 'ครู' },
    { 'ชื่อผู้ใช้ (Username)': 'admin1', 'รหัสผ่าน (Password)': 'admin123', 'ชื่อ-นามสกุล': 'ผู้ดูแลระบบ', 'บทบาท': 'ผู้ดูแลระบบ' },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Users');
  XLSX.writeFile(wb, 'เทมเพลต_ผู้ใช้งาน.xlsx');
}

export async function parseUsersFromExcel(file: File): Promise<Partial<AppUser>[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return json.map((row, idx) => {
    const username = String(row['ชื่อผู้ใช้ (Username)'] || row['username'] || row['ชื่อผู้ใช้'] || '').trim();
    const password = String(row['รหัสผ่าน (Password)'] || row['password'] || row['รหัสผ่าน'] || '123456').trim();
    const fullName = String(row['ชื่อ-นามสกุล'] || row['fullName'] || row['ชื่อ'] || '').trim();
    const roleRaw = String(row['บทบาท'] || row['role'] || 'ครู').trim();
    const role = roleRaw.includes('ผู้ดูแล') || roleRaw.toLowerCase().includes('admin') ? 'ผู้ดูแลระบบ' : 'ครู';

    return {
      id: `u_${Date.now()}_${idx}`,
      username,
      password,
      fullName,
      role: role as 'ครู' | 'ผู้ดูแลระบบ',
    };
  }).filter(u => u.username && u.fullName);
}

// ==================== STUDENT EXCEL WITH EXACT REQUESTED COLUMNS ====================
export function exportStudentsToExcel(students: Student[], filename = 'ข้อมูลนักเรียนทั้งหมด.xlsx') {
  const data = students.map((s) => {
    const genderText = s.gender === 'หญิง' || s.gender === 'ญ' ? 'หญิง' : 'ชาย';
    return {
      'รหัสโรงเรียน': s.schoolId || '',
      'ชื่อโรงเรียน': s.schoolName || '',
      'เลขประจำตัวประชาชน': s.citizenId || '',
      'ชั้น': s.classLevel || '',
      'ห้อง': s.room || '',
      'รหัสนักเรียน': s.studentId || '',
      'เพศ': genderText,
      'คำนำหน้าชื่อ': s.prefix || '',
      'ชื่อ': s.firstName || '',
      'นามสกุล': s.lastName || '',
      'ชื่อ (อังกฤษ)': s.firstNameEn || '',
      'นามสกุล (อังกฤษ)': s.lastNameEn || '',
      'วันเกิด': s.birthDate || '',
      'อายุ(ปี)': s.ageYears || 0,
      'อายุ(เดือน)': s.ageMonths || 0,
      'หมู่โลหิต': s.bloodGroup || '',
      'สัญชาติ': s.nationality || '',
      'เชื้อชาติ': s.ethnicity || '',
      'ศาสนา': s.religion || '',
      'จำนวนพี่ชาย': s.olderBrothers || 0,
      'จำนวนน้องชาย': s.youngerBrothers || 0,
      'จำนวนพี่สาว': s.olderSisters || 0,
      'จำนวนน้องสาว': s.youngerSisters || 0,
      'เป็นบุตรคนที่': s.childOrder || 1,
      'สถานภาพสมรสของบิดามารดา': s.maritalStatusParents || '',
      'หมายเลขบัตรประชาชนบิดา': s.fatherCitizenId || '',
      'คำนำหน้าชื่อบิดา': s.fatherPrefix || '',
      'ชื่อบิดา': s.fatherFirstName || '',
      'นามสกุลบิดา': s.fatherLastName || '',
      'รายได้ต่อเดือนของบิดา': s.fatherIncome || 0,
      'หมายเลขโทรศัพท์ของบิดา': s.fatherPhone || '',
      'หมายเลขบัตรประชาชนมารดา': s.motherCitizenId || '',
      'คำนำหน้าชื่อมารดา': s.motherPrefix || '',
      'ชื่อมารดา': s.motherFirstName || '',
      'นามสกุลมารดา': s.motherLastName || '',
      'รายได้ต่อเดือนของมารดา': s.motherIncome || 0,
      'หมายเลขโทรศัพท์ของมารดา': s.motherPhone || '',
      'ความเกี่ยวข้องของผู้ปกครองกับนักเรียน': s.guardianRelation || '',
      'หมายเลขบัตรประชาชนผู้ปกครอง': s.guardianCitizenId || '',
      'คำนำหน้าชื่อผู้ปกครอง': s.guardianPrefix || '',
      'ชื่อผู้ปกครอง': s.guardianFirstName || '',
      'นามสกุลผู้ปกครอง': s.guardianLastName || '',
      'รายได้ต่อเดือนของผู้ปกครอง': s.guardianIncome || 0,
      'หมายเลขโทรศัพท์ของผู้ปกครอง': s.guardianPhone || '',
      'รหัสประจำบ้าน (ทะเบียนบ้าน)': s.regHouseCode || '',
      'เลขที่บ้าน (ทะเบียนบ้าน)': s.regHouseNo || '',
      'หมู่ (ทะเบียนบ้าน)': s.regMoo || '',
      'ถนน (ทะเบียนบ้าน)': s.regStreet || '',
      'ตำบล (ทะเบียนบ้าน)': s.regSubdistrict || '',
      'อำเภอ (ทะเบียนบ้าน)': s.regDistrict || '',
      'จังหวัด (ทะเบียนบ้าน)': s.regProvince || '',
      'รหัสไปรษณีย์ (ทะเบียนบ้าน)': s.regZipcode || '',
      'หมายเลขโทรศัพท์ (ทะเบียนบ้าน)': s.regPhone || '',
      'รหัสประจำบ้าน (ที่อยู่ปัจจุบัน)': s.currHouseCode || '',
      'เลขที่บ้าน (ที่อยู่ปัจจุบัน)': s.currHouseNo || '',
      'หมู่ (ที่อยู่ปัจจุบัน)': s.currMoo || '',
      'ถนน (ที่อยู่ปัจจุบัน)': s.currStreet || '',
      'ตำบล (ที่อยู่ปัจจุบัน)': s.currSubdistrict || '',
      'อำเภอ (ที่อยู่ปัจจุบัน)': s.currDistrict || '',
      'จังหวัด (ที่อยู่ปัจจุบัน)': s.currProvince || '',
      'รหัสไปรษณีย์ (ที่อยู่ปัจจุบัน)': s.currZipcode || '',
      'หมายเลขโทรศัพท์ (ที่อยู่ปัจจุบัน)': s.currPhone || '',
      'น้ำหนัก': s.weight || 0,
      'ส่วนสูง': s.height || 0,
      'ความด้อยโอกาส': s.disadvantage || 'ไม่ด้อยโอกาส',
      'การพักนอนประจำ': s.isBoarding || 'ไป-กลับ',
      'ขาดแคลนเครื่องแบบ': s.lackUniform || 'ไม่ขาดแคลน',
      'ขาดแคลนเครื่องเขียน': s.lackStationery || 'ไม่ขาดแคลน',
      'ขาดแคลนแบบเรียน': s.lackTextbook || 'ไม่ขาดแคลน',
      'ขาดแคลนอาหารกลางวัน': s.lackLunch || 'ไม่ขาดแคลน',
      'ความพิการ': s.disability || 'ไม่พิการ',
      'ระยะทางจากบ้านถึงโรงเรียน (ถนนลูกรัง)': s.distGravel || 0,
      'ระยะทางจากบ้านถึงโรงเรียน (ถนนลาดยาง)': s.distPaved || 0,
      'ระยะทางจากบ้านถึงโรงเรียน (ทางน้ำ)': s.distWater || 0,
      'ระยะเวลาจากบ้านถึงโรงเรียน': s.travelTime || 0,
      'ลักษณะการเดินทางมาโรงเรียน': s.travelMethod || '',
      'ประเภทนักเรียน': s.studentType || 'นักเรียนทั่วไป',
      'GPA': s.gpa || 0,
      'GPAX': s.gpax || 0,
      'จังหวัดที่เกิด': s.birthProvince || '',
      'อาชีพบิดา': s.fatherOccupation || '',
      'อาชีพมารดา': s.motherOccupation || '',
      'อาชีพผู้ปกครอง': s.guardianOccupation || '',
      'เป็นบุตร/ธิดาลำดับที่': s.birthOrder || 1,
      'จำนวนพี่น้องที่ศึกษาอยู่': s.studyingSiblings || 0,
      'รหัสโรงเรียนห้องสาขา': s.branchSchoolId || '',
      'ชื่อโรงเรียนห้องสาขา': s.branchSchoolName || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลนักเรียน');
  XLSX.writeFile(wb, filename);
}

export function downloadStudentTemplate() {
  const sample = [
    {
      'รหัสโรงเรียน': '41010023',
      'ชื่อโรงเรียน': 'โรงเรียนศรีสุทโธ',
      'เลขประจำตัวประชาชน': '1410100234510',
      'ชั้น': 'มัธยมศึกษาปีที่ 1',
      'ห้อง': '1',
      'รหัสนักเรียน': '1001',
      'เพศ': 'ชาย',
      'คำนำหน้าชื่อ': 'เด็กชาย',
      'ชื่อ': 'สมชาย',
      'นามสกุล': 'ใจดี',
      'ชื่อ (อังกฤษ)': 'Somchai',
      'นามสกุล (อังกฤษ)': 'Jaidee',
      'วันเกิด': '2555-05-14',
      'อายุ(ปี)': 13,
      'อายุ(เดือน)': 2,
      'หมู่โลหิต': 'O',
      'สัญชาติ': 'ไทย',
      'เชื้อชาติ': 'ไทย',
      'ศาสนา': 'พุทธ',
      'จำนวนพี่ชาย': 1,
      'จำนวนน้องชาย': 0,
      'จำนวนพี่สาว': 0,
      'จำนวนน้องสาว': 1,
      'เป็นบุตรคนที่': 2,
      'สถานภาพสมรสของบิดามารดา': 'อยู่ด้วยกัน',
      'หมายเลขบัตรประชาชนบิดา': '3410100112233',
      'คำนำหน้าชื่อบิดา': 'นาย',
      'ชื่อบิดา': 'สมศักดิ์',
      'นามสกุลบิดา': 'ใจดี',
      'รายได้ต่อเดือนของบิดา': 15000,
      'หมายเลขโทรศัพท์ของบิดา': '0812345678',
      'หมายเลขบัตรประชาชนมารดา': '3410100445566',
      'คำนำหน้าชื่อมารดา': 'นาง',
      'ชื่อมารดา': 'สมพร',
      'นามสกุลมารดา': 'ใจดี',
      'รายได้ต่อเดือนของมารดา': 12000,
      'หมายเลขโทรศัพท์ของมารดา': '0898765432',
      'ความเกี่ยวข้องของผู้ปกครองกับนักเรียน': 'บิดา',
      'หมายเลขบัตรประชาชนผู้ปกครอง': '3410100112233',
      'คำนำหน้าชื่อผู้ปกครอง': 'นาย',
      'ชื่อผู้ปกครอง': 'สมศักดิ์',
      'นามสกุลผู้ปกครอง': 'ใจดี',
      'รายได้ต่อเดือนของผู้ปกครอง': 15000,
      'หมายเลขโทรศัพท์ของผู้ปกครอง': '0812345678',
      'รหัสประจำบ้าน (ทะเบียนบ้าน)': '4101-001234-5',
      'เลขที่บ้าน (ทะเบียนบ้าน)': '25/1',
      'หมู่ (ทะเบียนบ้าน)': '3',
      'ถนน (ทะเบียนบ้าน)': 'ศรีสุทโธพัฒนา',
      'ตำบล (ทะเบียนบ้าน)': 'บ้านดุง',
      'อำเภอ (ทะเบียนบ้าน)': 'บ้านดุง',
      'จังหวัด (ทะเบียนบ้าน)': 'อุดรธานี',
      'รหัสไปรษณีย์ (ทะเบียนบ้าน)': '41190',
      'หมายเลขโทรศัพท์ (ทะเบียนบ้าน)': '042123456',
      'รหัสประจำบ้าน (ที่อยู่ปัจจุบัน)': '4101-001234-5',
      'เลขที่บ้าน (ที่อยู่ปัจจุบัน)': '25/1',
      'หมู่ (ที่อยู่ปัจจุบัน)': '3',
      'ถนน (ที่อยู่ปัจจุบัน)': 'ศรีสุทโธพัฒนา',
      'ตำบล (ที่อยู่ปัจจุบัน)': 'บ้านดุง',
      'อำเภอ (ที่อยู่ปัจจุบัน)': 'บ้านดุง',
      'จังหวัด (ที่อยู่ปัจจุบัน)': 'อุดรธานี',
      'รหัสไปรษณีย์ (ที่อยู่ปัจจุบัน)': '41190',
      'หมายเลขโทรศัพท์ (ที่อยู่ปัจจุบัน)': '042123456',
      'น้ำหนัก': 48,
      'ส่วนสูง': 156,
      'ความด้อยโอกาส': 'ไม่ด้อยโอกาส',
      'การพักนอนประจำ': 'ไป-กลับ',
      'ขาดแคลนเครื่องแบบ': 'ไม่ขาดแคลน',
      'ขาดแคลนเครื่องเขียน': 'ไม่ขาดแคลน',
      'ขาดแคลนแบบเรียน': 'ไม่ขาดแคลน',
      'ขาดแคลนอาหารกลางวัน': 'ไม่ขาดแคลน',
      'ความพิการ': 'ไม่พิการ',
      'ระยะทางจากบ้านถึงโรงเรียน (ถนนลูกรัง)': 0,
      'ระยะทางจากบ้านถึงโรงเรียน (ถนนลาดยาง)': 3.5,
      'ระยะทางจากบ้านถึงโรงเรียน (ทางน้ำ)': 0,
      'ระยะเวลาจากบ้านถึงโรงเรียน': 15,
      'ลักษณะการเดินทางมาโรงเรียน': 'รถจักรยานยนต์',
      'ประเภทนักเรียน': 'นักเรียนทั่วไป',
      'GPA': 3.50,
      'GPAX': 3.45,
      'จังหวัดที่เกิด': 'อุดรธานี',
      'อาชีพบิดา': 'เกษตรกรรม',
      'อาชีพมารดา': 'ค้าขาย',
      'อาชีพผู้ปกครอง': 'เกษตรกรรม',
      'เป็นบุตร/ธิดาลำดับที่': 2,
      'จำนวนพี่น้องที่ศึกษาอยู่': 1,
      'รหัสโรงเรียนห้องสาขา': '',
      'ชื่อโรงเรียนห้องสาขา': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Students');
  XLSX.writeFile(wb, 'เทมเพลต_จัดการข้อมูลนักเรียน.xlsx');
}

export async function parseStudentsFromExcel(
  file: File,
  defaultSchoolId = '41010023',
  defaultSchoolName = 'โรงเรียนศรีสุทโธ'
): Promise<Student[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return json.map((row, idx) => {
    const studentId = String(row['รหัสนักเรียน'] || row['studentId'] || row['เลขประจำตัวนักเรียน'] || `${Date.now()}_${idx}`).trim();
    const citizenId = String(row['เลขประจำตัวประชาชน'] || row['citizenId'] || '').trim();
    const classLevel = String(row['ชั้น'] || row['classLevel'] || 'มัธยมศึกษาปีที่ 1').trim();
    const room = String(row['ห้อง'] || row['room'] || '1').trim();

    // Support both 'เพศ' and 'เพศ(ช=ชาย,ญ=หญิง)' and 'gender'
    const genderRaw = String(row['เพศ'] || row['เพศ(ช=ชาย,ญ=หญิง)'] || row['gender'] || 'ชาย').trim();
    const isFemale = genderRaw === 'ญ' || genderRaw.includes('หญิง') || genderRaw.toLowerCase().includes('female') || genderRaw.toLowerCase() === 'f';
    const gender = isFemale ? 'หญิง' : 'ชาย';

    const prefix = String(row['คำนำหน้าชื่อ'] || row['คำนำหน้า'] || (isFemale ? 'เด็กหญิง' : 'เด็กชาย')).trim();
    const firstName = String(row['ชื่อ'] || row['firstName'] || `นักเรียน ${idx + 1}`).trim();
    const lastName = String(row['นามสกุล'] || row['lastName'] || '').trim();

    return {
      id: `std_${Date.now()}_${idx}`,
      schoolId: String(row['รหัสโรงเรียน'] || defaultSchoolId),
      schoolName: String(row['ชื่อโรงเรียน'] || defaultSchoolName),
      citizenId,
      classLevel,
      room,
      studentId,
      gender,
      prefix,
      firstName,
      lastName,
      firstNameEn: String(row['ชื่อ (อังกฤษ)'] || row['firstNameEn'] || '').trim(),
      lastNameEn: String(row['นามสกุล (อังกฤษ)'] || row['lastNameEn'] || '').trim(),
      birthDate: String(row['วันเกิด'] || row['birthDate'] || '2555-01-01').trim(),
      ageYears: Number(row['อายุ(ปี)'] || row['ageYears'] || row['อายุ'] || 13),
      ageMonths: Number(row['อายุ(เดือน)'] || row['ageMonths'] || 0),
      bloodGroup: String(row['หมู่โลหิต'] || row['กลุ่มเลือด'] || row['bloodGroup'] || 'O').trim(),
      nationality: String(row['สัญชาติ'] || row['nationality'] || 'ไทย').trim(),
      ethnicity: String(row['เชื้อชาติ'] || row['ethnicity'] || 'ไทย').trim(),
      religion: String(row['ศาสนา'] || row['religion'] || 'พุทธ').trim(),

      olderBrothers: Number(row['จำนวนพี่ชาย'] || 0),
      youngerBrothers: Number(row['จำนวนน้องชาย'] || 0),
      olderSisters: Number(row['จำนวนพี่สาว'] || 0),
      youngerSisters: Number(row['จำนวนน้องสาว'] || 0),
      childOrder: Number(row['เป็นบุตรคนที่'] || 1),
      birthOrder: Number(row['เป็นบุตร/ธิดาลำดับที่'] || 1),
      studyingSiblings: Number(row['จำนวนพี่น้องที่ศึกษาอยู่'] || 0),
      maritalStatusParents: String(row['สถานภาพสมรสของบิดามารดา'] || 'อยู่ด้วยกัน').trim(),

      fatherCitizenId: String(row['หมายเลขบัตรประชาชนบิดา'] || '').trim(),
      fatherPrefix: String(row['คำนำหน้าชื่อบิดา'] || 'นาย').trim(),
      fatherFirstName: String(row['ชื่อบิดา'] || '').trim(),
      fatherLastName: String(row['นามสกุลบิดา'] || '').trim(),
      fatherOccupation: String(row['อาชีพบิดา'] || '').trim(),
      fatherIncome: Number(row['รายได้ต่อเดือนของบิดา'] || 0),
      fatherPhone: String(row['หมายเลขโทรศัพท์ของบิดา'] || '').trim(),

      motherCitizenId: String(row['หมายเลขบัตรประชาชนมารดา'] || '').trim(),
      motherPrefix: String(row['คำนำหน้าชื่อมารดา'] || 'นาง').trim(),
      motherFirstName: String(row['ชื่อมารดา'] || '').trim(),
      motherLastName: String(row['นามสกุลมารดา'] || '').trim(),
      motherOccupation: String(row['อาชีพมารดา'] || '').trim(),
      motherIncome: Number(row['รายได้ต่อเดือนของมารดา'] || 0),
      motherPhone: String(row['หมายเลขโทรศัพท์ของมารดา'] || '').trim(),

      guardianRelation: String(row['ความเกี่ยวข้องของผู้ปกครองกับนักเรียน'] || 'บิดา').trim(),
      guardianCitizenId: String(row['หมายเลขบัตรประชาชนผู้ปกครอง'] || '').trim(),
      guardianPrefix: String(row['คำนำหน้าชื่อผู้ปกครอง'] || 'นาย').trim(),
      guardianFirstName: String(row['ชื่อผู้ปกครอง'] || '').trim(),
      guardianLastName: String(row['นามสกุลผู้ปกครอง'] || '').trim(),
      guardianOccupation: String(row['อาชีพผู้ปกครอง'] || '').trim(),
      guardianIncome: Number(row['รายได้ต่อเดือนของผู้ปกครอง'] || 0),
      guardianPhone: String(row['หมายเลขโทรศัพท์ของผู้ปกครอง'] || '').trim(),

      regHouseCode: String(row['รหัสประจำบ้าน (ทะเบียนบ้าน)'] || '').trim(),
      regHouseNo: String(row['เลขที่บ้าน (ทะเบียนบ้าน)'] || '').trim(),
      regMoo: String(row['หมู่ (ทะเบียนบ้าน)'] || '').trim(),
      regStreet: String(row['ถนน (ทะเบียนบ้าน)'] || '').trim(),
      regSubdistrict: String(row['ตำบล (ทะเบียนบ้าน)'] || '').trim(),
      regDistrict: String(row['อำเภอ (ทะเบียนบ้าน)'] || '').trim(),
      regProvince: String(row['จังหวัด (ทะเบียนบ้าน)'] || 'อุดรธานี').trim(),
      regZipcode: String(row['รหัสไปรษณีย์ (ทะเบียนบ้าน)'] || '').trim(),
      regPhone: String(row['หมายเลขโทรศัพท์ (ทะเบียนบ้าน)'] || '').trim(),

      currHouseCode: String(row['รหัสประจำบ้าน (ที่อยู่ปัจจุบัน)'] || '').trim(),
      currHouseNo: String(row['เลขที่บ้าน (ที่อยู่ปัจจุบัน)'] || '').trim(),
      currMoo: String(row['หมู่ (ที่อยู่ปัจจุบัน)'] || '').trim(),
      currStreet: String(row['ถนน (ที่อยู่ปัจจุบัน)'] || '').trim(),
      currSubdistrict: String(row['ตำบล (ที่อยู่ปัจจุบัน)'] || '').trim(),
      currDistrict: String(row['อำเภอ (ที่อยู่ปัจจุบัน)'] || '').trim(),
      currProvince: String(row['จังหวัด (ที่อยู่ปัจจุบัน)'] || 'อุดรธานี').trim(),
      currZipcode: String(row['รหัสไปรษณีย์ (ที่อยู่ปัจจุบัน)'] || '').trim(),
      currPhone: String(row['หมายเลขโทรศัพท์ (ที่อยู่ปัจจุบัน)'] || '').trim(),

      weight: Number(row['น้ำหนัก'] || 0),
      height: Number(row['ส่วนสูง'] || 0),
      disadvantage: String(row['ความด้อยโอกาส'] || 'ไม่ด้อยโอกาส').trim(),
      isBoarding: String(row['การพักนอนประจำ'] || 'ไป-กลับ').trim(),
      lackUniform: String(row['ขาดแคลนเครื่องแบบ'] || 'ไม่ขาดแคลน').trim(),
      lackStationery: String(row['ขาดแคลนเครื่องเขียน'] || 'ไม่ขาดแคลน').trim(),
      lackTextbook: String(row['ขาดแคลนแบบเรียน'] || 'ไม่ขาดแคลน').trim(),
      lackLunch: String(row['ขาดแคลนอาหารกลางวัน'] || 'ไม่ขาดแคลน').trim(),
      disability: String(row['ความพิการ'] || 'ไม่พิการ').trim(),

      distGravel: Number(row['ระยะทางจากบ้านถึงโรงเรียน (ถนนลูกรัง)'] || 0),
      distPaved: Number(row['ระยะทางจากบ้านถึงโรงเรียน (ถนนลาดยาง)'] || 0),
      distWater: Number(row['ระยะทางจากบ้านถึงโรงเรียน (ทางน้ำ)'] || 0),
      travelTime: Number(row['ระยะเวลาจากบ้านถึงโรงเรียน'] || 0),
      travelMethod: String(row['ลักษณะการเดินทางมาโรงเรียน'] || '').trim(),

      studentType: String(row['ประเภทนักเรียน'] || 'นักเรียนทั่วไป').trim(),
      gpa: Number(row['GPA'] || 0),
      gpax: Number(row['GPAX'] || 0),
      birthProvince: String(row['จังหวัดที่เกิด'] || '').trim(),
      branchSchoolId: String(row['รหัสโรงเรียนห้องสาขา'] || '').trim(),
      branchSchoolName: String(row['ชื่อโรงเรียนห้องสาขา'] || '').trim(),

      createdAt: new Date().toISOString(),
    };
  }).filter(s => s.studentId && s.firstName);
}

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
}

// ==================== ROSTER EXCEL WITH DYNAMIC COLUMNS ====================
export function exportClassRosterToExcel(
  students: Student[],
  meta: RosterOptions
) {
  const maleCount = students.filter(s => s.gender === 'ชาย' || s.gender === 'ช').length;
  const femaleCount = students.filter(s => s.gender === 'หญิง' || s.gender === 'ญ').length;
  const count = meta.blankColCount || 10;

  // Order: ลำดับ -> (รหัส) -> (เลขปชช) -> (ชื่อนักเรียน) -> (วันเกิด) -> (ผู้ปกครอง) -> (เลขปชชผู้ปกครอง) -> [ช่องเปล่า] -> หมายเหตุ
  const headerRow: (string | number)[] = ['ลำดับ'];
  if (meta.showStudentId) headerRow.push('รหัสนักเรียน');
  if (meta.showCitizenId) headerRow.push('เลขประจำตัวประชาชน');
  if (meta.showFullName) headerRow.push('ชื่อ - นามสกุล');
  if (meta.showBirthDate) headerRow.push('วันเกิด');
  if (meta.showGuardianName) headerRow.push('ชื่อผู้ปกครอง');
  if (meta.showGuardianCitizenId) headerRow.push('เลขประชาชนผู้ปกครอง');
  for (let i = 0; i < count; i++) {
    headerRow.push('');
  }
  headerRow.push('หมายเหตุ');

  const aoa: (string | number)[][] = [
    [meta.schoolName],
    ['บัญชีรายชื่อนักเรียน.............................................................'],
    [`ชั้น: ${meta.classLevel}    ห้อง: ${meta.room}    ปีการศึกษา: ${meta.academicYear}    ครูประจำชั้น: ${meta.teacherName || '...................................................'}`],
    [`จำนวนนักเรียนทั้งหมด: ${students.length} คน (ชาย: ${maleCount} คน, หญิง: ${femaleCount} คน)`],
    [],
    headerRow,
    Array(headerRow.length).fill(''),
  ];

  students.forEach((s, idx) => {
    const row: (string | number)[] = [idx + 1];
    if (meta.showStudentId) row.push(s.studentId);
    if (meta.showCitizenId) row.push(s.citizenId || '-');
    if (meta.showFullName) row.push(`${s.prefix}${s.firstName} ${s.lastName}`);
    if (meta.showBirthDate) row.push(formatThaiBirthDate(s.birthDate));
    if (meta.showGuardianName) row.push(`${s.guardianPrefix || ''}${s.guardianFirstName || ''} ${s.guardianLastName || ''}`.trim() || '-');
    if (meta.showGuardianCitizenId) row.push(s.guardianCitizenId || '-');
    for (let i = 0; i < count; i++) {
      row.push('');
    }
    row.push(s.cannotDischarge ? 'ยังไม่จำหน่าย' : '');
    aoa.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  let fixedColsCount = 1;
  if (meta.showStudentId) fixedColsCount++;
  if (meta.showCitizenId) fixedColsCount++;
  if (meta.showFullName) fixedColsCount++;
  if (meta.showBirthDate) fixedColsCount++;
  if (meta.showGuardianName) fixedColsCount++;
  if (meta.showGuardianCitizenId) fixedColsCount++;

  const merges: any[] = [];
  for (let c = 0; c < fixedColsCount; c++) {
    merges.push({ s: { r: 5, c }, e: { r: 6, c } });
  }
  const remarkColIndex = fixedColsCount + count;
  merges.push({ s: { r: 5, c: remarkColIndex }, e: { r: 6, c: remarkColIndex } });
  if (count > 1) {
    merges.push({ s: { r: 5, c: fixedColsCount }, e: { r: 5, c: fixedColsCount + count - 1 } });
  } else if (count === 1) {
    merges.push({ s: { r: 5, c: fixedColsCount }, e: { r: 6, c: fixedColsCount } });
  }
  ws['!merges'] = merges;

  // Dynamic column widths for Excel: blank columns expand equally and fill space between info and remarks
  const orderWch = 6;
  const studentIdWch = meta.showStudentId ? 11 : 0;
  const citizenIdWch = meta.showCitizenId ? 17 : 0;
  const fullNameWch = meta.showFullName ? (meta.showGuardianName ? 26 : 32) : 0;
  const birthDateWch = meta.showBirthDate ? 13 : 0;
  const guardianNameWch = meta.showGuardianName ? 24 : 0;
  const guardianCitizenIdWch = meta.showGuardianCitizenId ? 17 : 0;
  const remarksWch = 12;

  const infoTotalWch = orderWch + studentIdWch + citizenIdWch + fullNameWch + birthDateWch + guardianNameWch + guardianCitizenIdWch + remarksWch;

  // Target standard A4 portrait width in Excel character units is ~95 wch
  const targetTotalWch = 95;
  const availableForBlanks = Math.max(count * 3.5, targetTotalWch - infoTotalWch);
  const eachBlankWch = Math.max(3.5, Math.round((availableForBlanks / count) * 10) / 10);

  const rawCols: { wch: number }[] = [{ wch: orderWch }];
  if (meta.showStudentId) rawCols.push({ wch: studentIdWch });
  if (meta.showCitizenId) rawCols.push({ wch: citizenIdWch });
  if (meta.showFullName) rawCols.push({ wch: fullNameWch });
  if (meta.showBirthDate) rawCols.push({ wch: birthDateWch });
  if (meta.showGuardianName) rawCols.push({ wch: guardianNameWch });
  if (meta.showGuardianCitizenId) rawCols.push({ wch: guardianCitizenIdWch });
  for (let i = 0; i < count; i++) {
    rawCols.push({ wch: eachBlankWch });
  }
  rawCols.push({ wch: remarksWch });

  // If total columns exceed target page width, scale down proportionally so rightmost column never falls off page
  const actualSum = rawCols.reduce((sum, c) => sum + c.wch, 0);
  if (actualSum > targetTotalWch) {
    const scale = targetTotalWch / actualSum;
    ws['!cols'] = rawCols.map(c => ({ wch: Math.max(3, Math.round(c.wch * scale * 10) / 10) }));
  } else {
    ws['!cols'] = rawCols;
  }

  const wb = XLSX.utils.book_new();
  const sheetName = `${meta.classLevel}_ห้อง_${meta.room}`.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `บัญชีรายชื่อ_${meta.classLevel}_ห้อง_${meta.room}_ปี${meta.academicYear}.xlsx`);
}


// ==================== STUDENT SUMMARY REPORT EXCEL ====================
export interface ClassSummaryReportRow {
  index: number;
  className: string;
  room: string;
  teacherName: string;
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  malePct: string;
  femalePct: string;
  disadvantagedCount: number;
  cannotDischargeCount: number;
}

export function exportStudentSummaryReportToExcel(
  rows: ClassSummaryReportRow[],
  schoolName = 'โรงเรียนศรีสุทโธ',
  academicYear = '2567',
  totals: {
    totalMale: number;
    totalFemale: number;
    grandTotal: number;
    totalDisadvantaged: number;
    totalCannotDischarge: number;
    totalClasses: number;
  }
) {
  const data = rows.map(r => ({
    'ลำดับ': r.index,
    'ระดับชั้น': r.className,
    'ห้อง': r.room,
    'ครูประจำชั้น': r.teacherName || '-',
    'นักเรียนชาย (คน)': r.maleCount,
    'นักเรียนหญิง (คน)': r.femaleCount,
    'รวมทั้งหมด (คน)': r.totalCount,
    'ร้อยละชาย (%)': r.malePct,
    'ร้อยละหญิง (%)': r.femalePct,
    'ด้อยโอกาส (คน)': r.disadvantagedCount,
    'ยังจำหน่ายไม่ได้ (คน)': r.cannotDischargeCount,
  }));

  // Append Grand Total row
  data.push({
    'ลำดับ': '-' as any,
    'ระดับชั้น': 'ยอดรวมทั้งโรงเรียน',
    'ห้อง': `${totals.totalClasses} ห้อง`,
    'ครูประจำชั้น': '-',
    'นักเรียนชาย (คน)': totals.totalMale,
    'นักเรียนหญิง (คน)': totals.totalFemale,
    'รวมทั้งหมด (คน)': totals.grandTotal,
    'ร้อยละชาย (%)': totals.grandTotal > 0 ? `${Math.round((totals.totalMale / totals.grandTotal) * 100)}%` : '0%',
    'ร้อยละหญิง (%)': totals.grandTotal > 0 ? `${Math.round((totals.totalFemale / totals.grandTotal) * 100)}%` : '0%',
    'ด้อยโอกาส (คน)': totals.totalDisadvantaged,
    'ยังจำหน่ายไม่ได้ (คน)': totals.totalCannotDischarge,
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'รายงานสรุปนักเรียนรายชั้น');
  XLSX.writeFile(wb, `รายงานสรุปข้อมูลนักเรียนรายชั้น_${schoolName}_ปี${academicYear}.xlsx`);
}
