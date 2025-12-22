import React, { useState, useEffect } from 'react';
import { GripVertical, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Answer {
  id: string;
  answer_text: string;
  order_index: number;
}

interface OrderingQuestionProps {
  answers: Answer[];
  onSubmit: (orderedIds: string[]) => void;
  disabled?: boolean;
  showResults?: boolean;
}

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const OrderingQuestion: React.FC<OrderingQuestionProps> = ({
  answers,
  onSubmit,
  disabled = false,
  showResults = false,
}) => {
  const [orderedAnswers, setOrderedAnswers] = useState<Answer[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Shuffle answers on mount
  useEffect(() => {
    if (showResults) {
      // Show in correct order for results
      setOrderedAnswers([...answers].sort((a, b) => a.order_index - b.order_index));
    } else {
      setOrderedAnswers(shuffleArray(answers));
    }
  }, [answers, showResults]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled || submitted) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || disabled || submitted) return;

    const newOrder = [...orderedAnswers];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setOrderedAnswers(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleTouchStart = (index: number) => {
    if (disabled || submitted) return;
    setDraggedIndex(index);
  };

  const handleMoveUp = (index: number) => {
    if (disabled || submitted || index === 0) return;
    const newOrder = [...orderedAnswers];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedAnswers(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (disabled || submitted || index === orderedAnswers.length - 1) return;
    const newOrder = [...orderedAnswers];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedAnswers(newOrder);
  };

  const handleSubmit = () => {
    if (disabled || submitted) return;
    setSubmitted(true);
    onSubmit(orderedAnswers.map(a => a.id));
  };

  const isCorrectPosition = (answer: Answer, index: number) => {
    return answer.order_index === index;
  };

  const colors = [
    'bg-answer-red',
    'bg-answer-blue', 
    'bg-answer-yellow',
    'bg-answer-green',
    'bg-answer-purple',
    'bg-answer-orange',
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="text-center text-muted-foreground mb-4">
        {showResults ? 'Correct order:' : 'Drag to reorder, then submit'}
      </p>
      
      <div className="space-y-3">
        {orderedAnswers.map((answer, index) => (
          <div
            key={answer.id}
            draggable={!disabled && !submitted && !showResults}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl transition-all duration-200',
              colors[index % colors.length],
              draggedIndex === index && 'opacity-50 scale-105',
              !disabled && !submitted && !showResults && 'cursor-grab active:cursor-grabbing',
              showResults && isCorrectPosition(answer, index) && 'ring-4 ring-green-400',
              showResults && !isCorrectPosition(answer, index) && 'ring-4 ring-red-400'
            )}
          >
            {!showResults && !submitted && (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || disabled}
                  className="p-1 hover:bg-foreground/10 rounded disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === orderedAnswers.length - 1 || disabled}
                  className="p-1 hover:bg-foreground/10 rounded disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
            )}
            
            <GripVertical className={cn(
              "w-5 h-5 text-foreground/60 flex-shrink-0",
              (showResults || submitted) && "hidden"
            )} />
            
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground/20 flex items-center justify-center font-bold">
              {index + 1}
            </span>
            
            <span className="flex-1 font-bold text-lg">{answer.answer_text}</span>
            
            {showResults && (
              <span className={cn(
                "text-sm font-medium px-2 py-1 rounded",
                isCorrectPosition(answer, index) ? "bg-green-500/30" : "bg-red-500/30"
              )}>
                {isCorrectPosition(answer, index) ? '✓' : `Should be #${answer.order_index + 1}`}
              </span>
            )}
          </div>
        ))}
      </div>

      {!showResults && !submitted && !disabled && (
        <Button
          variant="game"
          size="xl"
          onClick={handleSubmit}
          className="w-full mt-6"
        >
          <Check className="w-5 h-5 mr-2" />
          Submit Order
        </Button>
      )}

      {submitted && !showResults && (
        <div className="text-center mt-6 animate-scale-in">
          <p className="text-xl font-bold text-muted-foreground">Answer submitted!</p>
          <p className="text-muted-foreground">Waiting for results...</p>
        </div>
      )}
    </div>
  );
};
