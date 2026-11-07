import { supabase } from './supabase';

export type SIAResult =
  | {
      type: 'answer';
      question: string;
      answer: string;
      faqId: string;
    }
  | {
      type: 'urgent';
      message: string;
    }
  | {
      type: 'not_found';
      reason: 'no_match' | 'service_error' | 'invalid';
      message: string;
    };

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category_id: string | null;
  category_name?: string;
};

type FAQCategory = {
  id: string;
  name: string;
  slug: string;
};

type SemanticMatch = {
  faqId: string | null;
  confidence: number;
};

export type StaffRole = 'admin' | 'doctor';

export type StaffMember = {
  user_id: string;
  role: StaffRole;
};

export type UnansweredQuestion = {
  id: string;
  user_id: string;
  question: string;
  category_id: string | null;
  status:
    | 'new'
    | 'under_review'
    | 'assigned'
    | 'awaiting_doctor'
    | 'answered'
    | 'closed';
  email_follow_up_consent: boolean;
  created_at: string;
};

export type DoctorResponse = {
  id: string;
  question_id: string;
  doctor_id: string;
  response: string;
  status: 'submitted' | 'approved' | 'rejected';
  created_at: string;
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were',
  'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'what', 'when', 'where', 'who', 'why', 'how',
  'can', 'could', 'should', 'would', 'do', 'does',
  'did', 'during', 'in', 'on', 'at', 'to', 'for',
  'of', 'and', 'or', 'with', 'about', 'please',
  'tell', 'explain', 'know', 'want', 'like',
  'is it', 'there', 'this', 'that', 'these', 'those',
  'meant', 'mean', 'much', 'many', 'also',
]);

