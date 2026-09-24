const { v4: uuidv4 } = require('uuid');
const { parse } = require('csv-parse/sync');
const db = require('../config/db');
const { logEvent } = require('../utils/logger');

// List question bank (filterable)
async function listQuestions(req, res) {
  try {
    const { section, topic, difficulty, search } = req.query;

    let questions = await db.questions.findMany(q => !q.is_deleted);

    if (section && section !== 'ALL') {
      questions = questions.filter(q => q.section?.toLowerCase() === section.toLowerCase());
    }

    if (topic && topic !== 'ALL') {
      questions = questions.filter(q => q.topic?.toLowerCase() === topic.toLowerCase());
    }

    if (difficulty && difficulty !== 'ALL') {
      questions = questions.filter(q => q.difficulty?.toLowerCase() === difficulty.toLowerCase());
    }

    if (search) {
      const qLower = search.toLowerCase();
      questions = questions.filter(q =>
        q.question_text?.toLowerCase().includes(qLower) ||
        q.topic?.toLowerCase().includes(qLower)
      );
    }

    // Sort newest first
    questions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({ questions, total: questions.length });
  } catch (err) {
    console.error('listQuestions error:', err);
    return res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
}

// Get single question by ID
async function getQuestionById(req, res) {
  try {
    const { id } = req.params;
    const question = await db.questions.findById('question_id', id);
    if (!question || question.is_deleted) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    return res.status(200).json({ question });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch question.' });
  }
}

// Add single question
async function createQuestion(req, res) {
  try {
    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      explanation,
      topic,
      section,
      difficulty,
      source
    } = req.body;

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.status(400).json({ error: 'Question text, all 4 options, and correct option are required.' });
    }

    const validOptions = ['A', 'B', 'C', 'D'];
    const normCorrect = correct_option.toUpperCase().trim();
    if (!validOptions.includes(normCorrect)) {
      return res.status(400).json({ error: 'Correct option must be A, B, C, or D.' });
    }

    const newQuestion = {
      question_id: uuidv4(),
      question_text: question_text.trim(),
      option_a: option_a.trim(),
      option_b: option_b.trim(),
      option_c: option_c.trim(),
      option_d: option_d.trim(),
      correct_option: normCorrect,
      explanation: explanation ? explanation.trim() : '',
      topic: topic ? topic.trim() : 'General',
      section: section || 'Quantitative',
      difficulty: difficulty || 'Medium',
      source: source || 'Thinqloud Campus Bank',
      is_deleted: false,
      created_by: req.user.id,
      created_at: new Date().toISOString()
    };

    await db.questions.create(newQuestion);

    await logEvent({
      adminId: req.user.id,
      eventType: 'QUESTION_ADDED',
      questionId: newQuestion.question_id,
      payload: { topic: newQuestion.topic, difficulty: newQuestion.difficulty, section: newQuestion.section },
      req
    });

    return res.status(201).json({ success: true, question: newQuestion });
  } catch (err) {
    console.error('createQuestion error:', err);
    return res.status(500).json({ error: 'Failed to create question.' });
  }
}

// Bulk import CSV
async function importQuestionsCSV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file provided.' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const createdList = [];
    const validSections = ['Quantitative', 'Logical', 'Verbal', 'Grammar'];
    const validDifficulties = ['Easy', 'Medium', 'Hard'];

    for (const row of records) {
      const qText = row.question || row.question_text;
      const optA = row.option_a || row.optionA || row.A;
      const optB = row.option_b || row.optionB || row.B;
      const optC = row.option_c || row.optionC || row.C;
      const optD = row.option_d || row.optionD || row.D;
      let correct = (row.correct || row.correct_option || '').toUpperCase().trim();

      if (!qText || !optA || !optB || !optC || !optD || !['A', 'B', 'C', 'D'].includes(correct)) {
        continue;
      }

      let sec = row.section ? row.section.trim() : 'Quantitative';
      if (!validSections.includes(sec)) {
        sec = 'Quantitative';
      }

      let diff = row.difficulty ? row.difficulty.trim() : 'Medium';
      if (!validDifficulties.includes(diff)) {
        diff = 'Medium';
      }

      const qItem = {
        question_id: uuidv4(),
        question_text: qText,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct_option: correct,
        explanation: row.explanation || '',
        topic: row.topic || 'General',
        section: sec,
        difficulty: diff,
        source: row.source || 'CSV Import',
        is_deleted: false,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      };

      createdList.push(qItem);
    }

    if (createdList.length === 0) {
      return res.status(400).json({ error: 'No valid questions could be parsed from the CSV.' });
    }

    await db.questions.createMany(createdList);

    await logEvent({
      adminId: req.user.id,
      eventType: 'QUESTION_ADDED',
      payload: { count: createdList.length, mode: 'bulk_csv' },
      req
    });

    return res.status(200).json({
      success: true,
      importedCount: createdList.length,
      message: `Successfully imported ${createdList.length} questions.`
    });
  } catch (err) {
    console.error('importQuestionsCSV error:', err);
    return res.status(500).json({ error: 'Failed to process CSV file.' });
  }
}

// Edit question
async function updateQuestion(req, res) {
  try {
    const { id } = req.params;
    const existing = await db.questions.findById('question_id', id);

    if (!existing || existing.is_deleted) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      explanation,
      topic,
      section,
      difficulty,
      source
    } = req.body;

    const updates = {
      ...(question_text !== undefined && { question_text: question_text.trim() }),
      ...(option_a !== undefined && { option_a: option_a.trim() }),
      ...(option_b !== undefined && { option_b: option_b.trim() }),
      ...(option_c !== undefined && { option_c: option_c.trim() }),
      ...(option_d !== undefined && { option_d: option_d.trim() }),
      ...(correct_option !== undefined && { correct_option: correct_option.toUpperCase().trim() }),
      ...(explanation !== undefined && { explanation: explanation.trim() }),
      ...(topic !== undefined && { topic: topic.trim() }),
      ...(section !== undefined && { section }),
      ...(difficulty !== undefined && { difficulty }),
      ...(source !== undefined && { source: source.trim() }),
      updated_at: new Date().toISOString()
    };

    const updated = await db.questions.update({ question_id: id }, updates);

    return res.status(200).json({ success: true, question: updated });
  } catch (err) {
    console.error('updateQuestion error:', err);
    return res.status(500).json({ error: 'Failed to update question.' });
  }
}

// Soft-delete question
async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    const existing = await db.questions.findById('question_id', id);

    if (!existing) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    await db.questions.update({ question_id: id }, { is_deleted: true, deleted_at: new Date().toISOString() });

    return res.status(200).json({ success: true, message: 'Question soft-deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete question.' });
  }
}

module.exports = {
  listQuestions,
  getQuestionById,
  createQuestion,
  importQuestionsCSV,
  updateQuestion,
  deleteQuestion
};
