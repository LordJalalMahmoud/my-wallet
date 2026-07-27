'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare, CheckCircle2, ShieldCheck } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    }
    return false;
  });
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [isIOS] = useState(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    }
    return false;
  });

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Service Worker registered:', reg.scope))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error prompting install:', err);
      }
    } else {
      // Show manual install guide modal (for iOS or browsers that don't auto-prompt)
      setShowModal(true);
    }
  };

  if (isInstalled) {
    return null; // App is already installed and running as native standalone PWA
  }

  return (
    <>
      {/* Persistent Header Action Button */}
      <button
        id="btn-pwa-install-header"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-emerald-300/30 whitespace-nowrap"
        title="تثبيت التطبيق على الشاشة الرئيسية للموبايل"
      >
        <Smartphone className="w-4 h-4 animate-bounce shrink-0" />
        <span>تثبيت التطبيق</span>
      </button>

      {/* Top Banner (Dismissible) */}
      {showBanner && (
        <div className="bg-slate-900 border-b border-emerald-500/30 text-white py-2.5 px-4 shadow-md flex items-center justify-between text-xs dir-rtl relative z-20">
          <div className="flex items-center gap-2.5 max-w-xl">
            <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/30 shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-300">ثبّت &ldquo;محفظتي&rdquo; على موبايلك!</span>
              <span className="text-slate-300 mr-1.5 hidden sm:inline">
                لتجربة سريعة وسلسة بدون الحاجة لفتح المتصفح في كل مرة.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mr-2">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition"
            >
              تثبيت الآن
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1 text-slate-400 hover:text-white rounded transition"
              title="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Installation Guide Modal (For iOS / Desktop / Custom) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/30">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">طريقة تثبيت تطبيق &ldquo;محفظتي&rdquo; على الموبايل</h3>
            <p className="text-slate-400 text-xs mb-5 leading-relaxed">
              يمكنك إضافة التطبيق مباشرة لشاشة هاتفك الرئيسية كأنه تطبيق مثبّت من المتجر:
            </p>

            {isIOS ? (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300 mb-6">
                <div className="flex items-start gap-2.5">
                  <Share2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>خطوة 1:</strong> اضغط على زر <strong>المشاركة (Share)</strong> في أسفل شاشة المتصفح (Safari).
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>خطوة 2:</strong> اختر <strong>&ldquo;الإضافة إلى الشاشة الرئيسية&rdquo; (Add to Home Screen)</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>خطوة 3:</strong> اضغط <strong>&ldquo;إضافة&rdquo; (Add)</strong> بالأعلى لتظهر أيقونة التطبيق فوراً.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300 mb-6">
                <div className="flex items-start gap-2.5">
                  <Download className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>خطوة 1:</strong> اضغط قائمة الخيارات الثلاث نقاط (⋮) في أعلى متصفح Chrome / Edge.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>خطوة 2:</strong> اختر <strong>&ldquo;تثبيت التطبيق&rdquo; (Install App)</strong> أو <strong>&ldquo;إضافة إلى الشاشة الرئيسية&rdquo;</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>خطوة 3:</strong> أكّد التثبيت ليعمل التطبيق كبرنامج مستقل بدون شريط العنوان.
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition text-xs"
            >
              فهمت، حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