const SYNONYM_GROUPS: string[][] = [
  ['pregnancy test', 'home pregnancy test', 'urine pregnancy test', 'upt', 'hpt'],
  ['last menstrual period', 'last period', 'lmp', 'period date'],
  ['due date', 'expected delivery date', 'edd', 'delivery date'],
  ['morning sickness', 'nausea', 'vomiting'],
  ['sonography', 'ultrasound', 'scan', 'usg'],
  ['iron', 'iron supplement', 'iron tablet'],
  ['folic acid', 'folate'],
  ['blood pressure', 'bp'],
  ['gestational diabetes', 'pregnancy diabetes', 'gdm'],
  ['baby movement', 'fetal movement', 'foetal movement', 'kicks'],
  ['breastfeeding', 'nursing', 'breast feeding'],
  ['constipation', 'hard stools'],
  ['heartburn', 'acidity', 'acid reflux'],
  ['back pain', 'backache'],
  ['swelling', 'oedema', 'edema'],
  ['water breaking', 'waters breaking', 'rupture of membranes'],
  ['doctor', 'obstetrician', 'gynaecologist', 'gynecologist'],
  ['period', 'menstruation', 'menstrual cycle'],
  ['vitamin d', 'vitamin d3'],
  ['urine test', 'urine examination'],
];

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicaliseSynonyms(value: string): string {
  let result = normaliseText(value);

  const replacements = [
    ['home pregnancy test', 'pregnancytest'],
    ['urine pregnancy test', 'pregnancytest'],
    ['pregnancy test', 'pregnancytest'],
    ['last menstrual period', 'lmp'],
    ['last period', 'lmp'],
    ['expected delivery date', 'edd'],
    ['expected date of delivery', 'edd'],
    ['morning sickness', 'nausea'],
    ['acid reflux', 'heartburn'],
    ['hard stools', 'constipation'],
    ['fetal movement', 'babymovement'],
    ['foetal movement', 'babymovement'],
    ['baby movement', 'babymovement'],
    ['waters breaking', 'waterbreaking'],
    ['water breaking', 'waterbreaking'],
    ['rupture of membranes', 'waterbreaking'],
    ['blood pressure', 'bp'],
    ['gestational diabetes', 'gdm'],
    ['pregnancy diabetes', 'gdm'],
    ['folic acid', 'folate'],
    ['iron supplement', 'iron'],
    ['iron tablet', 'iron'],
    ['urine examination', 'urinetest'],
    ['urine test', 'urinetest'],
    ['breast feeding', 'breastfeeding'],
  ];

  for (const [phrase, replacement] of replacements) {
    result = result.replace(
      new RegExp(
        `\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'g'
      ),
      replacement
    );
  }

  result = result
    .replace(/\bupt\b/g, 'pregnancytest')
    .replace(/\bhpt\b/g, 'pregnancytest')
    .replace(/\blmp\b/g, 'lmp')
    .replace(/\bedd\b/g, 'edd')
    .replace(/\bbp\b/g, 'bp')
    .replace(/\busg\b/g, 'ultrasound');

  return result;
}

function getKeywords(value: string): string[] {
  return canonicaliseSynonyms(value)
    .split(' ')
    .filter(
      word => word.length > 2 && !STOP_WORDS.has(word)
    );
}

function getCategoryHints(question: string): string[] {
  const text = normaliseText(question);
  const hints: string[] = [];

  const categoryKeywords: Record<string, string[]> = {
    nutrition: [
      'food', 'diet', 'eat', 'eating', 'nutrition',
      'meal', 'fruit', 'vegetable', 'protein',
      'vitamin', 'iron', 'folate', 'water',
      'drink', 'weight',
    ],
    symptoms: [
      'pain', 'vomiting', 'nausea', 'bleeding',
      'cramp', 'cramps', 'headache', 'fever',
      'swelling', 'constipation', 'heartburn',
      'dizziness', 'fatigue', 'tired',
    ],
    medication: [
      'medicine', 'medication', 'tablet', 'drug',
      'supplement', 'dose', 'prescription',
      'antibiotic', 'painkiller',
    ],
    exercise: [
      'exercise', 'yoga', 'walking', 'walk',
      'workout', 'fitness', 'activity',
    ],
    'pregnancy care': [
      'pregnancy', 'pregnant', 'trimester',
      'antenatal', 'prenatal', 'doctor',
      'checkup', 'check up', 'care',
    ],
    'tests and scans': [
      'test', 'scan', 'ultrasound', 'sonography',
      'blood test', 'urine test', 'screening',
      'report', 'lmp', 'edd',
    ],
    'mental wellbeing': [
      'stress', 'anxiety', 'depression',
      'mental health', 'mood', 'emotional',
      'sleep', 'sad', 'worried',
    ],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      hints.push(category);
    }
  }

  return hints;
}

const URGENT_PATTERNS = [
  /\bheavy bleeding\b/i,
  /\bsoaking (a )?pad\b/i,
  /\bbleeding heavily\b/i,
  /\bsevere abdominal pain\b/i,
  /\bsevere stomach pain\b/i,
  /\bsevere belly pain\b/i,
  /\bsevere headache\b/i,
  /\bblurred vision\b/i,
  /\bloss of vision\b/i,
  /\bvision changes\b/i,
  /\bseizure\b/i,
  /\bconvulsion\b/i,
  /\bfainted\b/i,
  /\bunconscious\b/i,
  /\btrouble breathing\b/i,
  /\bdifficulty breathing\b/i,
  /\bchest pain\b/i,
  /\bbaby (has )?stopped moving\b/i,
  /\bno baby movement\b/i,
  /\bdecreased fetal movement\b/i,
  /\breduced fetal movement\b/i,
  /\bhigh fever\b/i,
  /\bwater broke\b/i,
  /\bwaters broke\b/i,
];

function hasUrgentSymptoms(question: string): boolean {
  return URGENT_PATTERNS.some(pattern => pattern.test(question));
}

function getUrgentMessage(): string {
  return (
    'Your message mentions a symptom that may need urgent medical attention. ' +
    'Please contact your obstetrician or seek urgent medical care now. ' +
    'If symptoms are severe, go to the nearest emergency department. ' +
    'Please do not wait for an answer from SIA or for a doctor to review a submitted question.'
  );
}

function findBestFAQ(
  userQuestion: string,
  faqs: FAQ[]
): FAQ | null {
  const userNormalised = canonicaliseSynonyms(userQuestion);

  const exactMatch = faqs.find(
    faq =>
      canonicaliseSynonyms(faq.question) === userNormalised
  );

  if (exactMatch) {
    return exactMatch;
  }

  const userKeywords = [...new Set(getKeywords(userQuestion))];

  if (!userKeywords.length) {
    return null;
  }

  const categoryHints = getCategoryHints(userQuestion);

  let bestFAQ: FAQ | null = null;
  let bestScore = 0;
  let secondBestScore = 0;

  for (const faq of faqs) {
    const faqKeywords = [...new Set(getKeywords(faq.question))];

    if (!faqKeywords.length) continue;

    const sharedWords = userKeywords.filter(
      word => faqKeywords.includes(word)
    );

    if (sharedWords.length === 0) continue;

    const userCoverage =
      sharedWords.length / userKeywords.length;

    const faqCoverage =
      sharedWords.length / faqKeywords.length;

    const precisionRecallScore =
      (2 * userCoverage * faqCoverage) /
      (userCoverage + faqCoverage);

    const categoryName = normaliseText(
      faq.category_name || ''
    );

    const categoryMatch = categoryHints.some(
      hint => categoryName.includes(hint)
    );

    const categoryBonus = categoryMatch ? 0.08 : 0;

    const score = precisionRecallScore + categoryBonus;

    if (
      score > bestScore &&
      sharedWords.length >= 2 &&
      userCoverage >= 0.5 &&
      faqCoverage >= 0.25
    ) {
      secondBestScore = bestScore;
      bestScore = score;
      bestFAQ = faq;
    } else if (score > secondBestScore) {
      secondBestScore = score;
    }
  }

  if (!bestFAQ || bestScore < 0.48) {
    return null;
  }

  if (
    secondBestScore > 0 &&
    bestScore - secondBestScore < 0.06
  ) {
    return null;
  }

  return bestFAQ;
}

async function fetchApprovedFAQs(): Promise<FAQ[]> {
  const { data: categoryData, error: categoryError } =
    await supabase
      .from('faq_categories')
      .select('id, name, slug');

  if (categoryError) {
    console.warn(
      'SIA: Category lookup unavailable:',
      categoryError.message
    );
  }

  const categories = (categoryData || []) as FAQCategory[];

  const categoryMap = new Map(
    categories.map(category => [
      category.id,
      category.name,
    ])
  );

  const pageSize = 500;
  const maxFAQs = 1000;
  let allFAQs: FAQ[] = [];

  for (let offset = 0; offset < maxFAQs; offset += pageSize) {
    const { data, error } = await supabase
      .from('faqs')
      .select('id, question, answer, category_id')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('SIA FAQ query failed:', error.message);
      throw new Error('Unable to retrieve approved FAQs.');
    }

    const page = (data || []) as FAQ[];

    allFAQs = allFAQs.concat(
      page.map(faq => ({
        ...faq,
        category_name: faq.category_id
          ? categoryMap.get(faq.category_id) || ''
          : '',
      }))
    );

    if (page.length < pageSize) {
      break;
    }
  }

  return allFAQs;
}

async function findSemanticFAQ(
  question: string
): Promise<SemanticMatch | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'bright-responder',
      {
        body: {
          question,
        },
      }
    );

    if (error) {
      console.error('SIA invocation error:', error);
      const context = (error as any).context;
      if (context) {
        console.error('HTTP status:', context.status);
        try {
          console.error(
            'HTTP response:',
            await context.clone().text()
          );
        } catch {
          console.error('Could not read HTTP response.');
        }
      }
      return null;
    }

    if (!data || typeof data !== 'object') {
      return null;
    }

    const faqId =
      typeof data.faqId === 'string' ? data.faqId : null;

    const confidence = Number(data.confidence);

    if (
      !faqId ||
      !Number.isFinite(confidence) ||
      confidence < 0.85
    ) {
      return null;
    }

    return {
      faqId,
      confidence,
    };
  } catch (error) {
    console.warn('SIA semantic matching error:', error);
    return null;
  }
}

async function fetchApprovedFAQById(
  faqId: string
): Promise<FAQ | null> {
  const { data, error } = await supabase
    .from('faqs')
    .select('id, question, answer, category_id')
    .eq('id', faqId)
    .eq('status', 'approved')
    .maybeSingle();

  if (error) {
    console.error(
      'SIA matched FAQ lookup failed:',
      error.message
    );
    return null;
  }

  if (!data) {
    return null;
  }

  return data as FAQ;
}

export async function askSIA(
  question: string
): Promise<SIAResult> {
  const cleanQuestion = question.trim();

  if (!cleanQuestion) {
    return {
      type: 'not_found',
      reason: 'invalid',
      message: 'Please enter a question.',
    };
  }

  if (cleanQuestion.length > 500) {
    return {
      type: 'not_found',
      reason: 'invalid',
      message: 'Please keep your question under 500 characters.',
    };
  }

  if (hasUrgentSymptoms(cleanQuestion)) {
    return {
      type: 'urgent',
      message: getUrgentMessage(),
    };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        type: 'not_found',
        reason: 'service_error',
        message:
          'Please sign in to MumWise again before asking SIA a question.',
      };
    }

    const semanticMatch = await findSemanticFAQ(cleanQuestion);

    if (semanticMatch) {

      const matchedFAQ = await fetchApprovedFAQById(
        semanticMatch.faqId!
      );

      if (matchedFAQ) {
        return {
          type: 'answer',
          question: matchedFAQ.question,
          answer: matchedFAQ.answer,
          faqId: matchedFAQ.id,
        };
      }
    }

    const faqs = await fetchApprovedFAQs();

    if (faqs.length === 0) {
      return {
        type: 'not_found',
        reason: 'service_error',
        message:
          "I couldn't access my approved information right now. Please try again later or consult your healthcare provider.",
      };
    }

    const localMatch = findBestFAQ(cleanQuestion, faqs);

    if (localMatch) {
      return {
        type: 'answer',
        question: localMatch.question,
        answer: localMatch.answer,
        faqId: localMatch.id,
      };
    }

    return {
      type: 'not_found',
      reason: 'no_match',
      message:
        "I don't have a sufficiently reliable approved answer to that question yet. I don't want to guess. You can submit your question for review by our healthcare team, or consult your healthcare provider.",
    };
  } catch (error) {
    console.error('Unexpected SIA error:', error);

    return {
      type: 'not_found',
      reason: 'service_error',
      message:
        "I'm having trouble accessing my verified information right now. Please try again later or consult your healthcare provider.",
    };
  }
}

export async function submitUnansweredQuestion(
  question: string,
  emailFollowUpConsent: boolean = false
) {
  const cleanQuestion = question.trim();

  if (!cleanQuestion) {
    throw new Error('Please enter a question.');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      'Please sign in before submitting a question.'
    );
  }

  const { data, error } = await supabase
    .from('unanswered_questions')
    .insert({
      user_id: user.id,
      question: cleanQuestion,
      email_follow_up_consent: emailFollowUpConsent,
      status: 'new',
    })
    .select('id, question, status, created_at')
    .single();

  if (error) {
    console.error('Question submission error:', error.message);
    throw new Error(
      'Your question could not be submitted. Please try again.'
    );
  }

  return data;
}

export async function getStaffRole(): Promise<StaffRole | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Please sign in first.');
  }

  const { data, error } = await supabase
    .from('staff_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (data?.role === 'admin' || data?.role === 'doctor') {
    return data.role;
  }

  return null;
}

export async function getUnansweredQuestions() {
  const { data, error } = await supabase
    .from('unanswered_questions')
    .select(
      'id, user_id, question, category_id, status, email_follow_up_consent, created_at'
    )
    .in('status', [
      'new',
      'under_review',
      'assigned',
      'awaiting_doctor',
    ])
    .order('created_at', { ascending: true });

  if (error) {
    console.error(
      'Unable to load unanswered questions:',
      error.message
    );
    throw new Error('Could not load submitted questions.');
  }

  return (data ?? []) as UnansweredQuestion[];
}

export async function getDoctors() {
  const { data, error } = await supabase
    .from('staff_users')
    .select('user_id, role, display_name')
    .eq('role', 'doctor')
    .order('display_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function assignQuestionToDoctor(
  questionId: string,
  doctorId: string
) {
  const { error } = await supabase.rpc(
    'admin_assign_question',
    {
      p_question_id: questionId,
      p_doctor_id: doctorId,
    }
  );

  if (error) {
    console.error('Doctor assignment failed:', error.message);
    throw new Error(
      error.message || 'Could not assign this question.'
    );
  }
}

export async function getMyDoctorAssignments() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Please sign in again.');
  }

  const { data, error } = await supabase
    .from('doctor_assignments')
    .select(`
      id,
      question_id,
      status,
      assigned_at,
      unanswered_questions (
        question
      )
    `)
    .eq('doctor_id', user.id)
    .in('status', ['assigned', 'in_progress'])
    .order('assigned_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function submitDoctorResponse(
  questionId: string,
  response: string
) {
  const cleanResponse = response.trim();

  if (!cleanResponse) {
    throw new Error('Please enter your response.');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Please sign in first.');
  }

  const { data: assignment, error: assignmentError } =
    await supabase
      .from('doctor_assignments')
      .select('id, status')
      .eq('question_id', questionId)
      .eq('doctor_id', user.id)
      .in('status', ['assigned', 'in_progress'])
      .maybeSingle();

  if (assignmentError || !assignment) {
    throw new Error(
      'This question is not assigned to your account.'
    );
  }

  const { data, error } = await supabase
    .from('doctor_responses')
    .insert({
      question_id: questionId,
      doctor_id: user.id,
      response: cleanResponse,
      status: 'submitted',
    })
    .select(
      'id, question_id, doctor_id, response, status, created_at'
    )
    .single();

  if (error) {
    console.error(
      'Doctor response submission failed:',
      error.message
    );
    throw new Error('Could not submit your response.');
  }

  const { error: assignmentUpdateError } = await supabase
    .from('doctor_assignments')
    .update({ status: 'completed' })
    .eq('id', assignment.id);

  if (assignmentUpdateError) {
    console.error(
      'Assignment status update failed:',
      assignmentUpdateError.message
    );
    throw new Error(
      'Your response was submitted, but the assignment status could not be updated. Please contact the administrator.'
    );
  }

  const { error: questionUpdateError } = await supabase
    .from('unanswered_questions')
    .update({ status: 'awaiting_doctor' })
    .eq('id', questionId);

  if (questionUpdateError) {
    console.error(
      'Question status update failed:',
      questionUpdateError.message
    );
  }

  return data as DoctorResponse;
}

export async function getPendingDoctorResponses() {
  const { data, error } = await supabase
    .from('doctor_responses')
    .select(
      'id, question_id, doctor_id, response, status, created_at'
    )
    .eq('status', 'submitted')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(
      'Unable to load doctor responses:',
      error.message
    );
    throw new Error('Could not load submitted doctor responses.');
  }

  return (data ?? []) as DoctorResponse[];
}

export async function approveDoctorResponse(
  responseId: string
) {
  const { data, error } = await supabase.rpc(
    'admin_publish_doctor_response',
    {
      p_response_id: responseId,
    }
  );

  if (error) {
    console.error('Response approval failed:', error.message);
    throw new Error(
      error.message || 'Could not approve this response.'
    );
  }

  return data as string;
}

export async function rejectDoctorResponse(
  responseId: string
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Please sign in first.');
  }

  const { data, error } = await supabase
    .from('doctor_responses')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', responseId)
    .eq('status', 'submitted')
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Response rejection failed:', error.message);
    throw new Error('Could not reject this response.');
  }

  if (!data) {
    throw new Error(
      'This response may already have been reviewed.'
    );
  }
}
