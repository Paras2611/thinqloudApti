import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import MathRenderer from '../components/MathRenderer';
import Timer from '../components/Timer';
import NavigationPalette from '../components/NavigationPalette';
import AntiCheatWarning from '../components/AntiCheatWarning';
import ConfirmSubmitModal from '../components/ConfirmSubmitModal';
import { Bookmark, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Layers, Send, RefreshCw, XCircle } from 'lucide-react';

export default function TestScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question_id]: 'A' | 'B' | 'C' | 'D' }
  const [markedForReview, setMarkedForReview] = useState({}); // { [question_id]: boolean }
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [secondsRemaining, setSecondsRemaining] = useState(75 * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(null);

  // Tab switch anti-cheat states
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Load questions and existing answers
  useEffect(() => {
    fetchTestState();
  }, [id]);

  async function fetchTestState() {
    setLoading(true);
    try {
      const res = await api.get(`/candidate/sessions/${id}/questions`);
      const qList = res.data.questions || [];
      setQuestions(qList);

      // Populate existing answers
      const ansMap = {};
      const markMap = {};
      (res.data.answers || []).forEach(a => {
        if (a.selected_option) ansMap[a.question_id] = a.selected_option;
        if (a.is_marked_for_review) markMap[a.question_id] = true;
      });
      setAnswers(ansMap);
      setMarkedForReview(markMap);

      // Calculate remaining time
      const startTime = new Date(res.data.attempt.start_time).getTime();
      const durationSeconds = (res.data.attempt.duration_minutes || 75) * 60;
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsedSeconds);
      setSecondsRemaining(remaining);
      setTabSwitches(res.data.attempt.tab_switches || 0);

      // Log question view for initial question
      if (qList.length > 0) {
        logQuestionView(qList[0].question_id);
      }
    } catch (err) {
      if (err.response?.data?.already_submitted) {
        navigate(`/candidate/sessions/${id}/result`);
      } else {
        alert(err.response?.data?.error || 'Failed to load test.');
        navigate('/candidate/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  // Log question view
  const logQuestionView = async (questionId) => {
    try {
      await api.post(`/candidate/sessions/${id}/event`, {
        event_type: 'QUESTION_VIEW',
        question_id: questionId,
        payload: { timestamp: new Date().toISOString() }
      });
    } catch (err) {
      // Non-blocking
    }
  };

  // Anti-cheat tab-switch detection (CI-007)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          const res = await api.post(`/candidate/sessions/${id}/event`, {
            event_type: 'TAB_SWITCH',
            payload: { timestamp: new Date().toISOString() }
          });
          const newCount = res.data?.switch_count || (tabSwitches + 1);
          setTabSwitches(newCount);
          setShowWarningModal(true);
        } catch (e) {
          setTabSwitches(prev => prev + 1);
          setShowWarningModal(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [id, tabSwitches]);

  // Keyboard navigation (CI-009: 1-4 for options, arrows for navigation)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const optionMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        handleOptionSelect(currentQ.question_id, optionMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, answers]);

  // Option selection with idempotent auto-save (CI-003)
  const handleOptionSelect = async (questionId, optionLetter) => {
    const isSameOption = answers[questionId] === optionLetter;
    const newSelected = isSameOption ? null : optionLetter; // Toggle selection

    // Optimistic UI update
    setAnswers(prev => ({
      ...prev,
      [questionId]: newSelected
    }));

    try {
      await api.post(`/candidate/sessions/${id}/answer`, {
        question_id: questionId,
        selected_option: newSelected,
        is_marked_for_review: !!markedForReview[questionId]
      });
    } catch (err) {
      console.error('Failed to auto-save answer:', err);
    }
  };

  // Toggle mark for review
  const handleToggleMark = async (questionId) => {
    const currentMark = !!markedForReview[questionId];
    const newMark = !currentMark;

    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: newMark
    }));

    try {
      await api.post(`/candidate/sessions/${id}/answer`, {
        question_id: questionId,
        selected_option: answers[questionId] || null,
        is_marked_for_review: newMark
      });
    } catch (err) {
      console.error('Failed to update mark for review:', err);
    }
  };

  // Clear answer selection
  const handleClearResponse = async (questionId) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });

    try {
      await api.post(`/candidate/sessions/${id}/answer`, {
        question_id: questionId,
        selected_option: null,
        is_marked_for_review: !!markedForReview[questionId]
      });
    } catch (err) {
      console.error('Failed to clear answer:', err);
    }
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      logQuestionView(questions[nextIdx].question_id);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      logQuestionView(questions[prevIdx].question_id);
    }
  };

  const handleSelectQuestion = (idx) => {
    setCurrentIndex(idx);
    logQuestionView(questions[idx].question_id);
  };

  // Final submit (manual or auto-submit on timer expiry)
  const handleSubmitTest = async (submissionType = 'manual') => {
    setSubmitting(true);
    try {
      const res = await api.post(`/candidate/sessions/${id}/submit`, {
        submission_type: submissionType
      });
      navigate(`/candidate/sessions/${id}/result`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit assessment.');
      setSubmitting(false);
    }
  };

  // Auto-submit within 5s of timer reaching 0:00 (CI-004)
  const handleTimerExpire = useCallback(() => {
    setAutoSubmitCountdown(5);
    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setAutoSubmitCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        handleSubmitTest('auto');
      }
    }, 1000);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(val => val !== null && val !== undefined).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col select-none">
      {/* Top Test Header Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            TQ
          </div>
          <div>
            <span className="text-xs font-semibold text-white tracking-wide block truncate max-w-[200px] sm:max-w-md">
              Campus Assessment · Thinqloud VQAR
            </span>
            <span className="text-[10px] text-slate-400">
              Section: <strong className="text-indigo-400">{currentQ?.section}</strong> · Topic: {currentQ?.topic}
            </span>
          </div>
        </div>

        {/* Live Timer & Submit CTA */}
        <div className="flex items-center space-x-3">
          <Timer
            initialSeconds={secondsRemaining}
            onExpire={handleTimerExpire}
          />

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Test</span>
          </button>
        </div>
      </header>

      {/* Auto-Submit Countdown Overlay Banner if time expired */}
      {autoSubmitCountdown !== null && (
        <div className="bg-rose-600 text-white text-center py-2 px-4 text-xs font-bold animate-pulse flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Timer Expired! Auto-submitting all answers in {autoSubmitCountdown} seconds...</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Question Card (8 columns on lg) */}
        <div className="lg:col-span-8 flex flex-col justify-between glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative min-h-[500px]">
          <div>
            {/* Question Header & Chips */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
                  Q {currentIndex + 1} of {questions.length}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium">
                  {currentQ?.section}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  currentQ?.difficulty === 'Easy'
                    ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20'
                    : currentQ?.difficulty === 'Medium'
                    ? 'text-amber-400 bg-amber-950/40 border border-amber-500/20'
                    : 'text-rose-400 bg-rose-950/40 border border-rose-500/20'
                }`}>
                  {currentQ?.difficulty}
                </span>
              </div>

              {/* Mark for review toggle */}
              <button
                type="button"
                onClick={() => handleToggleMark(currentQ.question_id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 border ${
                  markedForReview[currentQ.question_id]
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${markedForReview[currentQ.question_id] ? 'fill-current' : ''}`} />
                <span>{markedForReview[currentQ.question_id] ? 'Marked' : 'Mark for Review'}</span>
              </button>
            </div>

            {/* Question Body with KaTeX rendering */}
            <div className="py-6 text-base sm:text-lg">
              <MathRenderer content={currentQ?.question_text} />
            </div>

            {/* 4 Options (A, B, C, D) */}
            <div className="space-y-3 pt-2">
              {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                const optText = currentQ[optKey];
                const isSelected = answers[currentQ.question_id] === letter;

                return (
                  <div
                    key={letter}
                    onClick={() => handleOptionSelect(currentQ.question_id, letter)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center space-x-3.5 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {letter}
                    </div>

                    <div className="flex-1 text-sm sm:text-base">
                      <MathRenderer content={optText} />
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 animate-fade-in" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {answers[currentQ.question_id] && (
                <button
                  type="button"
                  onClick={() => handleClearResponse(currentQ.question_id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Clear Response</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={goToNext}
                disabled={currentIndex === questions.length - 1}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Navigation Palette (4 columns on lg) */}
        <div className="lg:col-span-4 h-full">
          <NavigationPalette
            questions={questions}
            currentIndex={currentIndex}
            onSelectQuestion={handleSelectQuestion}
            answers={answers}
            markedForReview={markedForReview}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
          />
        </div>
      </main>

      {/* Confirm Submit Modal */}
      <ConfirmSubmitModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => handleSubmitTest('manual')}
        isSubmitting={submitting}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        markedCount={markedCount}
      />

      {/* Anti-cheat tab switch warning modal */}
      <AntiCheatWarning
        isOpen={showWarningModal}
        switchCount={tabSwitches}
        onClose={() => setShowWarningModal(false)}
      />
    </div>
  );
}
