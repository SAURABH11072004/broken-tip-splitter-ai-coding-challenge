import React from 'react';
import { SplitCalculationResult, formatCurrency } from '@broken-tip-splitter/shared';
import { History, Trash2, ArrowUpRight, Clock, Users, AlertCircle } from 'lucide-react';

interface HistorySectionProps {
  history: SplitCalculationResult[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (item: SplitCalculationResult) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  isLoading,
  selectedId,
  onSelect,
  onDelete,
  onRefresh,
}) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Saved History</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {history.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Persisted SQLite records with full person shares
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading saved calculations...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="py-8 text-center text-slate-400 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-xs">No saved calculations yet.</p>
          <p className="text-[11px] text-slate-500">
            Fill out the form and click &quot;Save Calculation&quot; to persist your split.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {history.map((item) => {
            const isSelected = item.id === selectedId;
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex-1 text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {formatCurrency(item.grandTotalCents)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      (Bill: {formatCurrency(item.billCents)} + {item.tipPercentage}% tip)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      {item.peopleCount} {item.peopleCount === 1 ? 'person' : 'people'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300 font-mono">
                      {formatCurrency(item.baseShareCents)}/ea
                      {item.remainderCents > 0 && ` (+${item.remainderCents}¢ rem)`}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Load into form"
                    aria-label={`Load calculation ${item.id}`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => item.id && onDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Delete record"
                    aria-label={`Delete calculation ${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
