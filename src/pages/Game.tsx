
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Lobby from '@/components/Lobby';
import GameBoard from '@/components/GameBoard';
import { useGame } from '@/contexts/GameContext';
import { socketService } from '@/services/socket';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff } from 'lucide-react';

const Game: React.FC = () => {
  const { gameStarted, joinGame, playerName } = useGame();
  const [searchParams] = useSearchParams();
  const [connectionError, setConnectionError] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Function to check connection and update state
  const checkConnection = () => {
    const isConnected = socketService.isConnected();
    setConnectionError(!isConnected);
    if (isConnected && reconnecting) {
      setReconnecting(false);
    }
    return isConnected;
  };
  
  // Handle manual reconnection
  const handleReconnect = () => {
    setReconnecting(true);
    setConnectionAttempts(prev => prev + 1);
    
    if (socketService.reconnect()) {
      // Give a moment for the connection to establish
      setTimeout(() => {
        const connected = checkConnection();
        if (!connected) {
          setReconnecting(false);
        }
      }, 5000);
    } else {
      setReconnecting(false);
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
    
    // Initial connection attempt
    if (!socketService.isConnected()) {
      handleReconnect();
    }
    
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
            <WifiOff className="h-5 w-5 mb-2" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              There was a problem connecting to the game server. This might be due to server maintenance or network issues.
              <br />
              <span className="text-xs text-gray-600 mt-1 block">
                Note: The server is hosted on a free tier which may take a moment to wake up if it has been inactive.
                {connectionAttempts > 0 && ` (${connectionAttempts} reconnection attempts made)`}
              </span>
            </AlertDescription>
            <div className="mt-3">
              <Button 
                variant="outline" 
                onClick={handleReconnect}
                disabled={reconnecting}
                className="bg-white hover:bg-gray-100"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${reconnecting ? 'animate-spin' : ''}`} />
                {reconnecting ? 'Reconnecting...' : 'Reconnect'}
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
