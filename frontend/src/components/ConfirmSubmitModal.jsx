import React from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';

export default function ConfirmSubmitModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  totalQuestions,
  answeredCount,
  markedCount
}) {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Confirm Assessment Submission</h3>
            <p className="text-xs text-slate-400">Review your completion status</p>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2 my-4 text-center">
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <span className="block text-xl font-bold font-mono text-emerald-400">{answeredCount}</span>
            <span className="text-[11px] text-emerald-300/80">Answered</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
            <span className="block text-xl font-bold font-mono text-amber-400">{markedCount}</span>
            <span className="text-[11px] text-amber-300/80">Marked</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="block text-xl font-bold font-mono text-slate-300">{unansweredCount}</span>
            <span className="text-[11px] text-slate-400">Unanswered</span>
          </div>
        </div>

        {unansweredCount > 0 ? (
          <div className="flex items-start space-x-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              You have <strong>{unansweredCount} questions unanswered</strong>. Once submitted, you cannot re-enter or change your responses.
            </span>
          </div>
        ) : (
          <div className="flex items-start space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs mb-6">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>All {totalQuestions} questions have been answered. You are ready to submit!</span>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            Review Questions
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Yes, Final Submit</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
