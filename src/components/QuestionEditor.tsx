import React, { useState } from 'react';
import { Question, Answer, QuestionType } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnswerCard, answerColors } from '@/components/AnswerCard';
import { Check, GripVertical, Image, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <div className="bg-muted/30 rounded-xl p-8 flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-muted">
        <Image className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground font-medium">Find and insert media</p>
        <button className="text-primary underline font-semibold mt-1">
          Upload file
        </button>
      </div>

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
              {/* Drag Handle (for ordering) */}
              {question.type === 'ordering' && (
                <div className="flex items-center px-2 cursor-grab opacity-60 hover:opacity-100">
                  <GripVertical className="w-5 h-5" />
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
