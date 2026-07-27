'use client';

import React, { useState } from 'react';
import { Calculator, X, ArrowRight, PlusCircle, CheckCircle2 } from 'lucide-react';
import { AppState } from '@/lib/types';
import { formatCurrency } from '@/lib/financeUtils';

interface OrderCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncome: (item: { amount: number; source: string; category: 'orders' | 'tips'; notes: string; date: string }) => void;
  onAddExpense: (item: { amount: number; description: string; category: 'order_upfront'; notes: string; date: string }) => void;
  currency: string;
}

export const OrderCalculatorModal: React.FC<OrderCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddIncome,
  onAddExpense,
  currency,
}) => {
  const [upfrontPrice, setUpfrontPrice] = useState<string>(''); // عربون المطعم
  const [deliveryFee, setDeliveryFee] = useState<string>(''); // خدمة التوصيل
  const [tipAmount, setTipAmount] = useState<string>(''); // التيبس
  const [cashFromCustomer, setCashFromCustomer] = useState<string>(''); // الكاش من العميل
  const [orderName, setOrderName] = useState<string>(''); // اسم المطعم / العميل

  if (!isOpen) return null;

  const numUpfront = parseFloat(upfrontPrice) || 0;
  const numDelivery = parseFloat(deliveryFee) || 0;
  const numTip = parseFloat(tipAmount) || 0;
  const numCustomer = parseFloat(cashFromCustomer) || 0;

  const expectedTotalFromCustomer = numUpfront + numDelivery + numTip;
  const netEarnings = numDelivery + numTip;
  const customerChange = numCustomer > 0 ? numCustomer - expectedTotalFromCustomer : 0;

  const handleSaveToWallet = () => {
    const today = new Date().toISOString().split('T')[0];
    const sourceName = orderName.trim() || 'تسوية أوردر سريع';

    // 1. Log upfront expense if > 0
    if (numUpfront > 0) {
      onAddExpense({
        amount: numUpfront,
        description: `دفعة عربون مقدم: ${sourceName}`,
        category: 'order_upfront',
        notes: 'تسوية سريعة من الحاسبة',
        date: today,
      });
    }

    // 2. Log collection income
    const totalCollectedIncome = numUpfront + numDelivery;
    if (totalCollectedIncome > 0) {
      onAddIncome({
        amount: totalCollectedIncome,
        source: sourceName,
        category: 'orders',
        notes: `شامل عربون ${numUpfront} + خدمة توصيل ${numDelivery}`,
        date: today,
      });
    }

    // 3. Log tip if > 0
    if (numTip > 0) {
      onAddIncome({
        amount: numTip,
        source: `إكرامية/تيبس: ${sourceName}`,
        category: 'tips',
        notes: 'تسوية حاسبة الشيفت',
        date: today,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 text-white animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">حاسبة تسوية الأوردر السريعة</h3>
              <p className="text-xs text-slate-400">حساب باقي العميل وصافي مكسبك من الأوردر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              اسم المطعم / العميل (اختياري)
            </label>
            <input
              type="text"
              placeholder="مثال: كبابجي الأمانة، صيدلية العزبي"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                عربون/سعر الطعام للمطعم (ج.م)
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={upfrontPrice}
                onChange={(e) => setUpfrontPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-rose-400 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                خدمة/عمولة التوصيل (ج.م)
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الإكرامية / التيبس (ج.م)
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-amber-400 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الكاش المستلم من العميل (ج.م)
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={cashFromCustomer}
                onChange={(e) => setCashFromCustomer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-slate-950 text-white p-4 rounded-xl space-y-3 mt-4 border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">المبلغ المطلوب الكلي من العميل:</span>
              <span className="font-bold text-amber-300 text-sm">
                {formatCurrency(expectedTotalFromCustomer, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">صافي ربحك من الأوردر (توصيل + تيبس):</span>
              <span className="font-bold text-emerald-400 text-sm">
                +{formatCurrency(netEarnings, currency)}
              </span>
            </div>

            {numCustomer > 0 && (
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400">الباقي المطلوب إرجاعه للعميل:</span>
                <span className={`font-bold text-sm ${customerChange < 0 ? 'text-rose-400' : 'text-blue-300'}`}>
                  {customerChange < 0
                    ? `عجز في المستلم: ${formatCurrency(Math.abs(customerChange), currency)}`
                    : formatCurrency(customerChange, currency)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveToWallet}
              disabled={expectedTotalFromCustomer <= 0}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تعديل وحفظ تلقائي للمحفظة</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
