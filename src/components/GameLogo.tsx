import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface GameLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const GameLogo: React.FC<GameLogoProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  };

  return (
    <Link to="/">
      <button>
    <div className={cn('flex items-center gap-2', className)}>
      <h1 className={cn(
        'font-black tracking-tight text-shadow-game',
        sizeClasses[size]
      )}>
        <span className="text-answer-red">Q</span>
        <span className="text-answer-blue">u</span>
        <span className="text-answer-yellow">i</span>
        <span className="text-answer-green">z</span>
        <span className="text-primary">Blast</span>
      </h1>
    </div>
    </button>
    </Link>
  );
};
