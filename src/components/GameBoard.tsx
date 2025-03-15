
import React, { useState } from 'react';
import { useGame, Player, RoleType } from '@/contexts/GameContext';
import GameCard from './GameCard';
import PlayerScore from './PlayerScore';
import { Button } from '@/components/ui/button';
import { toast } from "@/lib/toast-helpers";
import { Search, Check, Crown } from 'lucide-react';

const GameBoard: React.FC = () => {
  const { 
    players, 
    currentPlayer, 
    makeGuess, 
    currentRound, 
    totalRounds, 
    gameEnded 
  } = useGame();
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Find the players with specific roles
  const rajaPlayer = players.find(p => p.currentRole === 'Raja');
  const sipahiPlayer = players.find(p => p.currentRole === 'Sipahi');
  const isSipahi = currentPlayer?.currentRole === 'Sipahi';
  
  // Determine if all roles are revealed (round ended)
  const allRevealed = players.every(p => p.isRevealed);
  
  const handleMakeGuess = () => {
    if (!selectedPlayerId) {
      toast.error("Please select a player to guess");
      return;
    }
    
    if (selectedPlayerId === currentPlayer?.id) {
      toast.error("You cannot guess yourself");
      return;
    }
    
    makeGuess(selectedPlayerId);
    setSelectedPlayerId(null);
  };
  
  // Show winner at the end of the game
  if (gameEnded) {
    const winner = [...players].sort((a, b) => b.score - a.score)[0];
    
    return (
      <div className="container mx-auto px-4 max-w-2xl animate-fade-in">
        <div className="glass rounded-2xl p-8 shadow-lg text-center">
          <Crown className="h-16 w-16 text-game-raja mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
          <p className="text-lg mb-6">
            {winner.name} wins with {winner.score} points!
          </p>
          
          <div className="space-y-3 mb-8">
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-3 glass rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-sm">
                      {index + 1}
                    </div>
                    <span>{player.name}</span>
                  </div>
                  <span className="font-semibold">{player.score} pts</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 max-w-5xl animate-fade-in">
      {/* Game round info */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full">
          <span className="text-sm font-medium">Round {currentRound} of {totalRounds}</span>
        </div>
      </div>
      
      {/* Players revealed section (Raja and Sipahi) */}
      {(rajaPlayer || sipahiPlayer) && (
        <div className="mb-8">
          <h3 className="text-sm text-muted-foreground mb-3 px-1">Revealed Roles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rajaPlayer && (
              <div className="glass p-4 rounded-2xl border-2 border-game-raja">
                <div className="flex items-center gap-4">
                  <GameCard 
                    role="Raja" 
                    isRevealed={true} 
                    className="scale-75 origin-left"
                  />
                  <div>
                    <h3 className="font-semibold">{rajaPlayer.name}</h3>
                    <div className="text-xs bg-game-raja text-white px-2 py-0.5 rounded-full inline-block mt-1">
                      Raja
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {sipahiPlayer && (
              <div className="glass p-4 rounded-2xl border-2 border-game-sipahi">
                <div className="flex items-center gap-4">
                  <GameCard 
                    role="Sipahi" 
                    isRevealed={true} 
                    className="scale-75 origin-left"
                  />
                  <div>
                    <h3 className="font-semibold">{sipahiPlayer.name}</h3>
                    <div className="text-xs bg-game-sipahi text-white px-2 py-0.5 rounded-full inline-block mt-1">
                      Sipahi
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Player's role card */}
      <div className="mb-8 flex flex-col items-center">
        <h3 className="text-sm text-muted-foreground mb-3">Your Role</h3>
        <GameCard 
          role={currentPlayer?.currentRole} 
          isRevealed={!!currentPlayer?.currentRole}
        />
      </div>
      
      {/* Other players section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-muted-foreground px-1">Players</h3>
          
          {/* Sipahi guessing controls */}
          {isSipahi && !allRevealed && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Select a player to guess as Chor
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                disabled={!selectedPlayerId}
                onClick={handleMakeGuess}
              >
                <Check className="h-4 w-4 mr-1" />
                Confirm
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.map((player) => (
            <PlayerScore
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayer?.id}
              selectable={isSipahi && !allRevealed && player.id !== currentPlayer?.id}
              onSelect={() => isSipahi && !allRevealed && setSelectedPlayerId(player.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Round end message */}
      {allRevealed && currentRound < totalRounds && (
        <div className="text-center p-4 glass rounded-2xl animate-fade-in">
          <p className="text-sm">
            Round {currentRound} has ended. Next round will start soon...
          </p>
        </div>
      )}
      
      {/* Sipahi instructions */}
      {isSipahi && !allRevealed && (
        <div className="fixed bottom-4 left-0 right-0 mx-auto w-max">
          <div className="glass px-4 py-3 rounded-full flex items-center gap-2 animate-slide-up shadow-lg">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Find the Chor by selecting a player</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
