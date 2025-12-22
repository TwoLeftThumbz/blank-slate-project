-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  time_limit INTEGER NOT NULL DEFAULT 30,
  points INTEGER NOT NULL DEFAULT 1000,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  game_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting',
  current_question_index INTEGER NOT NULL DEFAULT 0,
  question_start_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player_answers table
CREATE TABLE public.player_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.answers(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken_ms INTEGER,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;

-- Quizzes policies
CREATE POLICY "Users can view their own quizzes" ON public.quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create quizzes" ON public.quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quizzes" ON public.quizzes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quizzes" ON public.quizzes FOR DELETE USING (auth.uid() = user_id);

-- Questions policies (accessible if user owns the quiz)
CREATE POLICY "Users can view questions of their quizzes" ON public.questions FOR SELECT USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND user_id = auth.uid()));
CREATE POLICY "Users can create questions for their quizzes" ON public.questions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND user_id = auth.uid()));
CREATE POLICY "Users can update questions of their quizzes" ON public.questions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete questions of their quizzes" ON public.questions FOR DELETE USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND user_id = auth.uid()));

-- Answers policies
CREATE POLICY "Users can view answers of their quiz questions" ON public.answers FOR SELECT USING (EXISTS (SELECT 1 FROM public.questions q JOIN public.quizzes qz ON q.quiz_id = qz.id WHERE q.id = question_id AND qz.user_id = auth.uid()));
CREATE POLICY "Users can create answers for their quiz questions" ON public.answers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.questions q JOIN public.quizzes qz ON q.quiz_id = qz.id WHERE q.id = question_id AND qz.user_id = auth.uid()));
CREATE POLICY "Users can update answers of their quiz questions" ON public.answers FOR UPDATE USING (EXISTS (SELECT 1 FROM public.questions q JOIN public.quizzes qz ON q.quiz_id = qz.id WHERE q.id = question_id AND qz.user_id = auth.uid()));
CREATE POLICY "Users can delete answers of their quiz questions" ON public.answers FOR DELETE USING (EXISTS (SELECT 1 FROM public.questions q JOIN public.quizzes qz ON q.quiz_id = qz.id WHERE q.id = question_id AND qz.user_id = auth.uid()));

-- Games policies (public read for joining, host can manage)
CREATE POLICY "Anyone can view games by code" ON public.games FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create games" ON public.games FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their games" ON public.games FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their games" ON public.games FOR DELETE USING (auth.uid() = host_id);

-- Players policies (public for game participation)
CREATE POLICY "Anyone can view players in a game" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone can join as a player" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update themselves" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Players can be deleted" ON public.players FOR DELETE USING (true);

-- Player answers policies
CREATE POLICY "Anyone can view player answers" ON public.player_answers FOR SELECT USING (true);
CREATE POLICY "Anyone can submit answers" ON public.player_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Answers can be updated" ON public.player_answers FOR UPDATE USING (true);

-- Enable realtime for games and players
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();