import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  ShieldCheck,
  School,
  X,
  Key,
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import {
  exportUsersToExcel,
  downloadUserTemplate,
  parseUsersFromExcel,
} from '../../utils/excel';

interface UsersViewProps {
  users: AppUser[];
  onSave: (user: AppUser) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onBatchSave: (users: AppUser[]) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    danger?: boolean
  ) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  onSave,
  onDelete,
  onDeleteAll,
  onBatchSave,
  showToast,
  showConfirm,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('ครู');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const openAddModal = () => {
    setEditingItem(null);
    setUsername('');
    setPassword('123456');
    setFullName('');
    setRole('ครู');
    setModalOpen(true);
  };

  const openEditModal = (item: AppUser) => {
    setEditingItem(item);
    setUsername(item.username);
    setPassword(item.password || '');
    setFullName(item.fullName);
    setRole(item.role);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      showToast('warning', 'กรุณากรอกชื่อผู้ใช้และชื่อ-นามสกุล');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AppUser = {
        id: editingItem ? editingItem.id : `u_${Date.now()}`,
        username: username.trim(),
        password: password.trim() || '123456',
        fullName: fullName.trim(),
        role,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
      };

      await onSave(payload);
      showToast('success', editingItem ? 'แก้ไขผู้ใช้งานสำเร็จ' : 'เพิ่มผู้ใช้งานสำเร็จ');
      setModalOpen(false);
    } catch {
      showToast('error', 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item: AppUser) => {
    showConfirm(
      'ยืนยันการลบผู้ใช้งาน',
      `คุณต้องการลบผู้ใช้ "${item.fullName} (${item.username})" ใช่หรือไม่?`,
      async () => {
        try {
          await onDelete(item.id);
          showToast('success', 'ลบผู้ใช้งานเรียบร้อยแล้ว');
        } catch {
          showToast('error', 'ไม่สามารถลบข้อมูลได้');
        }
      },
      true
    );
  };

  const handleDeleteAll = () => {
    showConfirm(
      'ยืนยันการลบผู้ใช้งานทั้งหมด!',
      'คำเตือน: คุณกำลังจะลบรายชื่อผู้ใช้งานทั้งหมดในระบบ ข้อมูลนี้จะไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?',
      async () => {
        try {
          await onDeleteAll();
          showToast('success', 'ลบผู้ใช้งานทั้งหมดเรียบร้อยแล้ว');
        } catch {
          showToast('error', 'ไม่สามารถลบข้อมูลได้');
        }
      },
      true
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsed = await parseUsersFromExcel(file);
      if (parsed.length === 0) {
        showToast('warning', 'ไม่พบข้อมูลผู้ใช้งานในไฟล์ Excel');
      } else {
        await onBatchSave(parsed as AppUser[]);
        showToast('success', `นำเข้าผู้ใช้งานสำเร็จ ${parsed.length} รายการ`, 'รองรับภาษาไทย UTF-8');
      }
    } catch {
      showToast('error', 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0C7C82]" />
            จัดการผู้ใช้งานระบบ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดบัญชีผู้ใช้งาน ครู และผู้ดูแลระบบ นำเข้าและส่งออก Excel
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <label className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0C7C82] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-teal-200">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'กำลังนำเข้า...' : 'นำเข้า Excel'}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => exportUsersToExcel(users)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="ส่งออกไฟล์ Excel"
          >
            <Download className="w-4 h-4" /> ส่งออก Excel
          </button>

          <button
            onClick={downloadUserTemplate}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
            title="ดาวน์โหลดเทมเพลต Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> เทมเพลต
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C7C82] to-[#35B4B0] text-white text-xs font-semibold shadow-md shadow-teal-800/20 hover:opacity-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> เพิ่มผู้ใช้งาน
          </button>

          {users.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium transition cursor-pointer flex items-center gap-1"
              title="ลบผู้ใช้งานทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" /> ลบทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-20">ลำดับ</th>
                <th className="py-4 px-6">ชื่อผู้ใช้ (Username)</th>
                <th className="py-4 px-6">ชื่อ-นามสกุล</th>
                <th className="py-4 px-6 text-center">บทบาท</th>
                <th className="py-4 px-6 text-center">รหัสผ่าน</th>
                <th className="py-4 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ใช้งานในระบบ
                  </td>
                </tr>
              ) : (
                users.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 text-center text-slate-400 font-mono text-xs">
                      {index + 1}
                    </td>
                    <td className="py-4 px-6 font-mono font-medium text-slate-800">
                      {item.username}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {item.fullName}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.role === 'ผู้ดูแลระบบ' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          ผู้ดูแลระบบ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          <School className="w-3.5 h-3.5 text-teal-600" />
                          ครู
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-400 font-mono text-xs">
                      ••••••
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0C7C82]" />
                {editingItem ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อผู้ใช้งาน (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="เช่น teacher_somchai"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="เช่น นายสมชาย ชาญฉลาด"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน (ค่าเริ่มต้น: 123456)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  บทบาท (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C7C82] focus:ring-2 focus:ring-[#0C7C82]/20 outline-hidden bg-white"
                >
                  <option value="ครู">ครู (เข้าดูและพิมพ์ทะเบียนนักเรียน)</option>
                  <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ (จัดการทุกเมนู)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0C7C82] text-white text-xs font-semibold hover:bg-[#0C7C82]/90 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
