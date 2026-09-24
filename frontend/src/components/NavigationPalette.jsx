import React from 'react';
import { Bookmark, CheckCircle2, Circle, Eye, X } from 'lucide-react';

export default function NavigationPalette({
  questions,
  currentIndex,
  onSelectQuestion,
  answers = {},
  confirmedAnswers = {},
  markedForReview = {},
  selectedSection,
  onSelectSection,
  onClose
}) {
  const sections = ['ALL', 'Quantitative', 'Logical', 'Verbal', 'Grammar'];

  const answeredCount = Object.values(answers).filter(val => val !== null && val !== undefined).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const confirmedCount = Object.values(confirmedAnswers).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  // Filter questions if section selected
  const filteredQuestions = selectedSection && selectedSection !== 'ALL'
    ? questions.map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => q.section === selectedSection)
    : questions.map((q, idx) => ({ ...q, originalIndex: idx }));

  const handleSelect = (idx) => {
    onSelectQuestion(idx);
    if (onClose) onClose();
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      {/* Header and Summary Chips */}
      <div className="pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center space-x-2">
            <span>Question Palette</span>
            <span className="text-xs font-mono text-slate-400 font-normal">({questions.length} Qs)</span>
          </h3>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close question palette"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Legend / Status counts */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] font-medium">
          <div className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Answered: {answeredCount}</span>
          </div>

          <div className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span>Marked: {markedCount}</span>
          </div>

          <div className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span>Left: {unansweredCount}</span>
          </div>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="py-2.5 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
        {sections.map(sec => (
          <button
            key={sec}
            onClick={() => onSelectSection(sec)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
              selectedSection === sec
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {sec === 'Quantitative' ? 'Quant' : sec}
          </button>
        ))}
      </div>

      {/* Question Grid */}
      <div className="flex-1 overflow-y-auto pr-1 py-2">
        <div className="grid grid-cols-5 gap-2">
          {filteredQuestions.map((q) => {
            const origIdx = q.originalIndex;
            const isCurrent = origIdx === currentIndex;
            const userAns = answers[q.question_id];
            const isAnswered = userAns !== undefined && userAns !== null;
            const isMarked = !!markedForReview[q.question_id];
            const isConfirmed = !!confirmedAnswers[q.question_id];
            const isCorrect = isConfirmed && userAns === q.correct_option;
            const isWrong = isConfirmed && userAns !== q.correct_option;

            let buttonStyles = 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:border-slate-500';

            if (isConfirmed) {
              if (isCorrect) {
                buttonStyles = 'bg-emerald-500/25 text-emerald-300 border-emerald-500/70 shadow-sm shadow-emerald-500/20 font-bold';
              } else {
                buttonStyles = 'bg-rose-500/25 text-rose-300 border-rose-500/70 shadow-sm shadow-rose-500/20 font-bold';
              }
            } else if (isMarked) {
              // Marked for Review (orange/amber)
              buttonStyles = 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/20';
            } else if (isAnswered) {
              // Answered (green/emerald)
              buttonStyles = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-sm shadow-indigo-500/20 font-semibold';
            }

            if (isCurrent) {
              buttonStyles += ' ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-105';
            }

            return (
              <button
                key={q.question_id}
                onClick={() => handleSelect(origIdx)}
                className={`relative h-10 rounded-xl border text-xs font-mono transition-all flex items-center justify-center ${buttonStyles}`}
              >
                <span>{origIdx + 1}</span>
                {isConfirmed ? (
                  <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isCorrect ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-400 shadow-sm shadow-rose-400'}`} />
                ) : isMarked ? (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
