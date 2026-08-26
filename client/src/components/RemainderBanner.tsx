import React from 'react';
import { Info, CheckCircle2 } from 'lucide-react';

interface RemainderBannerProps {
  remainderCents: number;
  remainderExplanation: string;
}

export const RemainderBanner: React.FC<RemainderBannerProps> = ({
  remainderCents,
  remainderExplanation,
}) => {
  const isEven = remainderCents === 0;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isEven
          ? 'bg-slate-900/60 border-slate-800 text-slate-300'
          : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {isEven ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1 text-sm">
          <div className="font-semibold text-white flex items-center gap-2">
            <span>Fair Remainder Allocation</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                isEven
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {remainderCents}¢ Remainder
            </span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            {remainderExplanation}
          </p>
        </div>
      </div>
    </div>
  );
};
