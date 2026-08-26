import React from 'react';
import { formatCurrency } from '@broken-tip-splitter/shared';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface VerificationBadgeProps {
  grandTotalCents: number;
  totalSharesCents: number;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  grandTotalCents,
  totalSharesCents,
}) => {
  const isMatch = grandTotalCents === totalSharesCents;

  return (
    <div
      role="status"
      className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
        isMatch
          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
          : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {isMatch ? (
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
        )}
        <div className="text-sm">
          <span className="font-bold text-white block">
            {isMatch
              ? '✓ Mathematical Invariant Verified'
              : '✗ Invariant Violation Detected'}
          </span>
          <span className="text-xs text-slate-300">
            {isMatch
              ? `Individual shares sum exactly to ${formatCurrency(totalSharesCents)} (0.00¢ discrepancy).`
              : `Sum of shares (${formatCurrency(totalSharesCents)}) does not equal grand total (${formatCurrency(grandTotalCents)}).`}
          </span>
        </div>
      </div>

      <div className="hidden sm:block text-right font-mono text-xs text-slate-400">
        <div>Grand Total: <span className="text-white font-bold">{formatCurrency(grandTotalCents)}</span></div>
        <div>Sum of Shares: <span className="text-emerald-400 font-bold">{formatCurrency(totalSharesCents)}</span></div>
      </div>
    </div>
  );
};
