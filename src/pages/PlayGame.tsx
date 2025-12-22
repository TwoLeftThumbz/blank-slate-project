import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GameLogo } from '@/components/GameLogo';
import { AnswerCard, answerColors } from '@/components/AnswerCard';
import { OrderingQuestion } from '@/components/OrderingQuestion';
import { useGameRealtime } from '@/hooks/useGameRealtime';
import { supabase } from '@/integrations/supabase/client';
import { submitPlayerAnswer, fetchQuizWithQuestions } from '@/lib/gameUtils';
import { Trophy, Check, X, Loader2 } from 'lucide-react';

interface QuestionData {
  id: string;
  question_text: string;
  question_type: string;
  time_limit: number;
  points: number;
  media_url: string | null;
  answers: {
    id: string;
    answer_text: string;
    is_correct: boolean;
    order_index: number;
  }[];
}

const PlayGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  const playerId = searchParams.get('playerId');
  
  const { game, players } = useGameRealtime(gameId);
  const [quiz, setQuiz] = useState<{ title: string; questions: QuestionData[] } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);
  const [lastPoints, setLastPoints] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<{ nickname: string; score: number; current_streak: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Get player info
  useEffect(() => {
    const fetchPlayer = async () => {
      if (!playerId) return;
      
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .maybeSingle();

      if (data) {
        setCurrentPlayer({
          nickname: data.nickname,
          score: data.score,
          current_streak: data.current_streak,
        });
      }
    };

    fetchPlayer();
  }, [playerId]);

  // Update player info from realtime
  useEffect(() => {
    if (playerId && players.length > 0) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        setCurrentPlayer({
          nickname: player.nickname,
          score: player.score,
          current_streak: player.current_streak,
        });
      }
    }
  }, [players, playerId]);

  // Load quiz data
  useEffect(() => {
    const loadQuiz = async () => {
      if (!game?.quiz_id) return;

      const quizData = await fetchQuizWithQuestions(game.quiz_id);
      if (quizData) {
        setQuiz({
          title: quizData.title,
          questions: quizData.questions.map(q => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            time_limit: q.time_limit,
            points: q.points,
            media_url: q.media_url,
            answers: q.answers.map(a => ({
              id: a.id,
              answer_text: a.answer_text,
              is_correct: a.is_correct,
              order_index: a.order_index,
            })),
          })),
        });
      }
      setLoading(false);
    };

    if (game) {
      loadQuiz();
    }
  }, [game?.quiz_id]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setLastResult(null);
    setTimeSpent(0);
    setLastPoints(0);
  }, [game?.current_question_index]);

  // Track time spent
  useEffect(() => {
    if (game && game.current_question_index >= 0 && !answered) {
      const timer = setInterval(() => {
        setTimeSpent((prev) => prev + 0.1);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [game?.current_question_index, answered]);

  if (!gameId || !playerId) {
    navigate('/join');
    return null;
  }

  if (loading || !game || !currentPlayer) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentQuestion = quiz?.questions[game.current_question_index];
  const isWaiting = game.current_question_index === -1;
  const isGameOver = game.status === 'finished';

  const handleAnswerSelect = async (answerId: string) => {
    if (answered || !currentQuestion) return;

    setSelectedAnswer(answerId);
    setAnswered(true);

    const answer = currentQuestion.answers.find((a) => a.id === answerId);
    const isCorrect = answer?.is_correct || false;
    setLastResult(isCorrect ? 'correct' : 'incorrect');

    // Calculate points
    const timeBonus = Math.max(0, (currentQuestion.time_limit - timeSpent) / currentQuestion.time_limit);
    const pointsEarned = isCorrect ? Math.round(currentQuestion.points * (0.5 + 0.5 * timeBonus)) : 0;
    setLastPoints(pointsEarned);

    // Submit to database
    await submitPlayerAnswer(
      playerId,
      currentQuestion.id,
      answerId,
      Math.round(timeSpent * 1000),
      isCorrect,
      pointsEarned
    );
  };

  const handleOrderingSubmit = async (orderedIds: string[]) => {
    if (answered || !currentQuestion) return;

    setAnswered(true);

    // Check if the order is correct by comparing with order_index
    const correctOrder = [...currentQuestion.answers]
      .sort((a, b) => a.order_index - b.order_index)
      .map(a => a.id);
    
    const isCorrect = orderedIds.every((id, index) => id === correctOrder[index]);
    setLastResult(isCorrect ? 'correct' : 'incorrect');

    // Calculate points - partial credit based on correct positions
    let correctPositions = 0;
    orderedIds.forEach((id, index) => {
      if (id === correctOrder[index]) correctPositions++;
    });
    
    const correctRatio = correctPositions / orderedIds.length;
    const timeBonus = Math.max(0, (currentQuestion.time_limit - timeSpent) / currentQuestion.time_limit);
    const pointsEarned = Math.round(currentQuestion.points * correctRatio * (0.5 + 0.5 * timeBonus));
    setLastPoints(pointsEarned);

    // Submit to database (no single answer_id for ordering)
    await submitPlayerAnswer(
      playerId,
      currentQuestion.id,
      null,
      Math.round(timeSpent * 1000),
      isCorrect,
      pointsEarned
    );
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
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const playerRank = sortedPlayers.findIndex((p) => p.id === playerId) + 1;

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
              ? `+${lastPoints} points!`
              : 'Better luck next time!'}
          </p>
          {currentPlayer.current_streak > 1 && lastResult === 'correct' && (
            <p className="text-lg text-answer-yellow mt-4 font-bold">
              🔥 {currentPlayer.current_streak + 1} answer streak!
            </p>
          )}
        </div>
      </div>
    );
  }

  // Active Question - Just show answer buttons
  if (!currentQuestion) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

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

      {/* Answer Area */}
      <main className="flex-1 p-3 overflow-auto">
        {currentQuestion.question_type === 'ordering' ? (
          <OrderingQuestion
            answers={currentQuestion.answers}
            onSubmit={handleOrderingSubmit}
            disabled={answered}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 h-full">
            {currentQuestion.answers.map((answer, index) => (
              <AnswerCard
                key={answer.id}
                color={answerColors[index]}
                onClick={() => handleAnswerSelect(answer.id)}
                selected={selectedAnswer === answer.id}
                className="h-full min-h-[120px]"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PlayGame;
