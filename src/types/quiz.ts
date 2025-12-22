export type QuestionType = 'multiple-choice' | 'ordering';

export interface Answer {
  id: string;
  text: string;
  isCorrect?: boolean; // For multiple choice
  order?: number; // For ordering questions (correct order)
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  mediaUrl?: string;
  answers: Answer[];
  timeLimit: number; // in seconds
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: Date;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  currentStreak: number;
}

export interface GameState {
  quiz: Quiz | null;
  currentQuestionIndex: number;
  players: Player[];
  isActive: boolean;
  gameCode: string;
  timeRemaining: number;
}
