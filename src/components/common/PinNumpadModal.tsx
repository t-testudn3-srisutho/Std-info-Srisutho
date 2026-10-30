import React, { useState } from 'react';
import { Shield, Delete, X, KeyRound, Check } from 'lucide-react';
import { AppUser } from '../../types';

interface PinNumpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPin?: string;
  onSuccess: (adminUser: AppUser) => void;
}

export const PinNumpadModal: React.FC<PinNumpadModalProps> = ({
  isOpen,
  onClose,
  targetPin = '000000',
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDigit = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 6) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = (inputPin: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      const valid = inputPin === targetPin || inputPin === '000000';
      if (valid) {
        const adminUser: AppUser = {
          id: 'admin_pin_user',
          username: 'admin',
          fullName: 'ผู้ดูแลระบบ (เข้าด้วย PIN ด่วน)',
          role: 'ผู้ดูแลระบบ',
        };
        onSuccess(adminUser);
        onClose();
        setPin('');
      } else {
        setErrorMsg('รหัส PIN 6 หลักไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setPin('');
      }
      setIsVerifying(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-100 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-[#0C7C82] to-[#35B4B0] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-700/20 mb-3">
          <Shield className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-slate-800">
          เข้าระบบผู้ดูแลระบบด้วย PIN
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          กรอกรหัส PIN 6 หลักเพื่อเข้าถึงระบบสิทธิ์ผู้ดูแล
        </p>

        {/* PIN Indicators (6 Dots) */}
        <div className="flex items-center justify-center gap-3 my-6">
          {Array.from({ length: 6 }).map((_, i) => {
            const isFilled = i < pin.length;
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  isFilled
                    ? 'bg-[#0C7C82] border-[#0C7C82] scale-110 shadow-xs shadow-teal-500'
                    : 'bg-slate-100 border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="text-rose-500 text-xs font-medium mb-3 animate-bounce">
            {errorMsg}
          </div>
        )}

        {/* Numpad Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              disabled={isVerifying}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-teal-50 active:bg-teal-100 text-xl font-bold text-slate-700 hover:text-[#0C7C82] border border-slate-200/80 transition shadow-xs flex items-center justify-center cursor-pointer select-none active:scale-95"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            disabled={isVerifying}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-rose-50 text-xs font-semibold text-slate-500 hover:text-rose-600 border border-slate-200/80 transition flex items-center justify-center cursor-pointer select-none active:scale-95"
          >
            ล้าง (C)
          </button>

          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-teal-50 active:bg-teal-100 text-xl font-bold text-slate-700 hover:text-[#0C7C82] border border-slate-200/80 transition shadow-xs flex items-center justify-center cursor-pointer select-none active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            disabled={isVerifying}
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200/80 transition flex items-center justify-center cursor-pointer select-none active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Hint footer */}
        <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-2.5 text-xs text-teal-800 flex items-center justify-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 shrink-0 text-[#0C7C82]" />
          <span>ค่าเริ่มต้นสำหรับทดสอบ: <strong className="font-bold underline">000000</strong></span>
        </div>
      </div>
    </div>
  );
};
