import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GameLogo } from '@/components/GameLogo';
import { AnswerCard, answerColors } from '@/components/AnswerCard';
import { useGameRealtime } from '@/hooks/useGameRealtime';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fetchQuizWithQuestions } from '@/lib/gameUtils';
import { Users, Play, SkipForward, Trophy, Clock, Loader2 } from 'lucide-react';

interface QuestionData {
  id: string;
  text: string;
  type: string;
  time_limit: number;
  points: number;
  answers: {
    id: string;
    text: string;
    is_correct: boolean;
  }[];
}

const HostGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const { game, players, updateGame, fetchPlayers } = useGameRealtime(gameId);
  const [quiz, setQuiz] = useState<{ title: string; questions: QuestionData[] } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

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
            text: q.text,
            type: q.type,
            time_limit: q.time_limit,
            points: q.points,
            answers: q.answers.map(a => ({
              id: a.id,
              text: a.text,
              is_correct: a.is_correct,
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

  // Timer countdown
  useEffect(() => {
    if (game && game.current_question_index >= 0 && timeLeft > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowResults(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game?.current_question_index, timeLeft, showResults]);

  // Reset state when question changes
  useEffect(() => {
    if (game && quiz && game.current_question_index >= 0) {
      const question = quiz.questions[game.current_question_index];
      if (question) {
        setTimeLeft(question.time_limit);
        setShowResults(false);
      }
    }
  }, [game?.current_question_index, quiz]);

  if (authLoading || loading || !game) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentQuestion = quiz?.questions[game.current_question_index];
  const isWaitingForPlayers = game.current_question_index === -1;
  const isGameOver = !game.is_active;

  const handleStartQuiz = async () => {
    if (!quiz || quiz.questions.length === 0) return;
    
    await updateGame({
      current_question_index: 0,
      started_at: new Date().toISOString(),
    });
  };

  const handleNextQuestion = async () => {
    if (!quiz) return;
    
    setShowResults(false);
    const nextIndex = game.current_question_index + 1;
    
    if (nextIndex < quiz.questions.length) {
      await updateGame({ current_question_index: nextIndex });
    } else {
      await updateGame({
        is_active: false,
        ended_at: new Date().toISOString(),
      });
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Waiting for Players Screen
  if (isWaitingForPlayers) {
    return (
      <div className="min-h-screen game-gradient flex flex-col">
        <header className="p-6">
          <GameLogo size="sm" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="text-2xl font-bold mb-4 text-muted-foreground">Join at</h1>
            <p className="text-lg text-muted-foreground mb-2">{window.location.host}/join</p>
            <div className="bg-foreground text-background rounded-2xl px-12 py-6 inline-block">
              <p className="text-sm font-medium opacity-70 mb-1">Game PIN:</p>
              <h2 className="text-5xl font-black tracking-wider">{game.game_code}</h2>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-bold">{players.length} Players</span>
            </div>
            
            {players.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Waiting for players to join...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {players.map((player) => (
                  <span
                    key={player.id}
                    className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium animate-scale-in"
                  >
                    {player.nickname}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="game"
            size="xl"
            onClick={handleStartQuiz}
            disabled={players.length === 0}
            className="mt-8"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Quiz
          </Button>
        </main>
      </div>
    );
  }

  // Game Over Screen
  if (isGameOver) {
    return (
      <div className="min-h-screen game-gradient flex flex-col">
        <header className="p-6">
          <GameLogo size="sm" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-8 animate-slide-up">
            <Trophy className="w-20 h-20 text-answer-yellow mx-auto mb-4" />
            <h1 className="text-4xl font-black mb-2">Game Over!</h1>
            <p className="text-muted-foreground">Final Leaderboard</p>
          </div>

          <div className="bg-card rounded-2xl p-6 w-full max-w-md animate-scale-in">
            {sortedPlayers.slice(0, 5).map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg mb-2 ${
                  index === 0 ? 'bg-answer-yellow/20' :
                  index === 1 ? 'bg-muted/50' :
                  index === 2 ? 'bg-answer-yellow/10' : 'bg-muted/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-black ${
                    index === 0 ? 'text-answer-yellow' : 'text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-bold">{player.nickname}</span>
                </div>
                <span className="font-bold text-lg">{player.score.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <Button variant="outline" size="lg" onClick={() => navigate('/admin')} className="mt-8">
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  // Active Question Screen
  if (!currentQuestion) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen game-gradient flex flex-col">
      {/* Timer Bar */}
      <div className="h-2 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-1000"
          style={{ width: `${(timeLeft / currentQuestion.time_limit) * 100}%` }}
        />
      </div>

      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-card rounded-lg px-4 py-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-2xl font-black">{timeLeft}</span>
          </div>
        </div>
        <GameLogo size="sm" />
        <div className="bg-card rounded-lg px-4 py-2">
          <span className="font-bold">
            {game.current_question_index + 1} / {quiz?.questions.length || 0}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Question */}
        <div className="bg-foreground text-background rounded-2xl px-8 py-6 mb-8 max-w-3xl w-full text-center animate-scale-in">
          <h2 className="text-2xl md:text-3xl font-bold">{currentQuestion.text}</h2>
        </div>

        {/* Answers */}
        {showResults ? (
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.answers.map((answer, index) => (
                <AnswerCard
                  key={answer.id}
                  color={answerColors[index]}
                  text={answer.text}
                  size="lg"
                  showResult={answer.is_correct ? 'correct' : 'incorrect'}
                  disabled
                />
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="game" size="xl" onClick={handleNextQuestion}>
                <SkipForward className="w-5 h-5 mr-2" />
                {game.current_question_index + 1 < (quiz?.questions.length || 0) ? 'Next Question' : 'Show Results'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
            {currentQuestion.answers.map((answer, index) => (
              <AnswerCard
                key={answer.id}
                color={answerColors[index]}
                text={answer.text}
                size="lg"
                disabled
              />
            ))}
          </div>
        )}
      </main>

      {/* Player Count */}
      <footer className="p-4 flex justify-center">
        <div className="bg-card rounded-full px-6 py-2 flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span className="font-bold">{players.length} players</span>
        </div>
      </footer>
    </div>
  );
};

export default HostGame;
