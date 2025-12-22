import React from 'react';
import { cn } from '@/lib/utils';
import { Triangle, Diamond, Circle, Square } from 'lucide-react';

type AnswerColor = 'red' | 'blue' | 'yellow' | 'green';

interface AnswerCardProps {
  color: AnswerColor;
  text?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showResult?: 'correct' | 'incorrect' | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses: Record<AnswerColor, string> = {
  red: 'bg-answer-red hover:bg-answer-red/90',
  blue: 'bg-answer-blue hover:bg-answer-blue/90',
  yellow: 'bg-answer-yellow hover:bg-answer-yellow/90',
  green: 'bg-answer-green hover:bg-answer-green/90',
};

const ShapeIcon: React.FC<{ color: AnswerColor; className?: string }> = ({ color, className }) => {
  const iconClass = cn('text-foreground', className);
  
  switch (color) {
    case 'red':
      return <Triangle className={iconClass} fill="currentColor" />;
    case 'blue':
      return <Diamond className={iconClass} fill="currentColor" />;
    case 'yellow':
      return <Circle className={iconClass} fill="currentColor" />;
    case 'green':
      return <Square className={iconClass} fill="currentColor" />;
  }
};

export const AnswerCard: React.FC<AnswerCardProps> = ({
  color,
  text,
  onClick,
  selected = false,
  disabled = false,
  showResult = null,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'p-3 min-h-[60px]',
    md: 'p-4 min-h-[80px]',
    lg: 'p-6 min-h-[120px]',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'answer-card flex items-center gap-4 w-full',
        colorClasses[color],
        sizeClasses[size],
        selected && 'ring-4 ring-foreground ring-offset-2 ring-offset-background',
        showResult === 'correct' && 'ring-4 ring-green-400',
        showResult === 'incorrect' && 'opacity-50',
        disabled && 'cursor-not-allowed opacity-70 hover:scale-100',
        className
      )}
    >
      <div className="flex-shrink-0">
        <ShapeIcon color={color} className={iconSizes[size]} />
      </div>
      {text && (
        <span className={cn(
          'font-bold text-foreground text-left flex-1',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-xl'
        )}>
          {text}
        </span>
      )}
    </button>
  );
};

export const answerColors: AnswerColor[] = ['red', 'blue', 'yellow', 'green'];
