
import React from 'react';
import Header from '@/components/Header';
import Lobby from '@/components/Lobby';
import GameBoard from '@/components/GameBoard';
import { useGame } from '@/contexts/GameContext';

const Game: React.FC = () => {
  const { gameStarted } = useGame();

  return (
    <div className="min-h-screen bg-gradient-radial from-blue-50 to-white pt-20 pb-10">
      <Header />
      {gameStarted ? <GameBoard /> : <Lobby />}
    </div>
  );
};

export default Game;
