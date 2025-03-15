
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGame } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import { User, UserPlus, PlayCircle, Users } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const Lobby: React.FC = () => {
  const { players, joinGame, startGame, playerName, setPlayerName } = useGame();
  const [name, setName] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      toast.error('Please enter a name');
      return;
    }
    joinGame(name);
  };

  if (playerName) {
    return (
      <div className="container mx-auto px-4 max-w-4xl animate-fade-in">
        <div className="glass rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Game Lobby</h2>
            </div>
            <Button 
              onClick={startGame} 
              disabled={players.length < 4}
              className="rounded-full"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Game
            </Button>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm text-muted-foreground mb-2">Players</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((player) => (
                <div 
                  key={player.id}
                  className={cn(
                    "glass p-4 rounded-xl border-2",
                    player.name === playerName ? "border-primary" : "border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-subtle flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {player.name} {player.name === playerName && "(You)"}
                      </h3>
                      <div className="text-xs text-muted-foreground">Ready</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground mt-6">
            Waiting for {Math.max(0, 4 - players.length)} more players...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-md animate-fade-in">
      <div className="glass rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-6">
          <UserPlus className="h-10 w-10 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-semibold">Join Game</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your name to join the game
          </p>
        </div>
        
        <form onSubmit={handleJoin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full rounded-xl"
              disabled={name.trim() === ''}
            >
              Join Game
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Lobby;
