'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  FileText,
  CheckCircle2,
  PlusCircle,
  HelpCircle,
  Bot,
  User,
} from 'lucide-react';
import { AppState, IncomeRecord, ExpenseRecord, LiabilityRecord, ReceivableRecord } from '@/lib/types';
import { calculateFinancials, formatCurrency } from '@/lib/financeUtils';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onAddParsedData: (data: {
    incomes: Array<Omit<IncomeRecord, 'id' | 'createdAt'>>;
    expenses: Array<Omit<ExpenseRecord, 'id' | 'createdAt'>>;
    liabilities: Array<Omit<LiabilityRecord, 'id' | 'createdAt' | 'status'>>;
    receivables: Array<Omit<ReceivableRecord, 'id' | 'createdAt' | 'status'>>;
  }) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  state,
  onAddParsedData,
}) => {
  const [activeTab, setActiveTab] = useState<'text_parse' | 'advisor'>('text_parse');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'أهلاً بك يا بطل! أنا المساعد الذكي لمُحاسب المندوبين. كيف يمكنني مساعدتك اليوم في تنظيم شيفتاتك، خفض مصاريف المكنة، أو تصفية الفجوة المالية وتغطية ديونك؟',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  if (!isOpen) return null;

  const financials = calculateFinancials(state);

  const handleParseText = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setParsedResult(null);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'parse_text',
          prompt: inputText,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setParsedResult(data);
      } else {
        alert(data.error || 'حدث خطأ أثناء استخراج البيانات.');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال بالسيرفر.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAddParsed = () => {
    if (!parsedResult) return;

    const today = new Date().toISOString().split('T')[0];

    const newIncomes = (parsedResult.incomes || []).map((inc: any) => ({
      amount: Number(inc.amount) || 0,
      source: inc.source || 'تحصيل ذكي',
      category: inc.category || 'orders',
      date: today,
      notes: inc.notes || 'مدخل بالذكاء الاصطناعي',
    }));

    const newExpenses = (parsedResult.expenses || []).map((exp: any) => ({
      amount: Number(exp.amount) || 0,
      description: exp.description || 'مصروف ذكي',
      category: exp.category || 'fuel',
      date: today,
      notes: exp.notes || 'مدخل بالذكاء الاصطناعي',
    }));

    const newLiabilities = (parsedResult.liabilities || []).map((liab: any) => ({
      creditorName: liab.creditorName || 'دين مدخل بالذكاء الاصطناعي',
      totalAmount: Number(liab.totalAmount) || 0,
      paidAmount: 0,
      dueDate: liab.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      category: liab.category || 'installment',
      notes: 'مدخل بالذكاء الاصطناعي',
    }));

    const newReceivables = (parsedResult.receivables || []).map((rec: any) => ({
      debtorName: rec.debtorName || 'مستحق مدخل بالذكاء الاصطناعي',
      totalAmount: Number(rec.totalAmount) || 0,
      collectedAmount: 0,
      expectedDate: rec.expectedDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      category: rec.category || 'restaurant',
      notes: 'مدخل بالذكاء الاصطناعي',
    }));

    onAddParsedData({
      incomes: newIncomes,
      expenses: newExpenses,
      liabilities: newLiabilities,
      receivables: newReceivables,
    });

    setParsedResult(null);
    setInputText('');
    onClose();
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'advice',
          prompt: userMsg,
          contextData: {
            walletBalance: financials.walletBalance,
            totalLiabilities: financials.totalLiabilities,
            totalReceivables: financials.totalReceivables,
            netGap: financials.netGap,
            isSafe: financials.isSafe,
            dailyTargetEarnings: state.dailyTargetEarnings,
            goals: state.goals,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.error || 'عذراً، حدث خطأ أثناء جلب النصيحة.' },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'خطأ في الاتصال بالشبكة.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">المساعد الذكي للمندوب (Gemini AI)</h3>
              <p className="text-xs text-slate-500">استخراج الحسابات من الرسائل واستشارة ماليّة فورية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-slate-100 pt-3 pb-2">
          <button
            onClick={() => setActiveTab('text_parse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'text_parse'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>إدخال رسالة / نص واتساب</span>
          </button>

          <button
            onClick={() => setActiveTab('advisor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'advisor'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>استشارة مالية ذكية</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          
          {activeTab === 'text_parse' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                انسخ ملخص شيفتك أو رسالة الواتساب هنا، وسيقوم الذكاء الاصطناعي بتصنيف المقبوضات والمصروفات والديون تلقائياً:
              </p>

              <textarea
                rows={4}
                placeholder="مثال: تحصيل اليوم من الشبراوي 450 وتيبس 40 ج، دفعت بنزين 80 ج وصيانة كواتش 100 ج، وعليا قسط المكنة 1200 يوم الخميس..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none resize-none"
              />

              <button
                onClick={handleParseText}
                disabled={isLoading || !inputText.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تحليل البيانات بالذكاء الاصطناعي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>تحليل واستخراج الحسابات</span>
                  </>
                )}
              </button>

              {/* Parsed Result Display */}
              {parsedResult && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    نتائج التحليل المستخرجة:
                  </h4>

                  {parsedResult.summary && (
                    <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                      &ldquo;{parsedResult.summary}&rdquo;
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-700">
                    {parsedResult.incomes?.length > 0 && (
                      <div className="text-emerald-700 font-semibold">
                        • المقبوضات ({parsedResult.incomes.length}): {parsedResult.incomes.map((i: any) => `${i.source} (${i.amount} ج.م)`).join('، ')}
                      </div>
                    )}
                    {parsedResult.expenses?.length > 0 && (
                      <div className="text-rose-700 font-semibold">
                        • المصروفات ({parsedResult.expenses.length}): {parsedResult.expenses.map((e: any) => `${e.description} (${e.amount} ج.م)`).join('، ')}
                      </div>
                    )}
                    {parsedResult.liabilities?.length > 0 && (
                      <div className="text-amber-700 font-semibold">
                        • ديون وعليا ({parsedResult.liabilities.length}): {parsedResult.liabilities.map((l: any) => `${l.creditorName} (${l.totalAmount} ج.م)`).join('، ')}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleConfirmAddParsed}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 mt-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>تأكيد وإضافة جميع هذه الحركات للمحفظة</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advisor' && (
            <div className="space-y-3 flex flex-col h-[320px]">
              <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl text-xs max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-slate-900 text-white font-medium'
                          : 'bg-white text-slate-800 border border-slate-200 shadow-2xs leading-relaxed whitespace-pre-wrap'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span>المساعد يفكر في إجابة تناسب وضعك المالي...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اسأل المستشار المالي (مثال: كيف أغطى الفجوة بسرعة؟)"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:border-purple-500 outline-none"
                />
                <button
                  onClick={handleSendChat}
                  disabled={isLoading || !chatInput.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold p-2.5 rounded-xl transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
