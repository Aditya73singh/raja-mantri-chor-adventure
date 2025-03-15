
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Info, Crown, Home } from 'lucide-react';

const Header: React.FC = () => {
  const { currentRound, totalRounds, gameStarted, resetGame } = useGame();

  return (
    <header className="w-full py-4 fixed top-0 z-10 glass">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Crown className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight hidden sm:inline-block">
              Raja Mantri Chor Sipahi
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {gameStarted && (
            <div className="px-3 py-1 glass rounded-full text-sm font-medium">
              Round {currentRound} of {totalRounds}
            </div>
          )}
          
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link to="/rules">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Info className="h-5 w-5" />
              </Button>
            </Link>
            
            {gameStarted && (
              <Button variant="outline" size="sm" onClick={resetGame} className="rounded-full">
                Reset Game
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
