import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import MathRenderer from '../components/MathRenderer';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Award, CheckCircle, XCircle, HelpCircle, Download, ArrowLeft, BarChart2, ShieldCheck, Sparkles, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export default function TestResult() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState({}); // { [idx]: boolean }
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CORRECT' | 'INCORRECT' | 'SKIPPED'

  useEffect(() => {
    fetchResult();
  }, [id]);

  async function fetchResult() {
    setLoading(true);
    try {
      const res = await api.get(`/candidate/sessions/${id}/result`);
      setData(res.data);

      // Celebrate with confetti if score >= 60%
      const resData = res.data.result;
      if (resData.score !== null && resData.total_questions > 0) {
        const pct = (resData.score / resData.total_questions) * 100;
        if (pct >= 60) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch test result.');
    } finally {
      setLoading(false);
    }
  }

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const result = data.result;
    const session = data.session;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Thinqloud Campus Placement Assessment', 14, 20);
    doc.setFontSize(10);
    doc.text(`Official Score Card · Generated on ${new Date().toLocaleDateString()}`, 14, 28);

    // Session Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(`Test Session: ${session.title}`, 14, 52);
    doc.setFontSize(10);
    doc.text(`Submission Status: ${result.submission_type === 'auto' ? 'Auto-Submitted (Timer Expiry)' : 'Manual Submission'}`, 14, 60);
    doc.text(`Date & Time: ${new Date(result.submitted_at).toLocaleString()}`, 14, 68);

    // Score Table
    const tableData = [
      ['Total Questions', String(result.total_questions)],
      ['Questions Answered', String(result.total_answered)],
      ['Unanswered', String(result.total_unanswered)],
      ['Correct Answers', String(result.total_correct ?? 'N/A')],
      ['Incorrect Answers', String(result.total_incorrect ?? 'N/A')],
      ['Final Score', String(result.score ?? 'Under Review by Invigilator')]
    ];

    doc.autoTable({
      startY: 76,
      head: [['Metric', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 14, right: 14 }
    });

    // Section Breakdown Table
    if (result.section_scores) {
      const sectionRows = Object.entries(result.section_scores).map(([sec, stats]) => [
        sec,
        String(stats.total),
        String(stats.correct),
        String(stats.incorrect),
        stats.total > 0 ? `${Math.round((stats.correct / stats.total) * 100)}%` : '0%'
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 12,
        head: [['Section', 'Questions', 'Correct', 'Incorrect', 'Accuracy']],
        body: sectionRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        margin: { left: 14, right: 14 }
      });
    }

    doc.save(`thinqloud_test_result_${id.slice(0, 8)}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const result = data?.result;
  const session = data?.session;
  const showResult = result?.show_result;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          {/* Header */}
          <div className="text-center pb-8 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Assessment Submitted Successfully
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Your test session responses have been securely encrypted and stored with immutable proctor timestamps.
            </p>
          </div>

          {/* Score Card Banner */}
          {showResult ? (
            <div className="my-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 text-center relative overflow-hidden">
              <div className="text-xs text-indigo-300 font-semibold tracking-wider uppercase mb-1">
                Total Assessment Score
              </div>
              <div className="text-5xl font-black text-white font-mono tracking-tight">
                {result.score} <span className="text-2xl font-normal text-slate-400">/ {result.total_questions}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Accuracy: {result.total_questions > 0 ? Math.round((result.total_correct / result.total_questions) * 100) : 0}%
              </p>
            </div>
          ) : (
            <div className="my-8 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <ShieldCheck className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-white">Results are Moderated</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Detailed scores for this session will be released by the placement cell once all candidate submissions are finalized.
              </p>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Total Questions</span>
              <span className="text-xl font-bold text-white font-mono">{result?.total_questions}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Answered</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{result?.total_answered}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Correct</span>
              <span className="text-xl font-bold text-indigo-400 font-mono">
                {showResult ? result?.total_correct : '—'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Unanswered</span>
              <span className="text-xl font-bold text-slate-400 font-mono">{result?.total_unanswered}</span>
            </div>
          </div>

          {/* Section Breakdown if enabled */}
          {showResult && result.section_scores && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>Section-Wise Performance</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(result.section_scores).map(([sec, stats]) => {
                  const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                  return (
                    <div key={sec} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-200">{sec}</span>
                        <span className="text-xs font-mono text-indigo-400 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>{stats.correct} correct</span>
                        <span>{stats.incorrect} wrong</span>
                        <span>{stats.total} total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question-Wise Solutions & Explanation Cards */}
          {showResult && data?.questions && data.questions.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Questions & Detailed Explanations</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review each question, your chosen option, the verified answer, and step-by-step solutions.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { key: 'ALL', label: 'All' },
                    { key: 'CORRECT', label: 'Correct' },
                    { key: 'INCORRECT', label: 'Incorrect' },
                    { key: 'SKIPPED', label: 'Unanswered' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFilterType(tab.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        filterType === tab.key
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {data.questions
                  .filter(q => {
                    if (filterType === 'CORRECT') return q.is_correct;
                    if (filterType === 'INCORRECT') return !q.is_correct && q.selected_option;
                    if (filterType === 'SKIPPED') return !q.selected_option;
                    return true;
                  })
                  .map(q => {
                    const isExpanded = expandedQuestions[q.question_id] !== false; // default expanded
                    const isAnswered = !!q.selected_option;
                    const isCorrect = q.is_correct;

                    return (
                      <div
                        key={q.question_id}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isCorrect
                            ? 'bg-slate-900/60 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                            : isAnswered
                            ? 'bg-slate-900/60 border-rose-500/30 shadow-md shadow-rose-500/5'
                            : 'bg-slate-900/40 border-slate-800'
                        }`}
                      >
                        {/* Question Bar Header */}
                        <div
                          onClick={() => setExpandedQuestions(prev => ({ ...prev, [q.question_id]: !isExpanded }))}
                          className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-slate-800 font-mono text-xs font-bold text-slate-300 flex items-center justify-center flex-shrink-0">
                              Q{q.index}
                            </span>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-400">
                                  {q.section} · {q.topic}
                                </span>
                                <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                                  q.difficulty === 'Easy'
                                    ? 'text-emerald-400 bg-emerald-950/40'
                                    : q.difficulty === 'Medium'
                                    ? 'text-amber-400 bg-amber-950/40'
                                    : 'text-rose-400 bg-rose-950/40'
                                }`}>
                                  {q.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 flex-shrink-0">
                            {isCorrect ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Correct (+1)</span>
                              </span>
                            ) : isAnswered ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Incorrect (0)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Unanswered
                              </span>
                            )}

                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Content: Question Body + Options + Explanation Card */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                            {/* Question text */}
                            <div className="text-sm sm:text-base text-slate-200">
                              <MathRenderer content={q.question_text} />
                            </div>

                            {/* Options grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                              {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey, idx) => {
                                const letter = ['A', 'B', 'C', 'D'][idx];
                                const optVal = q[optKey];
                                const isUserSelected = q.selected_option === letter;
                                const isCorrectOpt = q.correct_option === letter;

                                let optClass = 'bg-slate-900/60 border-slate-800 text-slate-300';
                                if (isCorrectOpt) {
                                  optClass = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-medium';
                                } else if (isUserSelected && !isCorrectOpt) {
                                  optClass = 'bg-rose-950/40 border-rose-500 text-rose-200 font-medium';
                                }

                                return (
                                  <div
                                    key={letter}
                                    className={`p-3 rounded-xl border flex items-center space-x-2.5 text-xs sm:text-sm ${optClass}`}
                                  >
                                    <span className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                                      isCorrectOpt
                                        ? 'bg-emerald-600 text-white'
                                        : isUserSelected
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {letter}
                                    </span>
                                    <div className="flex-1 break-words">
                                      <MathRenderer content={optVal} />
                                    </div>
                                    {isCorrectOpt && (
                                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Correct</span>
                                    )}
                                    {isUserSelected && !isCorrectOpt && (
                                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Your Answer</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Dedicated Explanation Card */}
                            <div className="rounded-xl p-4 bg-slate-900/90 border border-indigo-500/30 shadow-lg space-y-2 mt-3">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Step-by-Step Explanation & Solution</span>
                                </div>
                                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                                  Correct: Option {q.correct_option}
                                </span>
                              </div>

                              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1 break-words">
                                {q.explanation ? (
                                  <MathRenderer content={q.explanation} />
                                ) : (
                                  <p className="text-slate-400 text-xs italic">
                                    The correct option is {q.correct_option}.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
            <Link
              to="/candidate/dashboard"
              className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Assessments Dashboard</span>
            </Link>

            {showResult && (
              <button
                type="button"
                onClick={exportPDF}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Score PDF</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
