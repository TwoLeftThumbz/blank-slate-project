import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Player {
  id: string;
  nickname: string;
  score: number;
  current_streak: number;
  session_id: string;
}

interface Game {
  id: string;
  quiz_id: string;
  game_code: string;
  host_id: string | null;
  current_question_index: number;
  is_active: boolean;
  started_at: string | null;
  ended_at: string | null;
}

export const useGameRealtime = (gameId: string | null) => {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch initial game data
  const fetchGame = useCallback(async () => {
    if (!gameId) return;

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();

    if (!error && data) {
      setGame(data);
    }
  }, [gameId]);

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    if (!gameId) return;

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .order('score', { ascending: false });

    if (!error && data) {
      setPlayers(data);
    }
  }, [gameId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!gameId) return;

    fetchGame();
    fetchPlayers();

    const realtimeChannel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setGame(payload.new as Game);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === (payload.new as Player).id ? (payload.new as Player) : p
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prev) =>
              prev.filter((p) => p.id !== (payload.old as Player).id)
            );
          }
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [gameId, fetchGame, fetchPlayers]);

  const updateGame = async (updates: Partial<Game>) => {
    if (!gameId) return { error: new Error('No game ID') };

    const { error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', gameId);

    return { error };
  };

  const updatePlayer = async (playerId: string, updates: Partial<Player>) => {
    const { error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId);

    return { error };
  };

  return {
    game,
    players,
    fetchGame,
    fetchPlayers,
    updateGame,
    updatePlayer,
  };
};
