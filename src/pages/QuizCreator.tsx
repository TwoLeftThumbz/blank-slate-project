import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GameLogo } from '@/components/GameLogo';
import { QuestionEditor } from '@/components/QuestionEditor';
import { useQuiz } from '@/context/QuizContext';
import { Question, Answer } from '@/types/quiz';
import { Plus, Play, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QuizCreator: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentQuiz, setCurrentQuiz, addQuestion, updateQuestion, deleteQuestion, startGame } = useQuiz();
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  if (!currentQuiz) {
    navigate('/admin');
    return null;
  }

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
    addQuestion(newQuestion);
    setSelectedQuestionIndex(currentQuiz.questions.length);
  };

  const handleUpdateQuestion = (updates: Partial<Question>) => {
    const question = currentQuiz.questions[selectedQuestionIndex];
    if (question) {
      updateQuestion(question.id, updates);
    }
  };

  const handleDeleteQuestion = () => {
    const question = currentQuiz.questions[selectedQuestionIndex];
    if (question) {
      deleteQuestion(question.id);
      setSelectedQuestionIndex(Math.max(0, selectedQuestionIndex - 1));
    }
  };

  const handleStartGame = () => {
    if (currentQuiz.questions.length === 0) {
      toast({
        title: "No questions",
        description: "Add at least one question before starting the game.",
        variant: "destructive",
      });
      return;
    }

    // Validate questions
    const invalidQuestions = currentQuiz.questions.filter((q) => {
      const hasText = q.text.trim().length > 0;
      const hasAnswers = q.answers.filter((a) => a.text.trim().length > 0).length >= 2;
      const hasCorrect = q.type === 'multiple-choice' ? q.answers.some((a) => a.isCorrect) : true;
      return !hasText || !hasAnswers || !hasCorrect;
    });

    if (invalidQuestions.length > 0) {
      toast({
        title: "Invalid questions",
        description: "Make sure all questions have text, at least 2 answers, and a correct answer marked.",
        variant: "destructive",
      });
      return;
    }

    const gameCode = startGame(currentQuiz);
    navigate('/admin/host');
  };

  const selectedQuestion = currentQuiz.questions[selectedQuestionIndex];

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
          {currentQuiz.questions.map((question, index) => (
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
            value={currentQuiz.title}
            onChange={(e) => setCurrentQuiz({ ...currentQuiz, title: e.target.value })}
            placeholder="Quiz Title"
            className="max-w-xs text-lg font-bold bg-transparent border-0 focus-visible:ring-0"
          />
          <div className="flex gap-2">
            <Button variant="outline">
              <Save className="w-4 h-4 mr-2" />
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
