import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GameLogo } from '@/components/GameLogo';
import { Input } from '@/components/ui/input';
import { useQuiz } from '@/context/QuizContext';
import { Quiz } from '@/types/quiz';
import { Plus, Play, ArrowLeft } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentQuiz } = useQuiz();

  const handleCreateQuiz = () => {
    const newQuiz: Quiz = {
      id: Math.random().toString(36).substring(2, 11),
      title: 'Untitled Quiz',
      questions: [],
      createdAt: new Date(),
    };
    setCurrentQuiz(newQuiz);
    navigate('/admin/create');
  };

  return (
    <div className="min-h-screen game-gradient">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <GameLogo size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-black mb-4">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Create engaging quizzes for your students
          </p>
        </div>

        {/* Create New Quiz Card */}
        <div 
          onClick={handleCreateQuiz}
          className="bg-card rounded-2xl p-8 mb-8 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl animate-scale-in"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-primary flex items-center justify-center">
                <Plus className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Create New Quiz</h2>
                <p className="text-muted-foreground">
                  Start from scratch with multiple choice and ordering questions
                </p>
              </div>
            </div>
            <Button variant="game" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create
            </Button>
          </div>
        </div>

        {/* Recent Quizzes (placeholder) */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xl font-bold mb-4">Recent Quizzes</h3>
          <div className="bg-muted/30 rounded-xl p-12 text-center">
            <p className="text-muted-foreground">
              Your created quizzes will appear here. Create your first quiz to get started!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
