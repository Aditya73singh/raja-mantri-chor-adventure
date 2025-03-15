
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Lobby from '@/components/Lobby';
import GameBoard from '@/components/GameBoard';
import { useGame } from '@/contexts/GameContext';
import { socketService } from '@/services/socket';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const Game: React.FC = () => {
  const { gameStarted, joinGame, playerName } = useGame();
  const [searchParams] = useSearchParams();
  const [connectionError, setConnectionError] = useState(false);
  
  // Function to check connection and update state
  const checkConnection = () => {
    const isConnected = socketService.isConnected();
    setConnectionError(!isConnected);
    return isConnected;
  };
  
  // Handle manual reconnection
  const handleReconnect = () => {
    if (socketService.reconnect()) {
      // Give a moment for the connection to establish
      setTimeout(checkConnection, 1000);
    }
  };
  
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
    
    // Initial connection check
    checkConnection();
    
    // Set up connection checking interval
    const interval = setInterval(checkConnection, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [searchParams, joinGame, playerName]);

  return (
    <div className="min-h-screen bg-gradient-radial from-blue-50 to-white pt-20 pb-10">
      <Header />
      
      {connectionError && (
        <div className="max-w-md mx-auto mt-4 mb-4">
          <Alert variant="destructive" className="bg-red-100">
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              There was a problem connecting to the game server. This might be due to server maintenance or network issues.
            </AlertDescription>
            <div className="mt-3">
              <Button 
                variant="outline" 
                onClick={handleReconnect}
                className="bg-white hover:bg-gray-100"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
            </div>
          </Alert>
        </div>
      )}
      
      {gameStarted ? <GameBoard /> : <Lobby />}
    </div>
  );
};

export default Game;
