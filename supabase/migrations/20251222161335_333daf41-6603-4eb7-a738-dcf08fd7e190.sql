-- Allow anyone to view questions for quizzes that have active games
CREATE POLICY "Players can view questions for active games"
ON public.questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.quiz_id = questions.quiz_id
  )
);

-- Allow anyone to view answers for questions in active games
CREATE POLICY "Players can view answers for active games"
ON public.answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM questions q
    JOIN games g ON g.quiz_id = q.quiz_id
    WHERE q.id = answers.question_id
  )
);