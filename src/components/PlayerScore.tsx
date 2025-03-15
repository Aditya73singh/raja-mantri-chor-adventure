
import React from 'react';
import { cn } from '@/lib/utils';
import { Player, RoleType } from '@/contexts/GameContext';
import { User } from 'lucide-react';

interface PlayerScoreProps {
  player: Player;
  isCurrentPlayer?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

const PlayerScore: React.FC<PlayerScoreProps> = ({
  player,
  isCurrentPlayer = false,
  onSelect,
  selectable = false,
}) => {
  const getRoleColor = (role?: RoleType): string => {
    if (!role || !player.isRevealed) return '';
    
    switch (role) {
      case 'Raja':
        return 'border-game-raja';
      case 'Mantri':
        return 'border-game-mantri';
      case 'Chor':
        return 'border-game-chor';
      case 'Sipahi':
        return 'border-game-sipahi';
      default:
        return '';
    }
  };

  return (
    <div 
      className={cn(
        "glass p-4 rounded-2xl transition-all duration-300 border-2",
        isCurrentPlayer ? "border-primary" : "border-transparent",
        player.isRevealed && getRoleColor(player.currentRole),
        selectable && "cursor-pointer hover:shadow-md hover:scale-105",
      )}
      onClick={selectable ? onSelect : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-subtle flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm leading-none mb-1">
            {player.name} {isCurrentPlayer && "(You)"}
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-muted-foreground">
              Score: {player.score}
            </div>
            {player.isRevealed && player.currentRole && (
              <div className="text-xs bg-accent px-2 py-0.5 rounded-full">
                {player.currentRole}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerScore;
