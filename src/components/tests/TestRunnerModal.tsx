import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { runPricingEngineTests, TestResult } from '../../lib/pricingEngine.test.ts';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [results, setResults] = useState<TestResult[]>(() => runPricingEngineTests());
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRerun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setResults(runPricingEngineTests());
      setIsRunning(false);
    }, 300);
  };

  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Deterministic Pricing & Safeguard Test Suite
              </h2>
              <p className="text-xs text-stone-500">
                Unit test execution for margin floors, expiry urgency rules, and markdown calculations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1 rounded"
          >
            Close
          </button>
        </div>

        {/* Status Strip */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {allPassed ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                All {results.length} Unit Tests Passed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-rose-600">
                <XCircle className="w-4 h-4 text-rose-600" />
                {results.length - passedCount} Tests Failed
              </span>
            )}
          </div>

          <button
            onClick={handleRerun}
            disabled={isRunning}
            className="px-3 py-1 bg-white border border-stone-200 hover:bg-stone-50 rounded-md font-semibold text-stone-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Rerun Tests</span>
          </button>
        </div>

        {/* Test List */}
        <div className="p-6 overflow-y-auto space-y-3 text-xs flex-1 divide-y divide-stone-100">
          {results.map((test, index) => (
            <div key={index} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold text-stone-900">{test.name}</span>
                </div>
                {test.message && (
                  <p className="text-[11px] text-stone-500 pl-6">{test.message}</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    test.passed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {test.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
