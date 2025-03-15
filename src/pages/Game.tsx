
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Lobby from '@/components/Lobby';
import GameBoard from '@/components/GameBoard';
import { useGame } from '@/contexts/GameContext';

const Game: React.FC = () => {
  const { gameStarted, joinGame, playerName } = useGame();
  const [searchParams] = useSearchParams();
  
  // Check for gameId in URL parameters
  useEffect(() => {
    const gameId = searchParams.get('id');
    
    // If there's a gameId in the URL and user is not already in a game,
    // show a prompt to enter name and join
    if (gameId && !playerName) {
      const name = localStorage.getItem('playerName');
      if (name) {
        joinGame(name, gameId);
      }
    }
  }, [searchParams, joinGame, playerName]);

  return (
    <div className="min-h-screen bg-gradient-radial from-blue-50 to-white pt-20 pb-10">
      <Header />
      {gameStarted ? <GameBoard /> : <Lobby />}
    </div>
  );
};

export default Game;
