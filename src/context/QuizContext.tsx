import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Quiz, Question, Player, GameState } from '@/types/quiz';

interface QuizContextType {
  // Quiz creation
  currentQuiz: Quiz | null;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (questionId: string, question: Partial<Question>) => void;
  deleteQuestion: (questionId: string) => void;
  
  // Game state
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  startGame: (quiz: Quiz) => string;
  joinGame: (code: string, nickname: string) => Player | null;
  submitAnswer: (playerId: string, answerId: string, timeSpent: number) => void;
  nextQuestion: () => void;
  
  // Player state (for student view)
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player | null) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateId = () => {
  return Math.random().toString(36).substring(2, 11);
};

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const addQuestion = (question: Question) => {
    if (currentQuiz) {
      setCurrentQuiz({
        ...currentQuiz,
        questions: [...currentQuiz.questions, question],
      });
    }
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (currentQuiz) {
      setCurrentQuiz({
        ...currentQuiz,
        questions: currentQuiz.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q
        ),
      });
    }
  };

  const deleteQuestion = (questionId: string) => {
    if (currentQuiz) {
      setCurrentQuiz({
        ...currentQuiz,
        questions: currentQuiz.questions.filter((q) => q.id !== questionId),
      });
    }
  };

  const startGame = (quiz: Quiz): string => {
    const code = generateGameCode();
    setGameState({
      quiz,
      currentQuestionIndex: -1, // -1 means waiting for players
      players: [],
      isActive: true,
      gameCode: code,
      timeRemaining: 0,
    });
    return code;
  };

  const joinGame = (code: string, nickname: string): Player | null => {
    if (gameState && gameState.gameCode === code && gameState.isActive) {
      const player: Player = {
        id: generateId(),
        nickname,
        score: 0,
        currentStreak: 0,
      };
      setGameState({
        ...gameState,
        players: [...gameState.players, player],
      });
      return player;
    }
    return null;
  };

  const submitAnswer = (playerId: string, answerId: string, timeSpent: number) => {
    if (!gameState || !gameState.quiz) return;

    const question = gameState.quiz.questions[gameState.currentQuestionIndex];
    if (!question) return;

    let isCorrect = false;
    
    if (question.type === 'multiple-choice') {
      const selectedAnswer = question.answers.find((a) => a.id === answerId);
      isCorrect = selectedAnswer?.isCorrect || false;
    }
    // For ordering, we'd check the full sequence elsewhere

    const timeBonus = Math.max(0, (question.timeLimit - timeSpent) / question.timeLimit);
    const pointsEarned = isCorrect ? Math.round(question.points * (0.5 + 0.5 * timeBonus)) : 0;

    setGameState({
      ...gameState,
      players: gameState.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              score: p.score + pointsEarned,
              currentStreak: isCorrect ? p.currentStreak + 1 : 0,
            }
          : p
      ),
    });
  };

  const nextQuestion = () => {
    if (gameState && gameState.quiz) {
      const nextIndex = gameState.currentQuestionIndex + 1;
      if (nextIndex < gameState.quiz.questions.length) {
        setGameState({
          ...gameState,
          currentQuestionIndex: nextIndex,
          timeRemaining: gameState.quiz.questions[nextIndex].timeLimit,
        });
      } else {
        setGameState({
          ...gameState,
          isActive: false,
        });
      }
    }
  };

  return (
    <QuizContext.Provider
      value={{
        currentQuiz,
        setCurrentQuiz,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        gameState,
        setGameState,
        startGame,
        joinGame,
        submitAnswer,
        nextQuestion,
        currentPlayer,
        setCurrentPlayer,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
