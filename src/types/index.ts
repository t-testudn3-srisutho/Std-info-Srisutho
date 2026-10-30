export type UserRole = 'ครู' | 'ผู้ดูแลระบบ';

export interface SystemSetting {
  id?: string;
  schoolId: string;
  schoolName: string;
  affiliation: string;
  schoolLogo: string;
  directorName: string;
  deputyDirectorName: string;
  headOfAcademicName: string;
  adminPin: string;
}

export interface AcademicYear {
  id: string;
  year: string;
  isCurrent: boolean;
  order: number;
}

export interface Classroom {
  id: string;
  className: string; // e.g. "ประถมศึกษาปีที่ 1" or "มัธยมศึกษาปีที่ 1"
  room: string;      // e.g. "1" or "2"
  orderSeq: number;  // sequence order
}

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
}

export interface Student {
  id: string;
  // 1. ข้อมูลพื้นฐานสถานศึกษาและนักเรียน
  schoolId: string;                 // รหัสโรงเรียน
  schoolName: string;               // ชื่อโรงเรียน
  citizenId: string;                // เลขประจำตัวประชาชน
  classLevel: string;               // ชั้น
  room: string;                     // ห้อง
  studentId: string;                // รหัสนักเรียน
  gender: string;                   // เพศ (ชาย / หญิง)
  prefix: string;                   // คำนำหน้าชื่อ
  firstName: string;                // ชื่อ
  lastName: string;                 // นามสกุล
  firstNameEn: string;              // ชื่อ (อังกฤษ)
  lastNameEn: string;               // นามสกุล (อังกฤษ)
  birthDate: string;                // วันเกิด
  ageYears: number;                 // อายุ(ปี)
  ageMonths: number;                // อายุ(เดือน)
  bloodGroup: string;               // หมู่โลหิต
  nationality: string;              // สัญชาติ
  ethnicity: string;                // เชื้อชาติ
  religion: string;                 // ศาสนา

  // 2. ข้อมูลครอบครัวและพี่น้อง
  olderBrothers: number;            // จำนวนพี่ชาย
  youngerBrothers: number;          // จำนวนน้องชาย
  olderSisters: number;             // จำนวนพี่สาว
  youngerSisters: number;           // จำนวนน้องสาว
  childOrder: number;               // เป็นบุตรคนที่
  birthOrder: number;               // เป็นบุตร/ธิดาลำดับที่
  studyingSiblings: number;         // จำนวนพี่น้องที่ศึกษาอยู่
  maritalStatusParents: string;     // สถานภาพสมรสของบิดามารดา

  // 3. ข้อมูลบิดา
  fatherCitizenId: string;          // หมายเลขบัตรประชาชนบิดา
  fatherPrefix: string;             // คำนำหน้าชื่อบิดา
  fatherFirstName: string;          // ชื่อบิดา
  fatherLastName: string;           // นามสกุลบิดา
  fatherOccupation: string;         // อาชีพบิดา
  fatherIncome: number;             // รายได้ต่อเดือนของบิดา
  fatherPhone: string;              // หมายเลขโทรศัพท์ของบิดา

  // 4. ข้อมูลมารดา
  motherCitizenId: string;          // หมายเลขบัตรประชาชนมารดา
  motherPrefix: string;             // คำนำหน้าชื่อมารดา
  motherFirstName: string;          // ชื่อมารดา
  motherLastName: string;           // นามสกุลมารดา
  motherOccupation: string;         // อาชีพมารดา
  motherIncome: number;             // รายได้ต่อเดือนของมารดา
  motherPhone: string;              // หมายเลขโทรศัพท์ของมารดา

  // 5. ข้อมูลผู้ปกครอง
  guardianRelation: string;         // ความเกี่ยวข้องของผู้ปกครองกับนักเรียน
  guardianCitizenId: string;        // หมายเลขบัตรประชาชนผู้ปกครอง
  guardianPrefix: string;           // คำนำหน้าชื่อผู้ปกครอง
  guardianFirstName: string;        // ชื่อผู้ปกครอง
  guardianLastName: string;         // นามสกุลผู้ปกครอง
  guardianOccupation: string;       // อาชีพผู้ปกครอง
  guardianIncome: number;           // รายได้ต่อเดือนของผู้ปกครอง
  guardianPhone: string;            // หมายเลขโทรศัพท์ของผู้ปกครอง

