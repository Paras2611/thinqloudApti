import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import MathRenderer from '../../components/MathRenderer';
import {
  HelpCircle,
  Plus,
  Upload,
  Search,
  Trash2,
  Edit2,
  Eye,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle
} from 'lucide-react';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation: '',
    topic: 'Percentage',
    section: 'Quantitative',
    difficulty: 'Medium',
    source: 'Thinqloud Campus Bank'
  });

  useEffect(() => {
    fetchQuestions();
  }, [selectedSection, selectedDifficulty]);

  async function fetchQuestions() {
    setLoading(true);
    try {
      const params = {};
      if (selectedSection !== 'ALL') params.section = selectedSection;
      if (selectedDifficulty !== 'ALL') params.difficulty = selectedDifficulty;
      if (search) params.search = search;

      const res = await api.get('/admin/questions', { params });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      alert('Failed to delete question.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/questions', formData);
      setShowAddModal(false);
      setFormData({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        explanation: '',
        topic: 'Percentage',
        section: 'Quantitative',
        difficulty: 'Medium',
        source: 'Thinqloud Campus Bank'
      });
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add question.');
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setImporting(true);
    const data = new FormData();
    data.append('file', csvFile);

    try {
      const res = await api.post('/admin/questions/import', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message || 'Questions imported successfully.');
      setShowImportModal(false);
      setCsvFile(null);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to import CSV.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvRows = [
      'question,option_a,option_b,option_c,option_d,correct,topic,section,difficulty',
      '"What is 15% of 240?","36","32","24","48","A","Percentage","Quantitative","Easy"',
      '"Find next in series: 2, 6, 12, 20, ?","30","28","32","36","A","Series","Logical","Medium"',
      '"Choose the synonym for: BENEVOLENT","Kind","Malicious","Rude","Bitter","A","Synonyms","Verbal","Easy"',
      '"Identify the error: She do not know the answer.","do not","know","the","answer","A","Error Detection","Grammar","Easy"'
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thinqloud_vqar_sample_template.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Question Bank</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage reusable VQAR questions with LaTeX math support and CSV bulk ingestion
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by topic, keyword, or text..."
            className="w-full pl-9 pr-20 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] font-semibold text-white"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {/* Section dropdown */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Sections</option>
            <option value="Quantitative">Quantitative</option>
            <option value="Logical">Logical</option>
            <option value="Verbal">Verbal</option>
            <option value="Grammar">Grammar</option>
          </select>

          {/* Difficulty dropdown */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Questions Match Filter</h3>
          <p className="text-xs text-slate-500 mt-1">Try modifying your filter keywords or add new questions.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Question Text</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {questions.map((q, idx) => (
                  <tr key={q.question_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 max-w-md">
                      <div className="line-clamp-2 text-slate-200">
                        <MathRenderer content={q.question_text} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-indigo-300">{q.section}</td>
                    <td className="px-4 py-3 text-slate-400">{q.topic}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        q.difficulty === 'Easy'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                          : q.difficulty === 'Medium'
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="w-6 h-6 rounded bg-slate-800 text-indigo-400 font-mono font-bold flex items-center justify-center border border-slate-700">
                        {q.correct_option}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Preview Question"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.question_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  {previewQuestion.section}
                </span>
                <span className="text-xs text-slate-400">{previewQuestion.topic}</span>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm sm:text-base mb-6">
              <MathRenderer content={previewQuestion.question_text} />
            </div>

            <div className="space-y-2 mb-6">
              {['A', 'B', 'C', 'D'].map((letter) => {
                const optKey = `option_${letter.toLowerCase()}`;
                const isCorrect = previewQuestion.correct_option === letter;
                return (
                  <div
                    key={letter}
                    className={`p-3 rounded-xl border flex items-center space-x-3 text-xs sm:text-sm ${
                      isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold ${
                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {letter}
                    </span>
                    <div className="flex-1">
                      <MathRenderer content={previewQuestion[optKey]} />
                    </div>
                    {isCorrect && <span className="text-[10px] font-semibold text-emerald-400 uppercase">Correct Key</span>}
                  </div>
                );
              })}
            </div>

            {previewQuestion.explanation && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <strong className="text-indigo-400 block mb-1">Explanation / Solution:</strong>
                <MathRenderer content={previewQuestion.explanation} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Single Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">Add New VQAR Question</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Quantitative">Quantitative</option>
                    <option value="Logical">Logical</option>
                    <option value="Verbal">Verbal</option>
                    <option value="Grammar">Grammar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. Percentage"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Question Text <span className="text-slate-500">(Supports KaTeX LaTeX $math$ and HTML)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="e.g. If $25\%$ of $x$ is equal to $50$, find $x$."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Option A</label>
                  <input
                    type="text"
                    required
                    value={formData.option_a}
                    onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Option B</label>
                  <input
                    type="text"
                    required
                    value={formData.option_b}
                    onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Option C</label>
                  <input
                    type="text"
                    required
                    value={formData.option_c}
                    onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Option D</label>
                  <input
                    type="text"
                    required
                    value={formData.option_d}
                    onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Correct Answer Key</label>
                  <select
                    value={formData.correct_option}
                    onChange={(e) => setFormData({ ...formData, correct_option: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-indigo-400"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Source / Attribution</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Explanation (Post-test solution)</label>
                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Detailed step-by-step reasoning..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <span>Bulk CSV Question Import</span>
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <p className="text-xs text-slate-300">
                Upload a structured CSV containing question body, options, and section tags.
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200">Required CSV Columns:</div>
                <code>question, option_a, option_b, option_c, option_d, correct, topic, section, difficulty</code>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              <div>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || importing}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {importing ? 'Processing CSV...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
