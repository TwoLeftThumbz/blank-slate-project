import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GameLogo } from '@/components/GameLogo';
import { useQuiz } from '@/context/QuizContext';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const JoinGame: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { joinGame, setCurrentPlayer, gameState } = useQuiz();
  const [gameCode, setGameCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'code' | 'nickname'>('code');

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.trim().length < 4) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid game code.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if game exists
    if (!gameState || gameState.gameCode !== gameCode.toUpperCase()) {
      toast({
        title: "Game not found",
        description: "No active game with this code. Check the code and try again.",
        variant: "destructive",
      });
      return;
    }
    
    setStep('nickname');
  };

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      toast({
        title: "Invalid nickname",
        description: "Nickname must be at least 2 characters.",
        variant: "destructive",
      });
      return;
    }

    const player = joinGame(gameCode.toUpperCase(), nickname.trim());
    if (player) {
      setCurrentPlayer(player);
      toast({
        title: "Welcome!",
        description: `You joined as ${player.nickname}`,
      });
      navigate('/play');
    } else {
      toast({
        title: "Could not join",
        description: "The game may have already started or ended.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen game-gradient flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => step === 'nickname' ? setStep('code') : navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <GameLogo size="sm" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {step === 'code' ? (
            <form onSubmit={handleCodeSubmit} className="animate-slide-up">
              <div className="text-center mb-8">
                <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h1 className="text-3xl font-black mb-2">Join a Game</h1>
                <p className="text-muted-foreground">Enter the game PIN shown on screen</p>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Game PIN"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="text-center text-2xl font-bold tracking-widest h-16"
                  maxLength={8}
                  autoFocus
                />
                <Button type="submit" variant="game" size="xl" className="w-full">
                  Enter
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleNicknameSubmit} className="animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <h1 className="text-3xl font-black mb-2">Choose a Nickname</h1>
                <p className="text-muted-foreground">This is how other players will see you</p>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-center text-xl font-bold h-14"
                  maxLength={15}
                  autoFocus
                />
                <Button type="submit" variant="game" size="xl" className="w-full">
                  Join Game!
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default JoinGame;
