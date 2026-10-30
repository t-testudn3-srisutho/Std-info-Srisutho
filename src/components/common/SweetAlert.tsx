import React from 'react';
import { AlertCircle, CheckCircle, Info, HelpCircle, X } from 'lucide-react';

export interface AlertConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface SweetAlertModalProps {
  confirmState: ConfirmConfig | null;
  onClose: () => void;
}

export const SweetAlertModal: React.FC<SweetAlertModalProps> = ({ confirmState, onClose }) => {
  if (!confirmState) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center transform transition-all border border-slate-100">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          confirmState.danger ? 'bg-rose-50 text-rose-500' : 'bg-teal-50 text-teal-600'
        }`}>
          {confirmState.danger ? (
            <AlertCircle className="w-9 h-9 stroke-[2]" />
          ) : (
            <HelpCircle className="w-9 h-9 stroke-[2]" />
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {confirmState.title}
        </h3>
        <p className="text-slate-600 text-sm mb-6 whitespace-pre-line leading-relaxed">
          {confirmState.message}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirmState.onCancel) confirmState.onCancel();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-sm transition cursor-pointer"
          >
            {confirmState.cancelText || 'ยกเลิก'}
          </button>
          <button
            type="button"
            onClick={() => {
              confirmState.onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-white font-medium text-sm transition shadow-md cursor-pointer ${
              confirmState.danger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'
            }`}
          >
            {confirmState.confirmText || 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToastNotificationProps {
  toast: AlertConfig | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
          icon: <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
        };
      default:
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-800',
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed top-5 right-5 z-50 animate-fade-in max-w-sm">
      <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${style.bg}`}>
        {style.icon}
        <div className="flex-1 text-sm">
          <div className="font-bold">{toast.title}</div>
          {toast.message && <div className="text-xs opacity-90 mt-0.5">{toast.message}</div>}
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
