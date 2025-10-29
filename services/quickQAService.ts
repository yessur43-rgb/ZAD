import { QuickQuestion, QuestionAnswer, QuestionCategory, QuestionStatus } from '../types';

const QUESTIONS_KEY = 'zad_quick_questions';
const QUESTION_EXPIRY_HOURS = 6;

// --- Helper Functions ---
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const getQuestions = (): QuickQuestion[] => {
  try {
    const stored = localStorage.getItem(QUESTIONS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      // Auto-cleanup and update status
      const now = Date.now();
      const updated = parsed.map(q => {
        if (q.expiresAt < now && q.status === 'active') {
          return { ...q, status: 'expired' as QuestionStatus };
        }
        return q;
      });

      // Remove very old expired questions (older than 24 hours)
      const cleaned = updated.filter(q => {
        if (q.status === 'expired') {
          return (now - q.expiresAt) < (24 * 60 * 60 * 1000);
        }
        return true;
      });

      if (cleaned.length !== parsed.length) {
        saveQuestions(cleaned);
      }

      return cleaned;
    }
    return [];
  } catch (e) {
    console.error("Failed to get questions", e);
    return [];
  }
};

const saveQuestions = (questions: QuickQuestion[]): void => {
  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error("Failed to save questions", e);
  }
};

// --- Question Management ---
export const askQuestion = (
  askedBy: string,
  question: string,
  location: QuickQuestion['location'],
  category: QuestionCategory = 'general',
  urgency: 'low' | 'high' = 'low',
  tags: string[] = []
): QuickQuestion => {
  const questions = getQuestions();
  const now = Date.now();

  const newQuestion: QuickQuestion = {
    id: generateId(),
    askedBy,
    question,
    location,
    category,
    urgency,
    timestamp: now,
    expiresAt: now + (QUESTION_EXPIRY_HOURS * 60 * 60 * 1000),
    answers: [],
    status: 'active',
    tags
  };

  questions.unshift(newQuestion);
  saveQuestions(questions);
  return newQuestion;
};

export const deleteQuestion = (questionId: string, userId: string): boolean => {
  let questions = getQuestions();
  const question = questions.find(q => q.id === questionId);

  if (!question || question.askedBy !== userId) {
    return false;
  }

  questions = questions.filter(q => q.id !== questionId);
  saveQuestions(questions);
  return true;
};

export const markQuestionResolved = (questionId: string, userId: string): boolean => {
  const questions = getQuestions();
  const question = questions.find(q => q.id === questionId);

  if (!question || question.askedBy !== userId) {
    return false;
  }

  question.status = 'resolved';
  saveQuestions(questions);
  return true;
};

// --- Answer Management ---
export const addAnswer = (
  questionId: string,
  userId: string,
  text: string,
  photos?: string[]
): QuestionAnswer | null => {
  const questions = getQuestions();
  const question = questions.find(q => q.id === questionId);

  if (!question || question.status !== 'active') {
    return null;
  }

  const newAnswer: QuestionAnswer = {
    id: generateId(),
    userId,
    text,
    photos,
    helpful: [],
    timestamp: Date.now()
  };

  question.answers.push(newAnswer);
  saveQuestions(questions);
  return newAnswer;
};

export const deleteAnswer = (questionId: string, answerId: string, userId: string): boolean => {
  const questions = getQuestions();
  const question = questions.find(q => q.id === questionId);

  if (!question) return false;

  const answer = question.answers.find(a => a.id === answerId);
  if (!answer || answer.userId !== userId) {
    return false;
  }

  question.answers = question.answers.filter(a => a.id !== answerId);
  saveQuestions(questions);
  return true;
};

export const markAnswerHelpful = (questionId: string, answerId: string, userId: string): void => {
  const questions = getQuestions();
  const question = questions.find(q => q.id === questionId);

  if (!question) return;

  const answer = question.answers.find(a => a.id === answerId);
  if (!answer) return;

  // Toggle helpful
  if (answer.helpful.includes(userId)) {
    answer.helpful = answer.helpful.filter(id => id !== userId);
  } else {
    answer.helpful.push(userId);
  }

  saveQuestions(questions);
};

