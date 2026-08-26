import React from 'react';
import { DollarSign, Percent, Users, BookmarkPlus, Check, RotateCcw } from 'lucide-react';

interface SplitFormProps {
  billAmount: string;
  tipPercentage: string;
  peopleCount: string;
  onBillChange: (val: string) => void;
  onTipChange: (val: string) => void;
  onPeopleChange: (val: string) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  isEditing: boolean;
  errors: {
    bill?: string;
    tip?: string;
    people?: string;
  };
}

const TIP_PRESETS = [0, 10, 15, 18, 20, 25];
const PEOPLE_PRESETS = [1, 2, 3, 4, 5, 6];

export const SplitForm: React.FC<SplitFormProps> = ({
  billAmount,
  tipPercentage,
  peopleCount,
  onBillChange,
  onTipChange,
  onPeopleChange,
  onSave,
  onReset,
  isSaving,
  isEditing,
  errors,
}) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Bill & Tip Parameters</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time integer-cent split with guaranteed totals
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          title="Reset to defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* 1. Bill Amount Input */}
        <div>
          <label
            htmlFor="bill-amount-input"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
          >
            Bill Amount
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <input
              id="bill-amount-input"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={billAmount}
              onChange={(e) => onBillChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 bg-slate-900/90 text-white rounded-xl border font-mono text-lg focus:outline-none focus:ring-2 transition-all ${
                errors.bill
                  ? 'border-rose-500/80 focus:ring-rose-500/50'
                  : 'border-slate-700/70 focus:border-emerald-500/80 focus:ring-emerald-500/30'
              }`}
              aria-invalid={!!errors.bill}
              aria-describedby={errors.bill ? 'bill-error' : undefined}
            />
          </div>
          {errors.bill && (
            <p id="bill-error" className="mt-1.5 text-xs text-rose-400 font-medium">
              {errors.bill}
            </p>
          )}
        </div>

        {/* 2. Tip Percentage Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="tip-percentage-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
            >
              Tip Percentage
            </label>
            <span className="text-xs text-slate-400 font-mono">{tipPercentage || 0}%</span>
          </div>

          <div className="relative rounded-xl shadow-sm mb-2.5">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Percent className="w-4 h-4" />
            </div>
            <input
              id="tip-percentage-input"
              type="text"
              inputMode="decimal"
              placeholder="15"
              value={tipPercentage}
              onChange={(e) => onTipChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/90 text-white rounded-xl border font-mono text-base focus:outline-none focus:ring-2 transition-all ${
                errors.tip
                  ? 'border-rose-500/80 focus:ring-rose-500/50'
                  : 'border-slate-700/70 focus:border-emerald-500/80 focus:ring-emerald-500/30'
              }`}
              aria-invalid={!!errors.tip}
              aria-describedby={errors.tip ? 'tip-error' : undefined}
            />
          </div>

          {/* Tip Presets */}
          <div className="flex flex-wrap gap-1.5">
            {TIP_PRESETS.map((preset) => {
              const isActive = parseFloat(tipPercentage) === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onTipChange(preset.toString())}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {preset}%
                </button>
              );
            })}
          </div>
          {errors.tip && (
            <p id="tip-error" className="mt-1.5 text-xs text-rose-400 font-medium">
              {errors.tip}
            </p>
          )}
        </div>

        {/* 3. Number of People Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="people-count-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
            >
              Number of People
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {peopleCount || 1} {parseInt(peopleCount) === 1 ? 'person' : 'people'}
            </span>
          </div>

          <div className="relative rounded-xl shadow-sm mb-2.5">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Users className="w-4 h-4" />
            </div>
            <input
              id="people-count-input"
              type="text"
              inputMode="numeric"
              placeholder="3"
              value={peopleCount}
              onChange={(e) => onPeopleChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/90 text-white rounded-xl border font-mono text-base focus:outline-none focus:ring-2 transition-all ${
                errors.people
                  ? 'border-rose-500/80 focus:ring-rose-500/50'
                  : 'border-slate-700/70 focus:border-emerald-500/80 focus:ring-emerald-500/30'
              }`}
              aria-invalid={!!errors.people}
              aria-describedby={errors.people ? 'people-error' : undefined}
            />
          </div>

          {/* People Presets */}
          <div className="flex flex-wrap gap-1.5">
            {PEOPLE_PRESETS.map((preset) => {
              const isActive = parseInt(peopleCount) === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onPeopleChange(preset.toString())}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {preset} {preset === 1 ? 'Person' : 'People'}
                </button>
              );
            })}
          </div>
          {errors.people && (
            <p id="people-error" className="mt-1.5 text-xs text-rose-400 font-medium">
              {errors.people}
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !!errors.bill || !!errors.tip || !!errors.people}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : isEditing ? (
            <Check className="w-4 h-4" />
          ) : (
            <BookmarkPlus className="w-4 h-4" />
          )}
          <span>
            {isSaving
              ? 'Saving to Database...'
              : isEditing
              ? 'Update Saved Calculation'
              : 'Save Calculation to History'}
          </span>
        </button>
      </div>
    </div>
  );
};
