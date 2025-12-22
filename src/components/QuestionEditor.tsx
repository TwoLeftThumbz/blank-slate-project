import React, { useState, useRef } from 'react';
import { Question, Answer } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnswerCard, answerColors } from '@/components/AnswerCard';
import { Check, GripVertical, Image, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuestionEditorProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onUpdate,
  onDelete,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAnswerTextChange = (answerId: string, text: string) => {
    onUpdate({
      answers: question.answers.map((a) =>
        a.id === answerId ? { ...a, text } : a
      ),
    });
  };

  const handleToggleCorrect = (answerId: string) => {
    if (question.type === 'multiple-choice') {
      onUpdate({
        answers: question.answers.map((a) =>
          a.id === answerId ? { ...a, isCorrect: !a.isCorrect } : a
        ),
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newAnswers = [...question.answers];
    const [draggedItem] = newAnswers.splice(draggedIndex, 1);
    newAnswers.splice(index, 0, draggedItem);
    
    // Update order values
    const updatedAnswers = newAnswers.map((a, i) => ({ ...a, order: i + 1 }));
    
    onUpdate({ answers: updatedAnswers });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const addAnswer = () => {
    if (question.answers.length >= 4) return;
    
    const newAnswer: Answer = {
      id: Math.random().toString(36).substring(2, 11),
      text: '',
      isCorrect: false,
      order: question.answers.length + 1,
    };
    onUpdate({ answers: [...question.answers, newAnswer] });
  };

  const removeAnswer = (answerId: string) => {
    if (question.answers.length <= 2) return;
    onUpdate({
      answers: question.answers.filter((a) => a.id !== answerId),
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image or video file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${question.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('quiz-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('quiz-media')
        .getPublicUrl(fileName);

      onUpdate({ mediaUrl: publicUrl });

      toast({
        title: 'Upload successful',
        description: 'Media added to your question.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = async () => {
    if (!question.mediaUrl) return;

    // Extract file path from URL
    try {
      const url = new URL(question.mediaUrl);
      const pathParts = url.pathname.split('/quiz-media/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from('quiz-media').remove([filePath]);
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }

    onUpdate({ mediaUrl: undefined });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Create a fake event to reuse handleFileSelect logic
      const fakeEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleFileSelect(fakeEvent);
    }
  };

  const handleDragOverMedia = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="game-gradient rounded-2xl p-6 space-y-6 animate-scale-in">
      {/* Question Type Toggle */}
      <div className="flex gap-2">
        <Button
          variant={question.type === 'multiple-choice' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onUpdate({ type: 'multiple-choice' })}
        >
          Multiple Choice
        </Button>
        <Button
          variant={question.type === 'ordering' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onUpdate({ type: 'ordering' })}
        >
          Ordering
        </Button>
      </div>

      {/* Question Text */}
      <div>
        <Input
          placeholder="Start typing your question..."
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="text-xl font-semibold bg-foreground/90 text-background placeholder:text-background/50 border-0"
        />
      </div>

      {/* Media Upload Area */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {question.mediaUrl ? (
        <div className="relative rounded-xl overflow-hidden bg-muted/30">
          {question.mediaUrl.includes('video') ? (
            <video
              src={question.mediaUrl}
              controls
              className="w-full max-h-[300px] object-contain"
            />
          ) : (
            <img
              src={question.mediaUrl}
              alt="Question media"
              className="w-full max-h-[300px] object-contain"
            />
          )}
          <button
            onClick={handleRemoveMedia}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOverMedia}
          className={cn(
            "bg-muted/30 rounded-xl p-8 flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-muted cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 text-primary mb-2 animate-spin" />
              <p className="text-muted-foreground font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground font-medium">Click or drag to upload media</p>
              <p className="text-xs text-muted-foreground mt-1">Images or videos up to 10MB</p>
            </>
          )}
        </div>
      )}

      {/* Answers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.answers.map((answer, index) => (
          <div
            key={answer.id}
            draggable={question.type === 'ordering'}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'relative group',
              draggedIndex === index && 'opacity-50'
            )}
          >
            <div className={cn(
              'flex items-stretch rounded-lg overflow-hidden',
              answerColors[index] === 'red' && 'bg-answer-red',
              answerColors[index] === 'blue' && 'bg-answer-blue',
              answerColors[index] === 'yellow' && 'bg-answer-yellow',
              answerColors[index] === 'green' && 'bg-answer-green',
            )}>
              {/* Order Number & Drag Handle (for ordering) */}
              {question.type === 'ordering' && (
                <div className="flex items-center gap-1 px-2 cursor-grab bg-foreground/20">
                  <GripVertical className="w-4 h-4 opacity-60" />
                  <span className="w-6 h-6 rounded-full bg-foreground text-background font-bold text-sm flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
              )}

              {/* Color indicator with shape */}
              <div className="w-16 flex items-center justify-center">
                <AnswerCard color={answerColors[index]} size="sm" className="w-full h-full !min-h-0 !p-0 flex items-center justify-center" />
              </div>

              {/* Answer Input */}
              <div className="flex-1 p-2">
                <Input
                  placeholder={`Add answer ${index + 1}${index >= 2 ? ' (optional)' : ''}`}
                  value={answer.text}
                  onChange={(e) => handleAnswerTextChange(answer.id, e.target.value)}
                  className="bg-foreground text-background border-0 h-10"
                />
              </div>

              {/* Correct Answer Toggle (for multiple choice) */}
              {question.type === 'multiple-choice' && (
                <button
                  onClick={() => handleToggleCorrect(answer.id)}
                  className={cn(
                    'px-3 flex items-center justify-center transition-colors',
                    answer.isCorrect ? 'bg-foreground/20' : 'bg-foreground/5 hover:bg-foreground/10'
                  )}
                >
                  <Check className={cn(
                    'w-6 h-6',
                    answer.isCorrect ? 'text-foreground' : 'text-foreground/30'
                  )} />
                </button>
              )}

              {/* Delete Answer */}
              {question.answers.length > 2 && (
                <button
                  onClick={() => removeAnswer(answer.id)}
                  className="px-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground/10"
                >
                  <Trash2 className="w-4 h-4 text-foreground/70" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Answer Button */}
      {question.answers.length < 4 && (
        <Button variant="outline" onClick={addAnswer} className="w-full">
          Add more answers
        </Button>
      )}

      {/* Question Settings */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-muted">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Time limit:</label>
          <select
            value={question.timeLimit}
            onChange={(e) => onUpdate({ timeLimit: parseInt(e.target.value) })}
            className="bg-muted rounded-lg px-3 py-2 text-sm font-medium"
          >
            <option value={10}>10 seconds</option>
            <option value={20}>20 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={120}>2 minutes</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Points:</label>
          <select
            value={question.points}
            onChange={(e) => onUpdate({ points: parseInt(e.target.value) })}
            className="bg-muted rounded-lg px-3 py-2 text-sm font-medium"
          >
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={2000}>2000</option>
          </select>
        </div>

        <Button variant="destructive" size="sm" onClick={onDelete} className="ml-auto">
          <Trash2 className="w-4 h-4 mr-1" />
          Delete Question
        </Button>
      </div>

      {question.type === 'ordering' && (
        <p className="text-sm text-muted-foreground text-center">
          Drag answers to set the correct order. They will be randomized during the game.
        </p>
      )}
    </div>
  );
};
