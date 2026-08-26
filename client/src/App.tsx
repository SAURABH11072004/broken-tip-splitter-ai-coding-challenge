import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  calculateSplit,
  splitInputSchema,
  dollarsToCents,
  centsToDollars,
  SplitCalculationResult,
} from '@broken-tip-splitter/shared';
import {
  fetchCalculations,
  saveCalculation,
  updateCalculation,
  deleteCalculationRecord,
} from './services/api';
import { Header } from './components/Header';
import { SplitForm } from './components/SplitForm';
import { SummaryCards } from './components/SummaryCards';
import { RemainderBanner } from './components/RemainderBanner';
import { BreakdownTable } from './components/BreakdownTable';
import { VerificationBadge } from './components/VerificationBadge';
import { HistorySection } from './components/HistorySection';
import { ToastContainer, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  // Input states
  const [billAmount, setBillAmount] = useState<string>('10.03');
  const [tipPercentage, setTipPercentage] = useState<string>('15');
  const [peopleCount, setPeopleCount] = useState<string>('3');

  // Persistence & history states
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<SplitCalculationResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add toast helper
  const addToast = useCallback((type: 'success' | 'error', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Live validation and instant calculation
  const { calculation, errors } = useMemo(() => {
    const fieldErrors: { bill?: string; tip?: string; people?: string } = {};

    // Validate Bill Amount
    if (!billAmount.trim()) {
      fieldErrors.bill = 'Bill amount is required.';
    } else {
      const num = parseFloat(billAmount);
      if (isNaN(num)) {
        fieldErrors.bill = 'Bill amount must be a valid number.';
      } else if (num <= 0) {
        fieldErrors.bill = 'Bill amount must be greater than zero.';
      } else {
        const parts = billAmount.trim().split('.');
        if (parts.length > 1 && parts[1].length > 2) {
          fieldErrors.bill = 'Bill amount cannot exceed 2 decimal places.';
        }
      }
    }

    // Validate Tip Percentage
    if (tipPercentage.trim() === '') {
      fieldErrors.tip = 'Tip percentage is required.';
    } else {
      const tipNum = parseFloat(tipPercentage);
      if (isNaN(tipNum)) {
        fieldErrors.tip = 'Tip percentage must be a valid number.';
      } else if (tipNum < 0) {
        fieldErrors.tip = 'Tip percentage must be zero or greater.';
      }
    }

    // Validate People Count
    if (!peopleCount.trim()) {
      fieldErrors.people = 'Number of people is required.';
    } else {
      const count = parseFloat(peopleCount);
      if (isNaN(count) || !Number.isInteger(count)) {
        fieldErrors.people = 'Number of people must be a whole integer.';
      } else if (count < 1) {
        fieldErrors.people = 'Number of people must be at least 1.';
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { calculation: null, errors: fieldErrors };
    }

    try {
      const parsed = splitInputSchema.parse({
        billAmount,
        tipPercentage,
        peopleCount,
      });

      const billCents = dollarsToCents(parsed.billAmount);
      const result = calculateSplit({
        billCents,
        tipPercentage: parsed.tipPercentage,
        peopleCount: parsed.peopleCount,
      });

      return { calculation: result, errors: {} };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid calculation parameters.';
      return { calculation: null, errors: { bill: message } };
    }
  }, [billAmount, tipPercentage, peopleCount]);

  // Load history from API
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const data = await fetchCalculations();
      setHistory(data);
    } catch (err: unknown) {
      console.warn('Could not fetch calculations history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Save or Update calculation
  const handleSave = async () => {
    if (!calculation) return;

    setIsSaving(true);
    try {
      if (selectedHistoryId) {
        const updated = await updateCalculation(selectedHistoryId, {
          billAmount,
          tipPercentage,
          peopleCount,
        });
        addToast('success', 'Calculation Updated', 'Saved changes to database.');
        setSelectedHistoryId(updated.id || null);
      } else {
        const saved = await saveCalculation({
          billAmount,
          tipPercentage,
          peopleCount,
        });
        addToast('success', 'Calculation Saved', 'Persisted to SQLite database.');
        setSelectedHistoryId(saved.id || null);
      }
      await loadHistory();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to save this calculation. Please check your connection and try again.';
      addToast('error', 'Failed to Save', message);
    } finally {
      setIsSaving(false);
    }
  };

  // Select item from history
  const handleSelectHistory = (item: SplitCalculationResult) => {
    setBillAmount(centsToDollars(item.billCents));
    setTipPercentage(item.tipPercentage.toString());
    setPeopleCount(item.peopleCount.toString());
    setSelectedHistoryId(item.id || null);
    addToast('success', 'Calculation Loaded', `Loaded split for ${centsToDollars(item.billCents)}`);
  };

  // Delete item from history
  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteCalculationRecord(id);
      addToast('success', 'Calculation Deleted', 'Removed record from database.');
      if (selectedHistoryId === id) {
        setSelectedHistoryId(null);
      }
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete record.';
      addToast('error', 'Delete Error', message);
    }
  };

  // Reset form
  const handleReset = () => {
    setBillAmount('10.03');
    setTipPercentage('15');
    setPeopleCount('3');
    setSelectedHistoryId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <Header />

        {/* Main Grid Content */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & History */}
          <div className="lg:col-span-5 space-y-6">
            <SplitForm
              billAmount={billAmount}
              tipPercentage={tipPercentage}
              peopleCount={peopleCount}
              onBillChange={(v) => {
                setBillAmount(v);
                setSelectedHistoryId(null);
              }}
              onTipChange={(v) => {
                setTipPercentage(v);
                setSelectedHistoryId(null);
              }}
              onPeopleChange={(v) => {
                setPeopleCount(v);
                setSelectedHistoryId(null);
              }}
              onSave={handleSave}
              onReset={handleReset}
              isSaving={isSaving}
              isEditing={!!selectedHistoryId}
              errors={errors}
            />

            <HistorySection
              history={history}
              isLoading={isLoadingHistory}
              selectedId={selectedHistoryId}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
              onRefresh={loadHistory}
            />
          </div>

          {/* Right Column: Instant Results & Person Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            {calculation ? (
              <>
                <SummaryCards calculation={calculation} />

                <RemainderBanner
                  remainderCents={calculation.remainderCents}
                  remainderExplanation={calculation.remainderExplanation}
                />

                <VerificationBadge
                  grandTotalCents={calculation.grandTotalCents}
                  totalSharesCents={calculation.verificationTotalCents}
                />

                <BreakdownTable
                  shares={calculation.shares}
                  grandTotalCents={calculation.grandTotalCents}
                />
              </>
            ) : (
              <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto text-xl font-bold">
                  $
                </div>
                <h3 className="text-base font-semibold text-white">Enter Valid Bill Parameters</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Please provide a positive bill amount, valid tip percentage, and integer number of people to calculate the exact per-person share.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
