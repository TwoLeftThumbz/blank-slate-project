-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Quiz',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple-choice', 'ordering')),
  text TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  time_limit INTEGER NOT NULL DEFAULT 20,
  points INTEGER NOT NULL DEFAULT 1000,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table  
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  is_correct BOOLEAN DEFAULT false,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create games table (active game sessions)
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  game_code TEXT NOT NULL UNIQUE,
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_question_index INTEGER DEFAULT -1,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table (participants in a game)
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player_answers table (tracking responses)
CREATE TABLE public.player_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.answers(id) ON DELETE SET NULL,
  answer_order JSONB, -- For ordering questions, stores the order submitted
  time_spent NUMERIC NOT NULL DEFAULT 0,
  is_correct BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (player_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes (authenticated users can CRUD their own)
CREATE POLICY "Users can view all quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own quizzes" ON public.quizzes FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- RLS Policies for questions (accessible if quiz is accessible)
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Quiz owners can manage questions" ON public.questions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND created_by = auth.uid())
);

-- RLS Policies for answers
CREATE POLICY "Anyone can view answers" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Quiz owners can manage answers" ON public.answers FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.quizzes qz ON q.quiz_id = qz.id
    WHERE q.id = question_id AND qz.created_by = auth.uid()
  )
);

-- RLS Policies for games (public for joining)
CREATE POLICY "Anyone can view active games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create games" ON public.games FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their games" ON public.games FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their games" ON public.games FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- RLS Policies for players (anyone can join)
CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone can join as a player" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their own record" ON public.players FOR UPDATE USING (session_id = session_id);

-- RLS Policies for player_answers
CREATE POLICY "Anyone can view player answers" ON public.player_answers FOR SELECT USING (true);
CREATE POLICY "Anyone can submit answers" ON public.player_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their answers" ON public.player_answers FOR UPDATE USING (true);

-- Enable realtime for games and players tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_answers;

-- Create storage bucket for quiz media
INSERT INTO storage.buckets (id, name, public) VALUES ('quiz-media', 'quiz-media', true);

-- Storage policies for quiz media
CREATE POLICY "Anyone can view quiz media" ON storage.objects FOR SELECT USING (bucket_id = 'quiz-media');
CREATE POLICY "Authenticated users can upload quiz media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'quiz-media');
CREATE POLICY "Users can update their uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'quiz-media');
CREATE POLICY "Users can delete their uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'quiz-media');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on quizzes
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster game code lookups
CREATE INDEX idx_games_game_code ON public.games(game_code);
CREATE INDEX idx_players_game_id ON public.players(game_id);
CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);