-- Add media_url column to questions table
ALTER TABLE public.questions 
ADD COLUMN media_url text;

-- Allow players to view quizzes for active games
CREATE POLICY "Players can view quizzes for active games"
ON public.quizzes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.quiz_id = quizzes.id
  )
);