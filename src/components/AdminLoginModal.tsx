import React, { useState } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff, X, ArrowLeft, KeyRound } from 'lucide-react';
import { ChangeAdminPinModal } from './ChangeAdminPinModal.tsx';
import * as dataService from '../lib/dataService.ts';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim();
    if (!cleanPin) {
      setError('يرجى إدخال رمز الدخول السري أو كلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await dataService.verifyAdminPin(cleanPin);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل التحقق من هوية المعلم، تأكد من صحة رمز المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 transition-colors"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            type="button"
            className="absolute left-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-300">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-bold">بوابة دخول المعلم والإدارة</h3>
          <p className="text-slate-400 text-xs mt-1">
            المنطقة الإدارية الخاصة بالأستاذ إمام يوسف للتحكم بالمنصة
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 dark:text-slate-200">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <Lock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كلمة المرور أو رمز الأمان (Master PIN)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPin ? 'text' : 'password'}
                required
                placeholder="أدخل كلمة المرور الخاصة بك..."
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pr-10 pl-10 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                dir="ltr"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 mt-2 px-1">
              <span>الرمز الافتراضي: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">emam2025</strong></span>
              <button
                type="button"
                onClick={() => setShowChangePinModal(true)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold cursor-pointer underline"
              >
                تغيير كلمة المرور
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 dark:shadow-none disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>تسجيل الدخول للوحة الإدارة</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* CHANGE ADMIN PIN MODAL */}
      <ChangeAdminPinModal
        isOpen={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
      />
    </div>
  );
};
