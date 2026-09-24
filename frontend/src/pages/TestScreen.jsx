import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import MathRenderer from '../components/MathRenderer';
import Timer from '../components/Timer';
import NavigationPalette from '../components/NavigationPalette';
import AntiCheatWarning from '../components/AntiCheatWarning';
import ConfirmSubmitModal from '../components/ConfirmSubmitModal';
import { Bookmark, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Layers, Send, RefreshCw, XCircle, LayoutGrid, X, Sparkles, HelpCircle, Lock } from 'lucide-react';

export default function TestScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question_id]: 'A' | 'B' | 'C' | 'D' }
  const [confirmedAnswers, setConfirmedAnswers] = useState({}); // { [question_id]: boolean }
  const [isConfirming, setIsConfirming] = useState(false);
  const [markedForReview, setMarkedForReview] = useState({}); // { [question_id]: boolean }
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [secondsRemaining, setSecondsRemaining] = useState(75 * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(null);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

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

      // Populate existing answers and confirmation states
      const ansMap = {};
      const markMap = {};
      const confMap = {};
      (res.data.answers || []).forEach(a => {
        if (a.selected_option) ansMap[a.question_id] = a.selected_option;
        if (a.is_marked_for_review) markMap[a.question_id] = true;
        if (a.is_confirmed) confMap[a.question_id] = true;
      });
      setAnswers(ansMap);
      setMarkedForReview(markMap);
      setConfirmedAnswers(confMap);

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
        if (!confirmedAnswers[currentQ.question_id]) {
          const optionMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
          handleOptionSelect(currentQ.question_id, optionMap[e.key]);
        }
      } else if (e.key === 'Enter') {
        if (!confirmedAnswers[currentQ.question_id] && answers[currentQ.question_id]) {
          handleConfirmAnswer(currentQ.question_id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, answers, confirmedAnswers, isConfirming]);

  // Option selection with idempotent auto-save (CI-003)
  const handleOptionSelect = async (questionId, optionLetter) => {
    // If answer already confirmed, lock selection
    if (confirmedAnswers[questionId]) return;

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
        is_marked_for_review: !!markedForReview[questionId],
        is_confirmed: false
      });
    } catch (err) {
      console.error('Failed to auto-save answer:', err);
    }
  };

  // Confirm Answer explicitly to reveal explanation card
  const handleConfirmAnswer = async (questionId) => {
    const selected = answers[questionId];
    if (!selected || isConfirming) return;

    setIsConfirming(true);
    // Optimistically mark as confirmed
    setConfirmedAnswers(prev => ({
      ...prev,
      [questionId]: true
    }));

    try {
      await api.post(`/candidate/sessions/${id}/answer`, {
        question_id: questionId,
        selected_option: selected,
        is_marked_for_review: !!markedForReview[questionId],
        is_confirmed: true
      });
    } catch (err) {
      console.error('Failed to confirm answer:', err);
    } finally {
      setIsConfirming(false);
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
        is_marked_for_review: newMark,
        is_confirmed: !!confirmedAnswers[questionId]
      });
    } catch (err) {
      console.error('Failed to update mark for review:', err);
    }
  };

  // Clear answer selection (only permitted if not confirmed)
  const handleClearResponse = async (questionId) => {
    if (confirmedAnswers[questionId]) return;

    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });

    try {
      await api.post(`/candidate/sessions/${id}/answer`, {
        question_id: questionId,
        selected_option: null,
        is_marked_for_review: !!markedForReview[questionId],
        is_confirmed: false
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
      <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
            TQ
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-white tracking-wide block truncate max-w-[130px] sm:max-w-xs md:max-w-md">
              Thinqloud VQAR Assessment
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              Sec: <strong className="text-indigo-400">{currentQ?.section}</strong> · {currentQ?.topic}
            </span>
          </div>
        </div>

        {/* Live Timer & Submit CTA */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <Timer
            initialSeconds={secondsRemaining}
            onExpire={handleTimerExpire}
          />

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Mobile Quick Palette Switcher Bar (Visible only on < lg) */}
        <div className="lg:hidden flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-white font-mono">Q {currentIndex + 1} / {questions.length}</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400">{answeredCount} ans</span>
            {markedCount > 0 && (
              <>
                <span className="text-slate-500">·</span>
                <span className="text-amber-400">{markedCount} marked</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobilePaletteOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Question Grid</span>
          </button>
        </div>

        {/* Left: Question Card (8 columns on lg) */}
        <div className="lg:col-span-8 flex flex-col justify-between glass-panel rounded-2xl p-4 sm:p-8 border border-slate-800 shadow-xl relative min-h-[460px] sm:min-h-[500px]">
          <div>
            {/* Question Header & Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
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
            <div className="py-5 sm:py-6 text-sm sm:text-base md:text-lg break-words">
              <MathRenderer content={currentQ?.question_text} />
            </div>

            {/* 4 Options (A, B, C, D) */}
            <div className="space-y-2.5 sm:space-y-3 pt-2">
              {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                const optText = currentQ[optKey];
                const isSelected = answers[currentQ.question_id] === letter;
                const isConfirmed = !!confirmedAnswers[currentQ.question_id];
                const isCorrect = currentQ.correct_option === letter;
                const isUserWrong = isConfirmed && isSelected && !isCorrect;

                let cardStyle = '';
                let badgeStyle = '';

                if (isConfirmed) {
                  if (isCorrect) {
                    cardStyle = 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-100 shadow-md shadow-emerald-500/10 cursor-default';
                    badgeStyle = 'bg-emerald-600 text-white border-emerald-500';
                  } else if (isUserWrong) {
                    cardStyle = 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 text-rose-100 shadow-md shadow-rose-500/10 cursor-default';
                    badgeStyle = 'bg-rose-600 text-white border-rose-500';
                  } else {
                    cardStyle = 'bg-slate-900/30 border-slate-800/80 text-slate-500 opacity-60 cursor-not-allowed';
                    badgeStyle = 'bg-slate-800 text-slate-500 border-slate-700';
                  }
                } else {
                  if (isSelected) {
                    cardStyle = 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-md cursor-pointer';
                    badgeStyle = 'bg-indigo-600 text-white border-indigo-500';
                  } else {
                    cardStyle = 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300 cursor-pointer';
                    badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
                  }
                }

                return (
                  <div
                    key={letter}
                    onClick={() => handleOptionSelect(currentQ.question_id, letter)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center space-x-3 sm:space-x-3.5 ${cardStyle}`}
                  >
                    <div className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center border transition-colors flex-shrink-0 ${badgeStyle}`}>
                      {letter}
                    </div>

                    <div className="flex-1 text-xs sm:text-sm md:text-base break-words">
                      <MathRenderer content={optText} />
                    </div>

                    {isConfirmed ? (
                      isCorrect ? (
                        <span className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1 animate-fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct Answer</span>
                        </span>
                      ) : isUserWrong ? (
                        <span className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center space-x-1 animate-fade-in">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Your Choice (Incorrect)</span>
                        </span>
                      ) : null
                    ) : isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 animate-fade-in" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Answer Confirmation Bar (Shown if answer is NOT yet confirmed) */}
            {!confirmedAnswers[currentQ.question_id] && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${answers[currentQ.question_id] ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span>
                    {answers[currentQ.question_id]
                      ? `Option ${answers[currentQ.question_id]} selected. Confirm your answer to verify and view the explanation.`
                      : 'Select an option above, then click Confirm Answer to check the solution.'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {answers[currentQ.question_id] && (
                    <button
                      type="button"
                      onClick={() => handleClearResponse(currentQ.question_id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleConfirmAnswer(currentQ.question_id)}
                    disabled={!answers[currentQ.question_id] || isConfirming}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Answer</span>
                  </button>
                </div>
              </div>
            )}

            {/* Explanation Card (Shown after confirming the answer - even if correct or wrong) */}
            {confirmedAnswers[currentQ.question_id] && (
              <div className={`mt-5 rounded-2xl border p-4 sm:p-6 transition-all animate-fade-in shadow-xl ${
                answers[currentQ.question_id] === currentQ.correct_option
                  ? 'bg-gradient-to-b from-emerald-950/30 via-slate-900/90 to-slate-900 border-emerald-500/40 shadow-emerald-500/5'
                  : 'bg-gradient-to-b from-rose-950/30 via-slate-900/90 to-slate-900 border-rose-500/40 shadow-rose-500/5'
              }`}>
                {/* Status Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    {answers[currentQ.question_id] === currentQ.correct_option ? (
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${
                          answers[currentQ.question_id] === currentQ.correct_option ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {answers[currentQ.question_id] === currentQ.correct_option ? 'Correct Answer!' : 'Incorrect Answer'}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {answers[currentQ.question_id] === currentQ.correct_option ? '+1.0 Mark' : '0.0 Marks'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {answers[currentQ.question_id] === currentQ.correct_option
                          ? `Great job! Your selection of Option ${answers[currentQ.question_id]} is correct.`
                          : `You selected Option ${answers[currentQ.question_id] || 'None'}. The correct answer is Option ${currentQ.correct_option}.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
                      Correct: Option {currentQ.correct_option}
                    </span>
                  </div>
                </div>

                {/* Explanation & Solution Card Body */}
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Explanation & Step-by-Step Solution</span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed break-words">
                    {currentQ.explanation ? (
                      <MathRenderer content={currentQ.explanation} />
                    ) : (
                      <p className="text-slate-400 text-xs italic">
                        The correct answer is Option {currentQ.correct_option}.
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Advance Bar */}
                {currentIndex < questions.length - 1 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-end">
                    <button
                      type="button"
                      onClick={goToNext}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
                    >
                      <span>Proceed to Next Question</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-5 mt-6 border-t border-slate-800 flex items-center justify-between gap-2">
            <div>
              {answers[currentQ.question_id] && !confirmedAnswers[currentQ.question_id] && (
                <button
                  type="button"
                  onClick={() => handleClearResponse(currentQ.question_id)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Response</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="px-3 sm:px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                type="button"
                onClick={goToNext}
                disabled={currentIndex === questions.length - 1}
                className="px-4 sm:px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Navigation Palette (Desktop only, 4 columns on lg) */}
        <div className="hidden lg:block lg:col-span-4 h-full">
          <NavigationPalette
            questions={questions}
            currentIndex={currentIndex}
            onSelectQuestion={handleSelectQuestion}
            answers={answers}
            confirmedAnswers={confirmedAnswers}
            markedForReview={markedForReview}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
          />
        </div>
      </main>

      {/* Mobile Question Palette Modal / Bottom Drawer */}
      {mobilePaletteOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-md max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <NavigationPalette
              questions={questions}
              currentIndex={currentIndex}
              onSelectQuestion={handleSelectQuestion}
              answers={answers}
              confirmedAnswers={confirmedAnswers}
              markedForReview={markedForReview}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
              onClose={() => setMobilePaletteOpen(false)}
            />
          </div>
        </div>
      )}

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
