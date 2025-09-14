"use client";

import React, { useState } from 'react';
import { X, Mail, RefreshCw } from 'lucide-react';
import InputSanitizer from '../security/InputSanitizer';

interface EmailConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onConfirm: (code: string) => Promise<void>;
  onResendCode: () => Promise<void>;
}

export const EmailConfirmationPopup: React.FC<EmailConfirmationPopupProps> = ({
  isOpen,
  onClose,
  userEmail,
  onConfirm,
  onResendCode
}) => {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode.trim()) {
      setError('يرجى إدخال رمز التأكيد');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onConfirm(confirmationCode);
      setSuccess('تم تأكيد البريد الإلكتروني بنجاح!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'فشل في تأكيد البريد الإلكتروني');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setResendMessage('');
    setError('');
    try {
      await onResendCode();
      setResendMessage('تم إرسال رمز جديد إلى بريدك الإلكتروني');
    } catch (err: any) {
      setError(err.message || 'فشل في إرسال الرمز');
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-background rounded-2xl border border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Mail className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">تأكيد البريد الإلكتروني</h2>
              <p className="text-sm text-muted-foreground">أدخل الرمز المرسل إليك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              تم إرسال رمز التأكيد إلى:
            </p>
            <p className="text-sm font-medium text-foreground bg-secondary/50 px-3 py-2 rounded-lg">
              {userEmail}
            </p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                رمز التأكيد
              </label>
              <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
                <InputSanitizer context="html" maxLength={6}>
                  <input
                    type="text"
                    placeholder="أدخل الرمز المكون من 6 أرقام"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-center tracking-widest"
                    value={confirmationCode}
                    onChange={(e) => {
                      setConfirmationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    maxLength={6}
                  />
                </InputSanitizer>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-500 text-sm bg-green-500/10 px-3 py-2 rounded-lg">
                {success}
              </div>
            )}

            {resendMessage && (
              <div className="text-blue-500 text-sm bg-blue-500/10 px-3 py-2 rounded-lg">
                {resendMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                إعادة الإرسال
              </button>
              
              <button
                type="submit"
                disabled={loading || !confirmationCode.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-violet-500 rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : null}
                تأكيد
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              لم تستلم الرمز؟ تحقق من مجلد الرسائل غير المرغوب فيها أو انقر على إعادة الإرسال
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPopup;