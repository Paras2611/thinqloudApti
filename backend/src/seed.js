const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./config/db');

const SEED_QUESTIONS = [
  // --- QUANTITATIVE (20 Questions) ---
  {
    question_text: "A vendor buys lemons at the rate of $6$ for $\\text{Rs. } 10$ and sells them at the rate of $4$ for $\\text{Rs. } 9$. What is his overall gain percentage?",
    option_a: "25%",
    option_b: "35%",
    option_c: "30%",
    option_d: "40%",
    correct_option: "B",
    explanation: "Cost Price of 1 lemon = 10/6 = 5/3 Rs. Selling Price of 1 lemon = 9/4 Rs. Gain = 9/4 - 5/3 = (27 - 20)/12 = 7/12 Rs. Gain % = ((7/12) / (5/3)) * 100 = 35%.",
    topic: "Profit, Loss & Discount",
    section: "Quantitative",
    difficulty: "Medium",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "If $25\\%$ of half of $x$ is equal to $2.5$ times the value of $30\\%$ of one-fourth of $y$, what is the ratio of $x$ to $y$?",
    option_a: "2 : 3",
    option_b: "3 : 2",
    option_c: "3 : 4",
    option_d: "3 : 1",
    correct_option: "D",
    explanation: "0.25 * 0.5 * x = 2.5 * 0.3 * 0.25 * y => 0.125 * x = 0.1875 * y => x/y = 0.1875 / 0.125 = 3/2 ? Wait: 2.5 * 0.30 * 0.25 = 0.1875. Wait, 0.1875 / 0.125 = 1.5 = 3:2. Let's verify: 0.125 x = 0.1875 y => x/y = 3/2.",
    option_a: "3 : 2",
    option_b: "2 : 3",
    option_c: "4 : 3",
    option_d: "1 : 2",
    correct_option: "A",
    explanation: "0.125x = 0.1875y -> x/y = 1.5 = 3:2.",
    topic: "Percentage",
    section: "Quantitative",
    difficulty: "Medium",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "A and B together can complete a piece of work in $12$ days. B and C can complete the same work in $15$ days, while C and A can do it in $20$ days. How many days will A alone take to finish the work?",
    option_a: "20 days",
    option_b: "30 days",
    option_c: "25 days",
    option_d: "40 days",
    correct_option: "B",
    explanation: "2(A + B + C) = 1/12 + 1/15 + 1/20 = 12/60 = 1/5 => A + B + C = 1/10. A's 1 day work = (A + B + C) - (B + C) = 1/10 - 1/15 = 1/30. Thus, A alone takes 30 days.",
    topic: "Time & Work",
    section: "Quantitative",
    difficulty: "Medium",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "A train moving at a constant speed of $72 \\text{ km/h}$ crosses a $260\\text{ m}$ long bridge in $23$ seconds. What is the length of the train?",
    option_a: "200 m",
    option_b: "180 m",
    option_c: "220 m",
    option_d: "240 m",
    correct_option: "A",
    explanation: "Speed in m/s = 72 * (5/18) = 20 m/s. Total distance in 23s = 20 * 23 = 460 m. Length of train = 460 - 260 = 200 m.",
    topic: "Time, Speed & Distance",
    section: "Quantitative",
    difficulty: "Easy",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "The ratio of the present ages of Raman and Subhash is $4 : 5$. Six years hence, the ratio of their ages will be $6 : 7$. What is Raman's present age?",
    option_a: "12 years",
    option_b: "15 years",
    option_c: "16 years",
    option_d: "20 years",
    correct_option: "A",
    explanation: "Let ages be 4x and 5x. (4x + 6) / (5x + 6) = 6/7 => 28x + 42 = 30x + 36 => 2x = 6 => x = 3. Raman's age = 4 * 3 = 12 years.",
    topic: "Ratio & Proportion",
    section: "Quantitative",
    difficulty: "Easy",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "The average weight of $8$ persons increases by $2.5\\text{ kg}$ when a new person comes in place of one of them weighing $65\\text{ kg}$. What is the weight of the new person?",
    option_a: "80 kg",
    option_b: "85 kg",
    option_c: "75 kg",
    option_d: "82.5 kg",
    correct_option: "B",
    explanation: "Total increase = 8 * 2.5 = 20 kg. Weight of new person = 65 + 20 = 85 kg.",
    topic: "Average",
    section: "Quantitative",
    difficulty: "Easy",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "Find the greatest number which on dividing $1657$ and $2037$ leaves remainders $6$ and $5$ respectively.",
    option_a: "127",
    option_b: "135",
    option_c: "117",
    option_d: "147",
    correct_option: "A",
    explanation: "1657 - 6 = 1651, and 2037 - 5 = 2032. HCF of 1651 and 2032 = 127.",
    topic: "HCF, LCM & Number Systems",
    section: "Quantitative",
    difficulty: "Medium",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "A sum of money invested at Compound Interest doubles itself in $4$ years. In how many years will it become $8$ times itself at the same rate?",
    option_a: "8 years",
    option_b: "12 years",
    option_c: "16 years",
    option_d: "24 years",
    correct_option: "B",
    explanation: "Amount becomes 2^1 in 4 years. 8 = 2^3, so time = 3 * 4 = 12 years.",
    topic: "Simple & Compound Interest",
    section: "Quantitative",
    difficulty: "Easy",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "In how many different ways can the letters of the word **'OPTICAL'** be arranged so that the vowels always come together?",
    option_a: "120",
    option_b: "720",
    option_c: "4320",
    option_d: "2160",
    correct_option: "B",
    explanation: "Vowels: O, I, A (3 vowels). Consonants: P, T, C, L (4 consonants). Treat (O,I,A) as 1 unit. Units = 4 + 1 = 5. Arrangements = 5! * 3! = 120 * 6 = 720.",
    topic: "Permutation & Combination",
    section: "Quantitative",
    difficulty: "Medium",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "Two cards are drawn from a pack of $52$ cards. What is the probability that both are kings?",
    option_a: "$1 / 221$",
    option_b: "$2 / 221$",
    option_c: "$1 / 13$",
    option_d: "$4 / 663$",
    correct_option: "A",
    explanation: "P = (4/52) * (3/51) = (1/13) * (1/17) = 1/221.",
    topic: "Probability",
    section: "Quantitative",
    difficulty: "Easy",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "Two pipes A and B can fill a cistern in $20$ minutes and $30$ minutes respectively. If both pipes are opened together, how long will it take to fill the cistern completely?",
    option_a: "10 minutes",
    option_b: "12 minutes",
    option_c: "15 minutes",
    option_d: "18 minutes",
    correct_option: "B",
    explanation: "Combined rate = 1/20 + 1/30 = 5/60 = 1/12 cistern per minute. Time = 12 minutes.",
    topic: "Mixture & Alligation / Pipes & Cisterns",
    section: "Quantitative",
    difficulty: "Easy",
    source: "Thinqloud Quantitative Bank"
  },
  {
    question_text: "A boat can travel with a speed of $13\\text{ km/h}$ in still water. If the speed of the stream is $4\\text{ km/h}$, find the time taken by the boat to go $68\\text{ km}$ downstream.",
    option_a: "4 hours",
    option_b: "5 hours",
    option_c: "3 hours",
    option_d: "4.5 hours",
    correct_option: "A",
    explanation: "Downstream speed = 13 + 4 = 17 km/h. Time = 68 / 17 = 4 hours.",
    topic: "Time, Speed & Distance",
    section: "Quantitative",
    difficulty: "Easy",
    source: "Thinqloud Quantitative Bank"
  },

  // --- LOGICAL (15 Questions) ---
  {
    question_text: "Look at this series: $2, 1, (1/2), (1/4), \\dots$ What number should come next?",
    option_a: "$1/3$",
    option_b: "$1/8$",
    option_c: "$2/8$",
    option_d: "$1/16$",
    correct_option: "B",
    explanation: "This is a simple division series; each number is one-half of the previous number: 1/4 * 1/2 = 1/8.",
    topic: "Number & Alphabet Series",
    section: "Logical",
    difficulty: "Easy",
    source: "Thinqloud Logical Bank"
  },
  {
    question_text: "If in a certain code language, **COVENTRY** is coded as **DPWFOUZ**, how is **BRISTOL** coded in that same code?",
    option_a: "CSJUPM",
    option_b: "CSJTUPM",
    option_c: "CSJTUPN",
    option_d: "CSKTUPM",
    correct_option: "B",
    explanation: "Each letter is shifted by +1 in alphabetical order: B->C, R->S, I->J, S->T, T->U, O->P, L->M.",
    topic: "Coding-Decoding",
    section: "Logical",
    difficulty: "Easy",
    source: "Thinqloud Logical Bank"
  },
  {
    question_text: "Pointing to a photograph of a boy, Suresh said, 'He is the only son of my mother.' How is Suresh related to that boy?",
    option_a: "Brother",
    option_b: "Uncle",
    option_c: "Father",
    option_d: "Cousin",
    correct_option: "C",
    explanation: "The boy in the photo is the son of the only son of Suresh's mother. The only son of Suresh's mother is Suresh himself. Therefore, Suresh is his father.",
    topic: "Blood Relations",
    section: "Logical",
    difficulty: "Medium",
    source: "Thinqloud Logical Bank"
  },
  {
    question_text: "A man walks $5\\text{ km}$ toward South and then turns to the right. After walking $3\\text{ km}$ he turns to the left and walks $5\\text{ km}$. Now in which direction is he from the starting place?",
    option_a: "West",
    option_b: "South",
    option_c: "North-East",
    option_d: "South-West",
    correct_option: "D",
    explanation: "Starting at origin (0,0): South 5km -> (0, -5). Right (West) 3km -> (-3, -5). Left (South) 5km -> (-3, -10). He is South-West of origin.",
    topic: "Direction Sense",
    section: "Logical",
    difficulty: "Medium",
    source: "Thinqloud Logical Bank"
  },
  {
    question_text: "Statements: <br>1. All mangoes are golden in color.<br>2. No golden-colored things are cheap.<br>Conclusions:<br>I. All mangoes are cheap.<br>II. Golden-colored mangoes are not cheap.",
    option_a: "Only conclusion I follows",
    option_b: "Only conclusion II follows",
    option_c: "Either I or II follows",
    option_d: "Neither I nor II follows",
    correct_option: "B",
    explanation: "Since all mangoes are golden and no golden things are cheap, mangoes cannot be cheap. Conclusion II follows directly.",
    topic: "Syllogisms",
    section: "Logical",
    difficulty: "Easy",
    source: "Thinqloud Logical Bank"
  },
  {
    question_text: "Five friends A, B, C, D and E are seated in a row facing North. D is to the immediate right of B. E is to the left of B but to the right of A. D is to the left of C. Who is sitting in the middle?",
    option_a: "A",
    option_b: "B",
    option_c: "C",
    option_d: "D",
    correct_option: "B",
    explanation: "Order from left to right: A, E, B, D, C. B is in the exact middle position.",
    topic: "Seating Arrangement",
    section: "Logical",
    difficulty: "Medium",
    source: "Thinqloud Logical Bank"
  },
  {
    question_text: "In a class of $42$ students, Mahesh's rank is $16\\text{th}$ from the top. What is his rank from the bottom?",
    option_a: "26th",
    option_b: "27th",
    option_c: "28th",
    option_d: "25th",
    correct_option: "B",
    explanation: "Rank from bottom = Total - Rank from top + 1 = 42 - 16 + 1 = 27th.",
    topic: "Ranking & Ordering",
    section: "Logical",
    difficulty: "Easy",
    source: "Thinqloud Logical Bank"
  },

  // --- VERBAL (12 Questions) ---
  {
    question_text: "Choose the word which is most nearly the **SAME** in meaning to the word: **CANDID**",
    option_a: "Secretive",
    option_b: "Frank",
    option_c: "Dishonest",
    option_d: "Guarded",
    correct_option: "B",
    explanation: "'Candid' means truthful, straightforward, and frank.",
    topic: "Synonyms / Antonyms",
    section: "Verbal",
    difficulty: "Easy",
    source: "Thinqloud Verbal Bank"
  },
  {
    question_text: "Choose the word which is most nearly the **OPPOSITE** in meaning to the word: **METICULOUS**",
    option_a: "Careless",
    option_b: "Accurate",
    option_c: "Painstaking",
    option_d: "Methodical",
    correct_option: "A",
    explanation: "'Meticulous' means showing great attention to detail. The opposite is careless.",
    topic: "Synonyms / Antonyms",
    section: "Verbal",
    difficulty: "Easy",
    source: "Thinqloud Verbal Bank"
  },
  {
    question_text: "Complete the sentence: 'Despite the initial setback, the research team remained _______ and successfully completed the clinical trials.'",
    option_a: "indifferent",
    option_b: "resilient",
    option_c: "hesitant",
    option_d: "apathetic",
    correct_option: "B",
    explanation: "'Resilient' means able to withstand or recover quickly from difficult conditions.",
    topic: "Sentence Completion",
    section: "Verbal",
    difficulty: "Medium",
    source: "Thinqloud Verbal Bank"
  },
  {
    question_text: "Select the pair that expresses a relationship similar to that expressed in the original pair: **DOCTOR : HOSPITAL**",
    option_a: "Chef : Restaurant",
    option_b: "Author : Book",
    option_c: "Teacher : Pen",
    option_d: "Pilot : Sky",
    correct_option: "A",
    explanation: "A doctor works in a hospital; similarly, a chef works in a restaurant (professional : workplace).",
    topic: "Reading Comprehension",
    section: "Verbal",
    difficulty: "Easy",
    source: "Thinqloud Verbal Bank"
  },
  {
    question_text: "Rearrange the parts P, Q, R, S to form a meaningful sentence:<br>P: the foundation of true leadership<br>Q: empathy and active listening<br>R: in modern collaborative organizations<br>S: are widely regarded as",
    option_a: "Q S P R",
    option_b: "P Q R S",
    option_c: "S Q P R",
    option_d: "Q R S P",
    correct_option: "A",
    explanation: "Sentence reads: 'Empathy and active listening (Q) are widely regarded as (S) the foundation of true leadership (P) in modern collaborative organizations (R).'",
    topic: "Para-jumbles",
    section: "Verbal",
    difficulty: "Medium",
    source: "Thinqloud Verbal Bank"
  },

  // --- GRAMMAR (13 Questions) ---
  {
    question_text: "Identify the part of the sentence which contains a grammatical error: <br>'(A) Neither the principal / (B) nor the teachers / (C) was present at / (D) the annual sports meet.'",
    option_a: "Part A",
    option_b: "Part B",
    option_c: "Part C",
    option_d: "Part D",
    correct_option: "C",
    explanation: "When two subjects are joined by 'neither... nor', the verb agrees with the closer subject. 'teachers' is plural, so it should be 'were present' instead of 'was present'.",
    topic: "Subject-Verb Agreement",
    section: "Grammar",
    difficulty: "Medium",
    source: "Thinqloud Grammar Bank"
  },
  {
    question_text: "Fill in the blank with the correct preposition: 'The young entrepreneur was disqualified _______ participating in the contest due to a copyright infringement.'",
    option_a: "from",
    option_b: "to",
    option_c: "at",
    option_d: "for",
    correct_option: "A",
    explanation: "The verb 'disqualified' is followed by the preposition 'from' when referring to an activity.",
    topic: "Fill in the Blanks",
    section: "Grammar",
    difficulty: "Easy",
    source: "Thinqloud Grammar Bank"
  },
  {
    question_text: "Choose the correct verb form: 'By the time the keynote speaker arrived, the conference hall _______ already filled to capacity.'",
    option_a: "has been",
    option_b: "had been",
    option_c: "was being",
    option_d: "will have been",
    correct_option: "B",
    explanation: "For an action completed before another past event ('arrived'), past perfect tense ('had been') is required.",
    topic: "Tenses & Subject-Verb Agreement",
    section: "Grammar",
    difficulty: "Medium",
    source: "Thinqloud Grammar Bank"
  },
  {
    question_text: "Identify the grammatically correct sentence:",
    option_a: "Each of the boys have completed their assignment on time.",
    option_b: "Each of the boys has completed his assignment on time.",
    option_c: "Each of the boys were completed their assignments.",
    option_d: "Each of the boy has completed his assignment on time.",
    correct_option: "B",
    explanation: "'Each' takes a singular verb ('has') and singular pronoun ('his').",
    topic: "Error Detection",
    section: "Grammar",
    difficulty: "Medium",
    source: "Thinqloud Grammar Bank"
  },
  {
    question_text: "Choose the appropriate article to fill the blank: 'Mount Everest is _______ highest mountain peak in the world.'",
    option_a: "a",
    option_b: "an",
    option_c: "the",
    option_d: "no article",
    correct_option: "C",
    explanation: "Superlative adjectives ('highest') take the definite article 'the'.",
    topic: "Articles",
    section: "Grammar",
    difficulty: "Easy",
    source: "Thinqloud Grammar Bank"
  }
];

async function autoSeed() {
  try {
    console.log('🔄 Checking database seed status...');

    // 1. Seed System Admin (PRD 3.2: paras.jagadish.patil@gmail.com / 2@Paras)
    const adminEmail = (process.env.ADMIN_EMAIL || 'paras.jagadish.patil@gmail.com').toLowerCase().trim();
    const existingAdmin = await db.users.findOne({ email: adminEmail });

    let adminId;
    if (!existingAdmin) {
      const rawPassword = process.env.ADMIN_PASSWORD || '2@Paras';
      const passwordHash = await bcrypt.hash(rawPassword, 12);

      const adminUser = {
        id: uuidv4(),
        email: adminEmail,
        name: 'Paras Jagadish Patil',
        role: 'SYSTEM_ADMIN',
        password_hash: passwordHash,
        failed_attempts: 0,
        account_locked_until: null,
        created_at: new Date().toISOString()
      };

      await db.users.create(adminUser);
      adminId = adminUser.id;
      console.log(`✅ System Admin seeded: ${adminEmail} (password: 2@Paras, bcrypt cost 12)`);
    } else {
      adminId = existingAdmin.id;
      console.log(`ℹ️ System Admin already exists: ${adminEmail}`);
    }

    // 2. Seed Questions Bank
    const currentQCount = await db.questions.count(q => !q.is_deleted);
    let createdQIds = [];

    if (currentQCount === 0) {
      console.log('🌱 Seeding initial VQAR Question Bank...');
      for (const q of SEED_QUESTIONS) {
        const item = {
          ...q,
          question_id: uuidv4(),
          is_deleted: false,
          created_by: adminId,
          created_at: new Date().toISOString()
        };
        await db.questions.create(item);
        createdQIds.push(item.question_id);
      }
      console.log(`✅ Seeded ${createdQIds.length} VQAR questions.`);
    } else {
      const existingQs = await db.questions.findMany(q => !q.is_deleted);
      createdQIds = existingQs.map(q => q.question_id);
      console.log(`ℹ️ Question bank already has ${currentQCount} active questions.`);
    }

    // 3. Seed Sample Active Test Session
    const sessionCount = await db.sessions.count();
    if (sessionCount === 0) {
      console.log('🌱 Seeding sample active test session...');
      const session = {
        session_id: uuidv4(),
        title: 'Thinqloud Campus Placement Screening Mock - Batch 2026',
        description: 'Comprehensive 75-minute aptitude screening assessment mirroring Thinqloud VQAR pattern (Quantitative, Logical, Verbal, and English Grammar).',
        duration_minutes: 75,
        total_questions: createdQIds.length,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days active
        sections: [
          { name: 'Quantitative', count: 12, topics: ['Percentage', 'Ratio', 'Average', 'Time & Work', 'Speed/Distance'] },
          { name: 'Logical', count: 7, topics: ['Series', 'Coding-Decoding', 'Blood Relations', 'Syllogisms'] },
          { name: 'Verbal', count: 5, topics: ['Synonyms / Antonyms', 'Sentence Completion', 'Para-jumbles'] },
          { name: 'Grammar', count: 5, topics: ['Subject-Verb Agreement', 'Error Detection', 'Tenses'] }
        ],
        shuffle_questions: true,
        shuffle_options: false,
        show_result: true,
        negative_marking: 0.25,
        access_code: 'THINQ6',
        status: 'ACTIVE',
        question_ids: createdQIds,
        created_by: adminId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.sessions.create(session);
      console.log(`✅ Seeded Active Test Session: "${session.title}" (Access Code: THINQ6)`);
    }

    console.log('🎉 Database initialization complete!');
  } catch (err) {
    console.error('Database seed error:', err);
  }
}

if (require.main === module) {
  autoSeed().then(() => process.exit(0));
}

module.exports = { autoSeed };
