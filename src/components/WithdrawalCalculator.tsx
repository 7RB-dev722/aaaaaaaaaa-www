import React, { useState, useEffect } from 'react';
import { DollarSign, Percent } from 'lucide-react';

interface WithdrawalCalculatorProps {
  totalSales: number;
}

const WithdrawalCalculator: React.FC<WithdrawalCalculatorProps> = ({ totalSales }) => {
  const [method, setMethod] = useState<'crypto' | 'superkey'>('crypto');
  const [exchangeRate, setExchangeRate] = useState('');
  const [commission, setCommission] = useState('');
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    const comm = parseFloat(commission);
    if (!commission || isNaN(comm) || comm < 0) {
      setResult('...');
      return;
    }
    
    const commissionDecimal = comm / 100;
    const amountAfterCommission = totalSales * (1 - commissionDecimal);

    if (method === 'crypto') {
      setResult(`$${amountAfterCommission.toFixed(2)}`);
    } else { // superkey
      const rate = parseFloat(exchangeRate);
      if (!exchangeRate || isNaN(rate) || rate <= 0) {
        setResult('...');
        return;
      }
      const finalAmountInIQD = amountAfterCommission * rate;
      setResult(`${finalAmountInIQD.toLocaleString('en-US', { maximumFractionDigits: 0 })} IQD`);
    }
  }, [totalSales, method, exchangeRate, commission]);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700" dir="rtl">
      <h3 className="text-xl font-bold text-white mb-6">حاسبة الأرباح والسحب</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">إجمالي المبيعات الصافية</label>
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-center">
          <span className="text-2xl font-bold text-green-400">${totalSales.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">طريقة السحب</label>
        <div className="flex items-center space-x-2 rtl:space-x-reverse bg-slate-900/50 p-1 rounded-xl">
          <button
            onClick={() => setMethod('crypto')}
            className={`flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${method === 'crypto' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}
          >
            Crypto
          </button>
          <button
            onClick={() => setMethod('superkey')}
            className={`flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${method === 'superkey' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}
          >
            Super Key
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-6 animate-fade-in-up">
        {method === 'superkey' && (
          <div className="animate-fade-in-up">
            <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-300 mb-2">سعر الصرف (IQD لكل $)</label>
            <div className="relative">
              <DollarSign className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="exchangeRate"
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-full pr-10 rtl:pl-10 rtl:pr-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="e.g., 1500"
              />
            </div>
          </div>
        )}
        <div>
          <label htmlFor="commission" className="block text-sm font-medium text-gray-300 mb-2">العمولة</label>
          <div className="relative">
            <Percent className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="commission"
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="w-full pr-10 rtl:pl-10 rtl:pr-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="e.g., 5"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">المبلغ النهائي بعد العمولة</label>
        <div className="p-4 bg-slate-900 border-2 border-dashed border-slate-600 rounded-xl text-center">
          <span className="text-2xl font-bold text-cyan-300 tracking-wider">{result}</span>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalCalculator;
