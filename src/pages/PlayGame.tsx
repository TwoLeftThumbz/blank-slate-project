import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLogo } from '@/components/GameLogo';
import { AnswerCard, answerColors } from '@/components/AnswerCard';
import { useQuiz } from '@/context/QuizContext';
import { Clock, Trophy, Check, X, Loader2 } from 'lucide-react';

const PlayGame: React.FC = () => {
  const navigate = useNavigate();
  const { gameState, currentPlayer, submitAnswer } = useQuiz();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    if (!gameState || !currentPlayer) {
      navigate('/join');
    }
  }, [gameState, currentPlayer, navigate]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setLastResult(null);
    setTimeSpent(0);
  }, [gameState?.currentQuestionIndex]);

  // Track time spent
  useEffect(() => {
    if (gameState && gameState.currentQuestionIndex >= 0 && !answered) {
      const timer = setInterval(() => {
        setTimeSpent((prev) => prev + 0.1);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [gameState?.currentQuestionIndex, answered]);

  if (!gameState || !currentPlayer) {
    return null;
  }

  const currentQuestion = gameState.quiz?.questions[gameState.currentQuestionIndex];
  const isWaiting = gameState.currentQuestionIndex === -1;
  const isGameOver = !gameState.isActive;

  const handleAnswerSelect = (answerId: string) => {
    if (answered) return;

    setSelectedAnswer(answerId);
    setAnswered(true);

    const answer = currentQuestion?.answers.find((a) => a.id === answerId);
    const isCorrect = answer?.isCorrect || false;
    setLastResult(isCorrect ? 'correct' : 'incorrect');

    submitAnswer(currentPlayer.id, answerId, timeSpent);
  };

  // Waiting for Game to Start
  if (isWaiting) {
    return (
      <div className="min-h-screen game-gradient flex flex-col items-center justify-center px-4">
        <div className="text-center animate-slide-up">
          <div className="w-24 h-24 rounded-full bg-primary mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">🎮</span>
          </div>
          <h1 className="text-3xl font-black mb-2">You're in!</h1>
          <p className="text-xl text-muted-foreground mb-4">{currentPlayer.nickname}</p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Waiting for host to start...</span>
          </div>
        </div>
      </div>
    );
  }

  // Game Over
  if (isGameOver) {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const playerRank = sortedPlayers.findIndex((p) => p.id === currentPlayer.id) + 1;

    return (
      <div className="min-h-screen game-gradient flex flex-col items-center justify-center px-4">
        <div className="text-center animate-slide-up">
          <Trophy className="w-20 h-20 text-answer-yellow mx-auto mb-4" />
          <h1 className="text-4xl font-black mb-2">Game Over!</h1>
          <p className="text-2xl font-bold text-primary mb-6">
            You finished #{playerRank}
          </p>
          <div className="bg-card rounded-2xl p-6 inline-block">
            <p className="text-muted-foreground mb-1">Final Score</p>
            <p className="text-4xl font-black">{currentPlayer.score.toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  // Answered - Waiting for Results
  if (answered && currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{
          background: lastResult === 'correct' 
            ? 'linear-gradient(135deg, hsl(145 70% 30%) 0%, hsl(145 70% 20%) 100%)'
            : 'linear-gradient(135deg, hsl(0 70% 40%) 0%, hsl(0 70% 30%) 100%)'
        }}
      >
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-foreground/20 mx-auto mb-6 flex items-center justify-center">
            {lastResult === 'correct' ? (
              <Check className="w-12 h-12 text-foreground" />
            ) : (
              <X className="w-12 h-12 text-foreground" />
            )}
          </div>
          <h1 className="text-4xl font-black mb-2">
            {lastResult === 'correct' ? 'Correct!' : 'Incorrect'}
          </h1>
          <p className="text-xl text-foreground/80">
            {lastResult === 'correct' 
              ? `+${Math.round(currentQuestion.points * (0.5 + 0.5 * Math.max(0, (currentQuestion.timeLimit - timeSpent) / currentQuestion.timeLimit)))} points!`
              : 'Better luck next time!'}
          </p>
          {currentPlayer.currentStreak > 1 && (
            <p className="text-lg text-answer-yellow mt-4 font-bold">
              🔥 {currentPlayer.currentStreak} answer streak!
            </p>
          )}
        </div>
      </div>
    );
  }

  // Active Question
  return (
    <div className="min-h-screen game-gradient flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="bg-card rounded-lg px-4 py-2">
          <span className="font-bold">{currentPlayer.nickname}</span>
        </div>
        <div className="bg-card rounded-lg px-4 py-2 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-answer-yellow" />
          <span className="font-bold">{currentPlayer.score}</span>
        </div>
      </header>

      {/* Answer Grid */}
      <main className="flex-1 grid grid-cols-2 gap-3 p-3">
        {currentQuestion?.answers.map((answer, index) => (
          <AnswerCard
            key={answer.id}
            color={answerColors[index]}
            onClick={() => handleAnswerSelect(answer.id)}
            selected={selectedAnswer === answer.id}
            className="h-full min-h-[120px]"
          />
        ))}
      </main>
    </div>
  );
};

export default PlayGame;
