import { supabase } from '@/integrations/supabase/client';

export const generateGameCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

export const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('player_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('player_session_id', sessionId);
  }
  return sessionId;
};

interface QuizData {
  id: string;
  title: string;
  questions: {
    id: string;
    type: string;
    text: string;
    media_url: string | null;
    time_limit: number;
    points: number;
    position: number;
    answers: {
      id: string;
      text: string;
      is_correct: boolean;
      order_position: number;
    }[];
  }[];
}

export const fetchQuizWithQuestions = async (quizId: string): Promise<QuizData | null> => {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle();

  if (quizError || !quiz) return null;

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('position');

  if (questionsError || !questions) return null;

  const questionsWithAnswers = await Promise.all(
    questions.map(async (q) => {
      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', q.id)
        .order('order_position');

      return {
        ...q,
        answers: answers || [],
      };
    })
  );

  return {
    ...quiz,
    questions: questionsWithAnswers,
  };
};

export const createGame = async (quizId: string, hostId: string): Promise<string | null> => {
  const gameCode = generateGameCode();

  const { data, error } = await supabase
    .from('games')
    .insert({
      quiz_id: quizId,
      game_code: gameCode,
      host_id: hostId,
      current_question_index: -1,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating game:', error);
    return null;
  }

  return data.id;
};

export const findGameByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('game_code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error finding game:', error);
    return null;
  }

  return data;
};

export const joinGame = async (gameId: string, nickname: string, sessionId: string) => {
  const { data, error } = await supabase
    .from('players')
    .insert({
      game_id: gameId,
      nickname,
      session_id: sessionId,
      score: 0,
      current_streak: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error joining game:', error);
    return null;
  }

  return data;
};

export const submitPlayerAnswer = async (
  playerId: string,
  questionId: string,
  answerId: string | null,
  answerOrder: string[] | null,
  timeSpent: number,
  isCorrect: boolean,
  pointsEarned: number
) => {
  const { error } = await supabase
    .from('player_answers')
    .upsert({
      player_id: playerId,
      question_id: questionId,
      answer_id: answerId,
      answer_order: answerOrder,
      time_spent: timeSpent,
      is_correct: isCorrect,
      points_earned: pointsEarned,
    });

  if (error) {
    console.error('Error submitting answer:', error);
    return false;
  }

  // Update player score and streak
  if (isCorrect) {
    const { data: player } = await supabase
      .from('players')
      .select('score, current_streak')
      .eq('id', playerId)
      .single();

    if (player) {
      await supabase
        .from('players')
        .update({
          score: player.score + pointsEarned,
          current_streak: player.current_streak + 1,
        })
        .eq('id', playerId);
    }
  } else {
    await supabase
      .from('players')
      .update({ current_streak: 0 })
      .eq('id', playerId);
  }

  return true;
};

export const uploadQuizMedia = async (file: File, quizId: string): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${quizId}/${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('quiz-media')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading media:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('quiz-media')
    .getPublicUrl(fileName);

  return publicUrl;
};
