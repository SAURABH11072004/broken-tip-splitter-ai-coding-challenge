import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Broken Tip Splitter
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Exact Cents Engine
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Precision bill splitting ensuring mathematically exact share totals without cent loss.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
            aria-expanded={showExplanation}
            aria-controls="problem-explanation"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>How the rounding bug works</span>
            {showExplanation ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Explainer Box */}
      {showExplanation && (
        <div
          id="problem-explanation"
          className="mt-4 p-5 rounded-2xl glass-panel-accent border border-emerald-500/30 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-bold text-white text-base">
                Why Standard Bill Splitters Silently Lose Cents
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Standard bill calculators often round each person&apos;s share independently or calculate tips per person using floating-point math. For example, splitting a <span className="font-semibold text-white">$10.03</span> bill among 3 people naively gives <span className="font-mono text-amber-300">$3.34</span> each, resulting in <span className="font-mono text-rose-400">$3.34 × 3 = $10.02</span> (a missing cent!).
              </p>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                <div><span className="text-emerald-400">✓ Invariant:</span> <span className="text-white">SUM(all person shares) === Grand Total</span></div>
                <div><span className="text-emerald-400">✓ Rule:</span> All arithmetic converted to integer cents; tip calculated once; remainder distributed explicitly to the first N persons.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
