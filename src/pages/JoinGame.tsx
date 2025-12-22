import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GameLogo } from '@/components/GameLogo';
import { findGameByCode, joinGame, getOrCreateSessionId } from '@/lib/gameUtils';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const JoinGame: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameCode, setGameCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'code' | 'nickname'>('code');
  const [gameId, setGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.trim().length < 4) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid game code.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    const game = await findGameByCode(gameCode);
    setLoading(false);

    if (!game) {
      toast({
        title: "Game not found",
        description: "No active game with this code. Check the code and try again.",
        variant: "destructive",
      });
      return;
    }

    if (game.current_question_index !== -1) {
      toast({
        title: "Game already started",
        description: "This game has already started. Wait for the next one!",
        variant: "destructive",
      });
      return;
    }
    
    setGameId(game.id);
    setStep('nickname');
  };

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      toast({
        title: "Invalid nickname",
        description: "Nickname must be at least 2 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!gameId) return;

    setLoading(true);
    const sessionId = getOrCreateSessionId();
    const player = await joinGame(gameId, nickname.trim(), sessionId);
    setLoading(false);

    if (player) {
      // Store player info in session storage for the play page
      sessionStorage.setItem('player_id', player.id);
      sessionStorage.setItem('player_nickname', player.nickname);
      sessionStorage.setItem('game_id', gameId);
      
      toast({
        title: "Welcome!",
        description: `You joined as ${player.nickname}`,
      });
      navigate(`/play?gameId=${gameId}&playerId=${player.id}`);
    } else {
      toast({
        title: "Could not join",
        description: "Something went wrong. Please try again.",
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
                <Button type="submit" variant="game" size="xl" className="w-full" disabled={loading}>
                  {loading ? 'Checking...' : 'Enter'}
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
                <Button type="submit" variant="game" size="xl" className="w-full" disabled={loading}>
                  {loading ? 'Joining...' : 'Join Game!'}
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