export const selectBestAnswer = (questionId: string, answerId: string, userId: string): boolean => {
  const questions = getQuestions();
  const question = questions.find(q => q.id === questionId);

  if (!question || question.askedBy !== userId) {
    return false;
  }

  const answer = question.answers.find(a => a.id === answerId);
  if (!answer) return false;

  question.bestAnswerId = answerId;
  question.status = 'resolved';
  saveQuestions(questions);
  return true;
};

// --- Get Functions ---
export const getQuestionById = (questionId: string): QuickQuestion | null => {
  return getQuestions().find(q => q.id === questionId) || null;
};

export const getActiveQuestions = (): QuickQuestion[] => {
  return getQuestions().filter(q => q.status === 'active');
};

export const getQuestionsByCity = (city: string): QuickQuestion[] => {
  const lowerCity = city.toLowerCase();
  return getQuestions().filter(q =>
    q.location.city.toLowerCase() === lowerCity && q.status === 'active'
  );
};

export const getQuestionsByCategory = (category: QuestionCategory): QuickQuestion[] => {
  return getQuestions().filter(q =>
    q.category === category && q.status === 'active'
  );
};

export const getQuestionsByUser = (userId: string): QuickQuestion[] => {
  return getQuestions().filter(q => q.askedBy === userId);
};

export const getUrgentQuestions = (): QuickQuestion[] => {
  return getQuestions().filter(q =>
    q.urgency === 'high' && q.status === 'active'
  );
};

export const searchQuestions = (query: string, city?: string): QuickQuestion[] => {
  const lowerQuery = query.toLowerCase();
  let results = getQuestions().filter(q =>
    q.question.toLowerCase().includes(lowerQuery) ||
    q.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );

  if (city) {
    const lowerCity = city.toLowerCase();
    results = results.filter(q => q.location.city.toLowerCase() === lowerCity);
  }

  return results;
};

export const getNearbyQuestions = (
  lat: number,
  lon: number,
  radiusKm: number = 50
): QuickQuestion[] => {
  const questions = getActiveQuestions();

  return questions.filter(q => {
    const distance = calculateDistance(lat, lon, q.location.lat, q.location.lon);
    return distance <= radiusKm;
  }).sort((a, b) => {
    const distA = calculateDistance(lat, lon, a.location.lat, a.location.lon);
    const distB = calculateDistance(lat, lon, b.location.lat, b.location.lon);
    return distA - distB;
  });
};

// --- Statistics ---
export const getQuestionStats = (questionId: string) => {
  const question = getQuestionById(questionId);
  if (!question) return null;

  return {
    totalAnswers: question.answers.length,
    hasAcceptedAnswer: !!question.bestAnswerId,
    mostHelpfulAnswer: question.answers.reduce((max, answer) => {
      return answer.helpful.length > (max?.helpful.length || 0) ? answer : max;
    }, question.answers[0] || null),
    averageHelpfulVotes: question.answers.length > 0
      ? question.answers.reduce((sum, a) => sum + a.helpful.length, 0) / question.answers.length
      : 0
  };
};

// --- Cleanup ---
export const cleanupExpiredQuestions = (): number => {
  const questions = getQuestions();
  const now = Date.now();

  // Mark expired questions
  questions.forEach(q => {
    if (q.expiresAt < now && q.status === 'active') {
      q.status = 'expired';
    }
  });

  // Remove very old expired questions (older than 24 hours)
  const beforeCount = questions.length;
  const cleaned = questions.filter(q => {
    if (q.status === 'expired') {
      return (now - q.expiresAt) < (24 * 60 * 60 * 1000);
    }
    return true;
  });

  const removed = beforeCount - cleaned.length;

  if (removed > 0 || questions.some((q, i) => q.status !== cleaned[i]?.status)) {
    saveQuestions(cleaned);
  }

  return removed;
};

// --- Helper: Calculate Distance ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Export the getter
export { getQuestions };
