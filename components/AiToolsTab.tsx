'use client';

import React, { useState } from 'react';
import { Calculator, Sparkles, Send, Loader2, Bot, PlusCircle, CheckCircle2, FileText } from 'lucide-react';
import { AppState, IncomeRecord, ExpenseRecord, LiabilityRecord, ReceivableRecord } from '@/lib/types';
import { calculateFinancials, formatCurrency } from '@/lib/financeUtils';

interface AiToolsTabProps {
  state: AppState;
  onAddParsedData: (data: {
    incomes: Array<Omit<IncomeRecord, 'id' | 'createdAt'>>;
    expenses: Array<Omit<ExpenseRecord, 'id' | 'createdAt'>>;
    liabilities: Array<Omit<LiabilityRecord, 'id' | 'createdAt' | 'status'>>;
    receivables: Array<Omit<ReceivableRecord, 'id' | 'createdAt' | 'status'>>;
  }) => void;
  onAddIncome: (item: { amount: number; source: string; category: 'orders' | 'tips'; notes: string; date: string }) => void;
  onAddExpense: (item: { amount: number; description: string; category: 'order_upfront'; notes: string; date: string }) => void;
}

export const AiToolsTab: React.FC<AiToolsTabProps> = ({
  state,
  onAddParsedData,
  onAddIncome,
  onAddExpense,
}) => {
  // Order calculator state
  const [upfrontPrice, setUpfrontPrice] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('');
  const [cashFromCustomer, setCashFromCustomer] = useState<string>('');
  const [orderName, setOrderName] = useState<string>('');
  const [calcSuccessMessage, setCalcSuccessMessage] = useState<string>('');

  // Parser state
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'مرحباً بك! أنا مستشارك المالي الذكي لدعم كفاءة ودخل مندوبي الدليفري. اسألني عن أفضل طرق تخفيض مصاريف الوقود والصيانة، أو خطط سداد الديون، أو استراتيجية تنظيم الأوردرات!',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const financials = calculateFinancials(state);

  // Order Calc logic
  const numUpfront = parseFloat(upfrontPrice) || 0;
  const numDelivery = parseFloat(deliveryFee) || 0;
  const numTip = parseFloat(tipAmount) || 0;
  const numCustomer = parseFloat(cashFromCustomer) || 0;

  const expectedTotalFromCustomer = numUpfront + numDelivery + numTip;
  const netEarnings = numDelivery + numTip;
  const customerChange = numCustomer > 0 ? numCustomer - expectedTotalFromCustomer : 0;

  const handleSaveCalcToWallet = () => {
    const today = new Date().toISOString().split('T')[0];
    const sourceName = orderName.trim() || 'تسوية أوردر سريع';

    if (numUpfront > 0) {
      onAddExpense({
        amount: numUpfront,
        description: `عربون مقدم: ${sourceName}`,
        category: 'order_upfront',
        notes: 'تسوية حاسبة الشيفت',
        date: today,
      });
    }

    const totalCollectedIncome = numUpfront + numDelivery;
    if (totalCollectedIncome > 0) {
      onAddIncome({
        amount: totalCollectedIncome,
        source: sourceName,
        category: 'orders',
        notes: `شامل عربون ${numUpfront} + توصيل ${numDelivery}`,
        date: today,
      });
    }

    if (numTip > 0) {
      onAddIncome({
        amount: numTip,
        source: `إكرامية/تيبس: ${sourceName}`,
        category: 'tips',
        notes: 'تسوية حاسبة الشيفت',
        date: today,
      });
    }

    setCalcSuccessMessage('تمت إضافة تسوية الأوردر بنجاح للحسابات والمحفظة! 🎉');
    setTimeout(() => setCalcSuccessMessage(''), 4000);

    setUpfrontPrice('');
    setDeliveryFee('');
    setTipAmount('');
    setCashFromCustomer('');
    setOrderName('');
  };

  // Parser logic
  const handleParseText = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setParsedResult(null);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'parse_text', prompt: inputText }),
      });
      const data = await res.json();
      if (res.ok) setParsedResult(data);
      else alert(data.error || 'خطأ في التحليل');
    } catch {
      alert('خطأ في الاتصال بالخدمة');
    } finally {
      setIsParsing(false);
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
    alert('تم حفظ كافة البيانات المحللة في المحفظة بنجاح!');
  };

  // Chat logic
  const handleSendChat = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || chatInput;
    if (!promptToSend.trim() || isChatting) return;

    if (!overridePrompt) setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: promptToSend }]);
    setIsChatting(true);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'advice',
          prompt: promptToSend,
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
        setChatMessages((prev) => [...prev, { role: 'assistant', text: 'حدث خطأ أثناء جلب النصيحة.' }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'خطأ في الاتصال بالسيرفر.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">أدوات الشيفت والمساعد المالي الذكي</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              حاسبة سريعة للأوردرات، استخراج كشوف الحسابات بالذكاء الاصطناعي، واستشارات مالية مخصصة لزيادة دخلك اليومي
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Quick Shift Order Calculator */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">حاسبة الشيفت والأوردرات</h3>
              <p className="text-xs text-slate-500">احسب باقي العميل وصافي ربح الأوردر فورياً</p>
            </div>
          </div>

          {calcSuccessMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{calcSuccessMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المطعم / العميل</label>
            <input
              type="text"
              placeholder="مثال: مطعم الشبراوي"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عربون/سعر الطعام للمطعم</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={upfrontPrice}
                onChange={(e) => setUpfrontPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-rose-700 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">خدمة التوصيل</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التيبس / الإكرامية</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الكاش المستلم من العميل</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={cashFromCustomer}
                onChange={(e) => setCashFromCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">الإجمالي المطلوبة جلبُه من العميل:</span>
              <span className="font-bold text-amber-300 text-sm">{formatCurrency(expectedTotalFromCustomer, state.currency)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">صافي ربحك من الأوردر:</span>
              <span className="font-bold text-emerald-400 text-sm">+{formatCurrency(netEarnings, state.currency)}</span>
            </div>
            {numCustomer > 0 && (
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400">الباقي المطلوب للعميل:</span>
                <span className={`font-bold text-sm ${customerChange < 0 ? 'text-rose-400' : 'text-blue-300'}`}>
                  {customerChange < 0 ? `عجز: ${formatCurrency(Math.abs(customerChange), state.currency)}` : formatCurrency(customerChange, state.currency)}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleSaveCalcToWallet}
            disabled={expectedTotalFromCustomer <= 0}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تسجيل وتأكيد الحركة للمحفظة</span>
          </button>
        </div>

        {/* Right Column: AI WhatsApp Text Parser & Advisor */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">استخراج الحسابات من الرسائل</h3>
                <p className="text-xs text-slate-500">انسخ نص رسالة الواتساب واستخرج الأرقام بذكاء</p>
              </div>
            </div>

            <textarea
              rows={3}
              placeholder="مثال: تحصيل الشبراوي 500 والتيبس 50، دفعت بنزين 90 وتغيير زيت 150..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none resize-none"
            />

            <button
              onClick={handleParseText}
              disabled={isParsing || !inputText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تحليل النص...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>استخراج البيانات تلقائياً</span>
                </>
              )}
            </button>

            {parsedResult && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900">المعاملات التي تم استخراجها:</div>
                {parsedResult.summary && <p className="text-slate-600 italic">&ldquo;{parsedResult.summary}&rdquo;</p>}
                <button
                  onClick={handleConfirmAddParsed}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition"
                >
                  تأكيد وحفظ الكل
                </button>
              </div>
            )}
          </div>

          {/* Quick AI Prompts */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">أسئلة سريعة للمستشار المالي:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSendChat('كيف أغطي الفجوة المالية الحالية بأسرع وقت؟')}
                className="bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-purple-200 transition"
              >
                💡 خطة تغطية الديون
              </button>
              <button
                onClick={() => handleSendChat('نصائح عملية لتقليل مصاريف البنزين وصيانة المكنة')}
                className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-rose-200 transition"
              >
                🏍️ خفض مصاريف المكنة
              </button>
              <button
                onClick={() => handleSendChat('كيف أوزع إيرادي اليومي بين المصاريف والادخار؟')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 transition"
              >
                📊 توزيع الدخل اليومي
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Interactive AI Chat Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Bot className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">محادثة المستشار المالي</h3>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`p-3 rounded-xl text-xs max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-white text-slate-800 border border-slate-200 leading-relaxed whitespace-pre-wrap'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isChatting && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>المساعد يكتب لك الإجابة...</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="اكتب سؤالك هنا لمساعد المندوب..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleSendChat()}
            disabled={isChatting || !chatInput.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 text-xs"
          >
            <Send className="w-4 h-4" />
            <span>إرسال</span>
          </button>
        </div>
      </div>

    </div>
  );
};
