import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuestionEditor } from '@/components/QuestionEditor';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createGame } from '@/lib/gameUtils';
import { Question, Answer } from '@/types/quiz';
import { Plus, Play, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QuizCreator: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [quizId, setQuizId] = useState<string | null>(searchParams.get('id'));
  const [quizTitle, setQuizTitle] = useState('Untitled Quiz');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load existing quiz or create new one
  useEffect(() => {
    const initQuiz = async () => {
      if (!user) return;

      if (quizId) {
        // Load existing quiz
        const { data: quiz } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .maybeSingle();

        if (quiz) {
          setQuizTitle(quiz.title);

          // Load questions
          const { data: dbQuestions } = await supabase
            .from('questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('order_index');

          if (dbQuestions) {
            const questionsWithAnswers: Question[] = await Promise.all(
              dbQuestions.map(async (q) => {
                const { data: dbAnswers } = await supabase
                  .from('answers')
                  .select('*')
                  .eq('question_id', q.id)
                  .order('order_index');

                return {
                  id: q.id,
                  type: q.question_type as 'multiple-choice' | 'ordering',
                  text: q.question_text,
                  mediaUrl: undefined,
                  timeLimit: q.time_limit,
                  points: q.points,
                  answers: (dbAnswers || []).map((a) => ({
                    id: a.id,
                    text: a.answer_text,
                    isCorrect: a.is_correct || false,
                    order: a.order_index || 0,
                  })),
                };
              })
            );
            setQuestions(questionsWithAnswers);
          }
        }
      } else {
        // Create new quiz
        const { data: newQuiz, error } = await supabase
          .from('quizzes')
          .insert({
            title: 'Untitled Quiz',
            user_id: user.id,
          })
          .select()
          .single();

        if (!error && newQuiz) {
          setQuizId(newQuiz.id);
          // Update URL without navigation
          window.history.replaceState(null, '', `/admin/create?id=${newQuiz.id}`);
        }
      }
      setLoading(false);
    };

    if (!authLoading && user) {
      initQuiz();
    }
  }, [quizId, user, authLoading]);

  const saveQuiz = useCallback(async () => {
    if (!quizId || !user) return;

    setSaving(true);

    // Update quiz title
    await supabase
      .from('quizzes')
      .update({ title: quizTitle })
      .eq('id', quizId);

    // Delete existing questions (answers will cascade delete)
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId);

    // Insert all questions and answers
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      const { data: newQuestion } = await supabase
        .from('questions')
        .insert({
          quiz_id: quizId,
          question_type: q.type,
          question_text: q.text,
          time_limit: q.timeLimit,
          points: q.points,
          order_index: i,
        })
        .select()
        .single();

      if (newQuestion) {
        // Update question ID for local state
        questions[i].id = newQuestion.id;

        // Insert answers
        for (let j = 0; j < q.answers.length; j++) {
          const a = q.answers[j];
          await supabase
            .from('answers')
            .insert({
              question_id: newQuestion.id,
              answer_text: a.text,
              is_correct: a.isCorrect || false,
              order_index: a.order || j,
            });
        }
      }
    }

    setSaving(false);
    toast({
      title: 'Saved!',
      description: 'Your quiz has been saved.',
    });
  }, [quizId, quizTitle, questions, user, toast]);

  const createNewQuestion = (): Question => {
    const defaultAnswers: Answer[] = [
      { id: crypto.randomUUID(), text: '', isCorrect: false, order: 1 },
      { id: crypto.randomUUID(), text: '', isCorrect: false, order: 2 },
    ];

    return {
      id: crypto.randomUUID(),
      type: 'multiple-choice',
      text: '',
      answers: defaultAnswers,
      timeLimit: 20,
      points: 1000,
    };
  };

  const handleAddQuestion = () => {
    const newQuestion = createNewQuestion();
    setQuestions([...questions, newQuestion]);
    setSelectedQuestionIndex(questions.length);
  };

  const handleUpdateQuestion = (updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[selectedQuestionIndex] = {
      ...newQuestions[selectedQuestionIndex],
      ...updates,
    };
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = () => {
    const newQuestions = questions.filter((_, i) => i !== selectedQuestionIndex);
    setQuestions(newQuestions);
    setSelectedQuestionIndex(Math.max(0, selectedQuestionIndex - 1));
  };

  const handleStartGame = async () => {
    if (questions.length === 0) {
      toast({
        title: 'No questions',
        description: 'Add at least one question before starting the game.',
        variant: 'destructive',
      });
      return;
    }

    // Validate questions
    const invalidQuestions = questions.filter((q) => {
      const hasText = q.text.trim().length > 0;
      const hasAnswers = q.answers.filter((a) => a.text.trim().length > 0).length >= 2;
      const hasCorrect = q.type === 'multiple-choice' ? q.answers.some((a) => a.isCorrect) : true;
      return !hasText || !hasAnswers || !hasCorrect;
    });

    if (invalidQuestions.length > 0) {
      toast({
        title: 'Invalid questions',
        description: 'Make sure all questions have text, at least 2 answers, and a correct answer marked.',
        variant: 'destructive',
      });
      return;
    }

    // Save first
    await saveQuiz();

    // Create game
    if (!user || !quizId) return;
    
    const gameId = await createGame(quizId, user.id);
    if (gameId) {
      navigate(`/admin/host?gameId=${gameId}`);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to start game. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const selectedQuestion = questions[selectedQuestionIndex];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Question List */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-bold">Quiz</span>
        </div>

        {/* Question Thumbnails */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => setSelectedQuestionIndex(index)}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                selectedQuestionIndex === index
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-sidebar-accent hover:bg-sidebar-accent/80'
              }`}
            >
              <div className="text-xs opacity-70 mb-1">
                {question.type === 'multiple-choice' ? 'Question' : 'Puzzle'}
              </div>
              <div className="text-sm font-medium truncate">
                {question.text || `Question ${index + 1}`}
              </div>
            </button>
          ))}
        </div>

        {/* Add Question Button */}
        <Button onClick={handleAddQuestion} className="w-full mt-4">
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-border flex items-center justify-between">
          <Input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Quiz Title"
            className="max-w-xs text-lg font-bold bg-transparent border-0 focus-visible:ring-0"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveQuiz} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
            <Button variant="game" onClick={handleStartGame}>
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </div>
        </header>

        {/* Question Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedQuestion ? (
            <QuestionEditor
              question={selectedQuestion}
              onUpdate={handleUpdateQuestion}
              onDelete={handleDeleteQuestion}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Plus className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No questions yet</h2>
              <p className="text-muted-foreground mb-6">
                Click "Add" to create your first question
              </p>
              <Button onClick={handleAddQuestion} variant="game" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Question
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuizCreator;
