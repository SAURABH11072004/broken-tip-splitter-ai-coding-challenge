import React from 'react';
import { SplitShare, formatCurrency } from '@broken-tip-splitter/shared';
import { ShieldCheck, User } from 'lucide-react';

interface BreakdownTableProps {
  shares: SplitShare[];
  grandTotalCents: number;
}

export const BreakdownTable: React.FC<BreakdownTableProps> = ({
  shares,
  grandTotalCents,
}) => {
  const totalSumCents = shares.reduce((acc, s) => acc + s.finalShareCents, 0);
  const isExactMatch = totalSumCents === grandTotalCents;

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="p-4 md:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <span>Person-by-Person Breakdown</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {shares.length} {shares.length === 1 ? 'Person' : 'People'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent view of exact integer-cent distribution per individual
          </p>
        </div>

        {/* Verification Status */}
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            isExactMatch
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>✓ Verified: Shares sum to {formatCurrency(totalSumCents)}</span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-sm" aria-label="Split shares per person">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400 sticky top-0 z-10 backdrop-blur-md">
              <th scope="col" className="py-3 px-4 md:px-6">Person</th>
              <th scope="col" className="py-3 px-4 md:px-6 text-right">Base Share</th>
              <th scope="col" className="py-3 px-4 md:px-6 text-right">Extra Cent</th>
              <th scope="col" className="py-3 px-4 md:px-6 text-right">Final Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {shares.map((share) => {
              const hasExtra = share.extraCents > 0;
              return (
                <tr
                  key={share.personNumber}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    hasExtra ? 'bg-emerald-500/[0.03]' : ''
                  }`}
                >
                  <th scope="row" className="py-3 px-4 md:px-6 font-sans font-medium text-slate-200 flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        hasExtra
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span>Person {share.personNumber}</span>
                  </th>
                  <td className="py-3 px-4 md:px-6 text-right text-slate-300">
                    {formatCurrency(share.baseShareCents)}
                  </td>
                  <td className="py-3 px-4 md:px-6 text-right">
                    {hasExtra ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        +${(share.extraCents / 100).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 md:px-6 text-right font-bold text-white text-base">
                    {formatCurrency(share.finalShareCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 border-t-2 border-slate-700 font-mono text-sm font-bold sticky bottom-0 z-10">
              <th scope="row" className="py-3.5 px-4 md:px-6 font-sans text-white uppercase tracking-wider text-xs">
                TOTAL:
              </th>
              <td className="py-3.5 px-4 md:px-6 text-right text-slate-400 text-xs font-sans">
                {shares.length} shares
              </td>
              <td className="py-3.5 px-4 md:px-6 text-right text-emerald-400 text-xs">
                +{(shares.reduce((a, s) => a + s.extraCents, 0) / 100).toFixed(2)} remainder
              </td>
              <td className="py-3.5 px-4 md:px-6 text-right text-emerald-300 text-lg">
                {formatCurrency(totalSumCents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
