import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GameLogo } from '@/components/GameLogo';
import { AnswerCard } from '@/components/AnswerCard';
import { Users, Crown, Zap, Trophy } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen game-gradient flex flex-col">
      {/* Header */}
      <header className="p-6">
        <GameLogo size="md" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-shadow-game">
            Create & Play Interactive Quizzes
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Engage your students with fun, competitive quiz games. Real-time scoring, 
            instant feedback, and unforgettable learning moments.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full mb-12">
          {/* Admin Card */}
          <div 
            onClick={() => navigate('/admin')}
            className="bg-card rounded-2xl p-8 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl animate-slide-up group"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">I'm an Admin</h3>
                <p className="text-muted-foreground">Create & host quizzes</p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                Create multiple choice questions
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                Add ordering/sequence puzzles
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                Host live game sessions
              </li>
            </ul>
            <Button variant="game" size="xl" className="w-full group-hover:scale-105 transition-transform">
              Create Quiz
            </Button>
          </div>

          {/* Student Card */}
          <div 
            onClick={() => navigate('/join')}
            className="bg-card rounded-2xl p-8 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl animate-slide-up group"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">I'm a Student</h3>
                <p className="text-muted-foreground">Join & play games</p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="w-4 h-4 text-accent" />
                Enter game code to join
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="w-4 h-4 text-accent" />
                Compete for top scores
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="w-4 h-4 text-accent" />
                Answer fast for bonus points
              </li>
            </ul>
            <Button variant="default" size="xl" className="w-full bg-accent hover:bg-accent/90 group-hover:scale-105 transition-transform">
              Join Game
            </Button>
          </div>
        </div>

        {/* Decorative Answer Cards */}
        <div className="flex gap-3 animate-bounce-subtle">
          {(['red', 'blue', 'yellow', 'green'] as const).map((color, i) => (
            <div key={color} style={{ animationDelay: `${i * 0.1}s` }}>
              <AnswerCard color={color} size="sm" disabled className="w-16 h-16" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