  // 6. ที่อยู่ตามทะเบียนบ้าน
  regHouseCode: string;             // รหัสประจำบ้าน (ทะเบียนบ้าน)
  regHouseNo: string;               // เลขที่บ้าน (ทะเบียนบ้าน)
  regMoo: string;                   // หมู่ (ทะเบียนบ้าน)
  regStreet: string;                // ถนน (ทะเบียนบ้าน)
  regSubdistrict: string;           // ตำบล (ทะเบียนบ้าน)
  regDistrict: string;              // อำเภอ (ทะเบียนบ้าน)
  regProvince: string;              // จังหวัด (ทะเบียนบ้าน)
  regZipcode: string;               // รหัสไปรษณีย์ (ทะเบียนบ้าน)
  regPhone: string;                 // หมายเลขโทรศัพท์ (ทะเบียนบ้าน)

  // 7. ที่อยู่ปัจจุบัน
  currHouseCode: string;            // รหัสประจำบ้าน (ที่อยู่ปัจจุบัน)
  currHouseNo: string;              // เลขที่บ้าน (ที่อยู่ปัจจุบัน)
  currMoo: string;                  // หมู่ (ที่อยู่ปัจจุบัน)
  currStreet: string;               // ถนน (ที่อยู่ปัจจุบัน)
  currSubdistrict: string;          // ตำบล (ที่อยู่ปัจจุบัน)
  currDistrict: string;             // อำเภอ (ที่อยู่ปัจจุบัน)
  currProvince: string;             // จังหวัด (ที่อยู่ปัจจุบัน)
  currZipcode: string;              // รหัสไปรษณีย์ (ที่อยู่ปัจจุบัน)
  currPhone: string;                // หมายเลขโทรศัพท์ (ที่อยู่ปัจจุบัน)

  // 8. ร่างกายและสุขภาพ
  weight: number;                   // น้ำหนัก
  height: number;                   // ส่วนสูง
  disadvantage: string;             // ความด้อยโอกาส
  isBoarding: string;               // การพักนอนประจำ (ไป-กลับ / พักนอน)
  lackUniform: string;              // ขาดแคลนเครื่องแบบ (ขาดแคลน / ไม่ขาดแคลน)
  lackStationery: string;           // ขาดแคลนเครื่องเขียน (ขาดแคลน / ไม่ขาดแคลน)
  lackTextbook: string;             // ขาดแคลนแบบเรียน (ขาดแคลน / ไม่ขาดแคลน)
  lackLunch: string;                // ขาดแคลนอาหารกลางวัน (ขาดแคลน / ไม่ขาดแคลน)
  disability: string;               // ความพิการ

  // 9. การเดินทางมาโรงเรียน
  distGravel: number;               // ระยะทางจากบ้านถึงโรงเรียน (ถนนลูกรัง) กม.
  distPaved: number;                // ระยะทางจากบ้านถึงโรงเรียน (ถนนลาดยาง) กม.
  distWater: number;                // ระยะทางจากบ้านถึงโรงเรียน (ทางน้ำ) กม.
  travelTime: number;               // ระยะเวลาจากบ้านถึงโรงเรียน (นาที)
  travelMethod: string;             // ลักษณะการเดินทางมาโรงเรียน

  // 10. ข้อมูลการศึกษาและอื่นๆ
  studentType: string;              // ประเภทนักเรียน (ปกติ / พิเศษ / ฯลฯ)
  gpa: number;                      // GPA
  gpax: number;                     // GPAX
  birthProvince: string;            // จังหวัดที่เกิด
  branchSchoolId: string;           // รหัสโรงเรียนห้องสาขา
  branchSchoolName: string;         // ชื่อโรงเรียนห้องสาขา

  // Metadata
  cannotDischarge?: boolean;        // ยังไม่สามารถจำหน่ายได้
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeroomAssignment {
  id: string;
  teacherUsername?: string;
  teacherName: string;
  className: string;
  room: string;
  academicYear: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'settings'
  | 'academicYears'
  | 'users'
  | 'classrooms'
  | 'homeroom'
  | 'students'
  | 'classRoster'
  | 'studentReport';
