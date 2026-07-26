'use client';

import React, { useState } from 'react';
import { Wallet, ShieldCheck, Sparkles, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onGoogleLogin: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGoogleLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      await onGoogleLogin();
    } catch (err: any) {
      console.error('Google login failed:', err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('تم حظر النافذة المنبثقة من قِبل المتصفح. يرجى السماح بالنوافذ المنبثقة للنسخة المحفوظة.');
      } else {
        setErrorMsg('حدث خطأ أثناء تسجيل الدخول بـ Google. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden dir-rtl">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-center">
        {/* App Logo */}
        <div className="mx-auto w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mb-5 shadow-inner">
          <Wallet className="w-9 h-9" />
        </div>

        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          محفظتي <span className="text-emerald-400 text-lg font-medium">للمندوبين</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
          المحاسب المالي الذكي لإدارة المقبوضات والالتزامات والمستحقات اليومية.
        </p>

        {/* Feature Pill Highlights */}
        <div className="my-6 space-y-2.5 text-right bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>حفظ سحابي مباشر ومزامن على قاعدة بيانات Firebase.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>حساب تلقائي لصافي الفجوة المالية &ldquo;فلوس ليا وفلوس عليا&rdquo;.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>تحليل كشوفات الحساب وصور الإيصالات بالذكاء الاصطناعي.</span>
          </div>
        </div>

        {/* Mandatory Login Notice */}
        <div className="mb-6 flex items-center justify-center gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl text-xs">
          <Lock className="w-4 h-4 shrink-0" />
          <span>تسجيل الدخول إلزامي بحساب Google لحماية بياناتك</span>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 text-right">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Login Button */}
        <button
          id="btn-google-login-mandatory"
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-3 disabled:opacity-60 active:scale-98 cursor-pointer"
        >
          {isLoggingIn ? (
            <div className="flex items-center gap-2 text-slate-700 text-sm">
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>جاري الاتصال بـ Google...</span>
            </div>
          ) : (
            <>
              {/* Google SVG Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-sm">المتابعة باستخدام Google</span>
            </>
          )}
        </button>

        {/* Footer info */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-500 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>بياناتك محمية ومشفرة عبر خدمات Google Firebase Security</span>
        </div>
      </div>
    </div>
  );
};
