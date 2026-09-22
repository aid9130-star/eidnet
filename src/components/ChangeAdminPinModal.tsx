import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, X, CheckCircle2, AlertCircle } from 'lucide-react';
import * as dataService from '../lib/dataService.ts';

interface ChangeAdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangeAdminPinModal: React.FC<ChangeAdminPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanCurrent = currentPin.trim();
    const cleanNew = newPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanCurrent) {
      setError('يرجى إدخال كلمة المرور الحالية');
      return;
    }
    if (!cleanNew) {
      setError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    if (cleanNew.length < 4) {
      setError('كلمة المرور الجديدة يجب أن تتكون من 4 خانات على الأقل');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    setLoading(true);
    try {
      await dataService.changeAdminPin(cleanCurrent, cleanNew);

      setSuccessMsg('تم حفظ وتحديث كلمة مرور المشرف بنجاح! ستسري فوراً على جميع عمليات الدخول.');
      if (onSuccess) onSuccess();

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError(null);
    setSuccessMsg(null);
    onClose();
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
            onClick={handleClose}
            type="button"
            className="absolute left-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-3 text-indigo-300">
            <KeyRound className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-bold">تغيير كلمة مرور المشرف</h3>
          <p className="text-slate-400 text-xs mt-1">
            تعيين كلمة مرور جديدة للوحة تحكم الأستاذ إمام يوسف
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 dark:text-slate-200">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كلمة المرور الحالية
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showCurrentPin ? 'text' : 'password'}
                required
                placeholder="أدخل كلمة المرور الحالية (مثل emam2025)..."
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                className="w-full pr-10 pl-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
              >
                {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              الرمز الافتراضي المبدئي هو: <code className="text-indigo-600 dark:text-indigo-400 font-mono">emam2025</code>
            </p>
          </div>

          {/* New PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showNewPin ? 'text' : 'password'}
                required
                placeholder="أدخل كلمة المرور الجديدة (أرقام أو حروف)..."
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full pr-10 pl-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              يجب ألا تقل عن 4 خانات لضمان أمان اللوحة.
            </p>
          </div>

          {/* Confirm PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              تأكيد كلمة المرور الجديدة
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showConfirmPin ? 'text' : 'password'}
                required
                placeholder="أعد كتابة كلمة المرور الجديدة للتأكيد..."
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className={`w-full pr-10 pl-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 transition-all ${
                  confirmPin && confirmPin !== newPin
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-600 focus:border-transparent'
                }`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
              >
                {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPin && confirmPin !== newPin && (
              <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                كلمة المرور غير متطابقة مع الحقل السابق
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || (!!confirmPin && confirmPin !== newPin)}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>حفظ كلمة المرور الجديدة</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
