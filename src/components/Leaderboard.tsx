import React from 'react';
import { Trophy, TrendingUp, Medal } from 'lucide-react';

interface Player {
  id: string;
  nickname: string;
  score: number;
  current_streak: number;
}

interface LeaderboardProps {
  players: Player[];
  currentPlayerId?: string;
  showTopCount?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
  players, 
  currentPlayerId,
  showTopCount = 5 
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topPlayers = sortedPlayers.slice(0, showTopCount);
  
  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-answer-yellow" />;
    if (index === 1) return <Medal className="w-6 h-6 text-muted-foreground" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRowStyle = (index: number) => {
    if (index === 0) return 'bg-answer-yellow/20 border-answer-yellow/40';
    if (index === 1) return 'bg-muted/30 border-muted/40';
    if (index === 2) return 'bg-amber-900/20 border-amber-600/40';
    return 'bg-card/50 border-border/30';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6 animate-slide-up">
        <TrendingUp className="w-10 h-10 text-primary mx-auto mb-2" />
        <h2 className="text-2xl font-black">Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {topPlayers.map((player, index) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          
          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 animate-scale-in ${getRowStyle(index)} ${
                isCurrentPlayer ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                {getMedalIcon(index) || (
                  <span className="font-black text-lg text-muted-foreground">{index + 1}</span>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${isCurrentPlayer ? 'text-primary' : ''}`}>
                  {player.nickname}
                  {isCurrentPlayer && <span className="ml-2 text-xs opacity-70">(You)</span>}
                </p>
                {player.current_streak > 1 && (
                  <p className="text-sm text-answer-yellow flex items-center gap-1">
                    🔥 {player.current_streak} streak
                  </p>
                )}
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-xl font-black">{player.score.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          );
        })}
      </div>

      {currentPlayerId && !topPlayers.some(p => p.id === currentPlayerId) && (
        <div className="mt-6 pt-4 border-t border-border/30">
          {(() => {
            const currentPlayer = sortedPlayers.find(p => p.id === currentPlayerId);
            const rank = sortedPlayers.findIndex(p => p.id === currentPlayerId) + 1;
            if (!currentPlayer) return null;
            
            return (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 animate-scale-in">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-black text-lg text-primary">{rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-primary">
                    {currentPlayer.nickname}
                    <span className="ml-2 text-xs opacity-70">(You)</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black">{currentPlayer.score.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
