
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RoleType } from '@/contexts/GameContext';

interface GameCardProps {
  role?: RoleType;
  isRevealed: boolean;
  onClick?: () => void;
  className?: string;
  selectable?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({
  role,
  isRevealed,
  onClick,
  className,
  selectable = false,
}) => {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (isRevealed) {
      const timer = setTimeout(() => {
        setFlipped(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFlipped(false);
    }
  }, [isRevealed]);

  const getRoleColor = (role?: RoleType): string => {
    switch (role) {
      case 'Raja':
        return 'bg-game-raja text-white';
      case 'Mantri':
        return 'bg-game-mantri text-white';
      case 'Chor':
        return 'bg-game-chor text-white';
      case 'Sipahi':
        return 'bg-game-sipahi text-white';
      default:
        return 'bg-white';
    }
  };

  const getRoleIcon = (role?: RoleType): string => {
    switch (role) {
      case 'Raja':
        return '👑';
      case 'Mantri':
        return '📜';
      case 'Chor':
        return '🎭';
      case 'Sipahi':
        return '🛡️';
      default:
        return '❓';
    }
  };

  const getRolePoints = (role?: RoleType): number => {
    switch (role) {
      case 'Raja':
        return 800;
      case 'Mantri':
        return 900;
      case 'Chor':
        return 0;
      case 'Sipahi':
        return 1000;
      default:
        return 0;
    }
  };

  const handleClick = () => {
    if (onClick && (selectable || !flipped)) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "role-card",
        flipped && "flipped",
        selectable && !flipped && "cursor-pointer hover:scale-105 transition-transform",
        className
      )}
      onClick={handleClick}
    >
      <div className="role-card-inner">
        {/* Card Front */}
        <div className="role-card-front glass flex items-center justify-center shadow-lg">
          <div className="text-4xl animate-float">?</div>
        </div>

        {/* Card Back */}
        <div className={cn("role-card-back shadow-lg", getRoleColor(role))}>
          <div className="h-full w-full flex flex-col items-center justify-center p-2">
            <div className="text-3xl mb-2">{getRoleIcon(role)}</div>
            <div className="text-lg font-bold mb-1">{role || "Unknown"}</div>
            <div className="text-xs font-medium">Points: {getRolePoints(role)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
