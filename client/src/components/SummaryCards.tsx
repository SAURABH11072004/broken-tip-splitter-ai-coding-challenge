import React from 'react';
import { SplitCalculationResult, formatCurrency } from '@broken-tip-splitter/shared';
import { Receipt, Coins, Users, CreditCard, Layers, PieChart, Sparkles } from 'lucide-react';

interface SummaryCardsProps {
  calculation: SplitCalculationResult | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ calculation }) => {
  if (!calculation) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Original Bill */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider">Original Bill</span>
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatCurrency(calculation.billCents)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {calculation.billCents} integer cents
          </div>
        </div>

        {/* 2. Tip Info */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider">Tip Amount</span>
            <Coins className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {formatCurrency(calculation.tipCents)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {calculation.tipPercentage}% rate ({calculation.tipCents}¢)
          </div>
        </div>

        {/* 3. Base Share */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider">Equal Base Share</span>
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-300">
            {formatCurrency(calculation.baseShareCents)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            floor division per person
          </div>
        </div>

        {/* 4. Remainder */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="uppercase tracking-wider">Remainder</span>
            <PieChart className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300">
            {calculation.remainderCents}¢
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {calculation.remainderCents === 0 ? '0 extra cents' : `+1¢ to ${calculation.remainderCents} ${calculation.remainderCents === 1 ? 'person' : 'people'}`}
          </div>
        </div>
      </div>

      {/* Featured Grand Total Card */}
      <div className="glass-panel-accent p-5 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
              <span>Grand Total</span>
              <Sparkles className="w-3 h-3" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {formatCurrency(calculation.grandTotalCents)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-4 h-4 text-slate-400" />
            <span>
              Split across <strong className="text-white font-mono">{calculation.peopleCount}</strong> {calculation.peopleCount === 1 ? 'person' : 'people'}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="text-slate-400">
            Base: <span className="text-white font-mono">{formatCurrency(calculation.baseShareCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
