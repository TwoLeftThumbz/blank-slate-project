import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GameLogo } from '@/components/GameLogo';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Play, ArrowLeft, Trash2, Loader2, LogOut } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  created_at: string;
  question_count: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          created_at,
          questions (id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setQuizzes(data.map(q => ({
          id: q.id,
          title: q.title,
          created_at: q.created_at,
          question_count: q.questions?.length || 0,
        })));
      }
      setLoading(false);
    };

    if (user) {
      fetchQuizzes();
    }
  }, [user]);

  const handleCreateQuiz = () => {
    navigate('/admin/create');
  };

  const handleEditQuiz = (quizId: string) => {
    navigate(`/admin/create?id=${quizId}`);
  };

  const handleDeleteQuiz = async (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    await supabase.from('quizzes').delete().eq('id', quizId);
    setQuizzes(quizzes.filter(q => q.id !== quizId));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen game-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

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
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-black mb-4">My Quizzes</h1>
          <p className="text-muted-foreground text-lg">
            Create and manage your quiz games
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

        {/* Existing Quizzes */}
        {quizzes.length > 0 ? (
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-xl font-bold mb-4">Your Quizzes</h3>
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => handleEditQuiz(quiz.id)}
                className="bg-card rounded-xl p-6 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg flex items-center justify-between"
              >
                <div>
                  <h4 className="text-lg font-bold">{quiz.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {quiz.question_count} questions · Created {new Date(quiz.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={(e) => handleDeleteQuiz(quiz.id, e)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-xl font-bold mb-4">Your Quizzes</h3>
            <div className="bg-muted/30 rounded-xl p-12 text-center">
              <p className="text-muted-foreground">
                No quizzes yet. Create your first one to get started!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
