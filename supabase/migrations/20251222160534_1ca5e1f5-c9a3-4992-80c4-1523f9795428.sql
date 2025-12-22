-- Create storage bucket for quiz media
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-media', 'quiz-media', true);

-- Allow authenticated users to upload files to their quiz folders
CREATE POLICY "Users can upload quiz media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'quiz-media' AND
  auth.uid() IS NOT NULL
);

-- Allow anyone to view quiz media (for game players)
CREATE POLICY "Anyone can view quiz media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'quiz-media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their quiz media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'quiz-media' AND
  auth.uid() IS NOT NULL
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update their quiz media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'quiz-media' AND
  auth.uid() IS NOT NULL
);