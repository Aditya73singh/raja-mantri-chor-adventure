
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Lobby from '@/components/Lobby';
import GameBoard from '@/components/GameBoard';
import { useGame } from '@/contexts/GameContext';
import { socketService } from '@/services/socket';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff, Wifi, Server } from 'lucide-react';

const Game: React.FC = () => {
  const { gameStarted, joinGame, playerName } = useGame();
  const [searchParams] = useSearchParams();
  const [connectionError, setConnectionError] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    currentServer: 1,
    totalServers: 4,
    reconnectAttempts: 0,
    inLocalMode: false
  });
  
  // Function to check connection and update state
  const checkConnection = useCallback(() => {
    const isConnected = socketService.isConnected();
    const status = socketService.getServerStatus();
    
    setConnectionError(!isConnected);
    setConnectionStatus(status);
    
    if (isConnected && reconnecting) {
      setReconnecting(false);
    }
    return isConnected;
  }, [reconnecting]);
  
  // Handle manual reconnection
  const handleReconnect = useCallback(() => {
    setReconnecting(true);
    
    // Reset server cycle to start fresh
    socketService.resetServerCycle();
    
    if (socketService.reconnect()) {
      // Give a moment for the connection to establish
      setTimeout(() => {
        const connected = checkConnection();
        if (!connected) {
          setReconnecting(false);
        }
      }, 8000); // Longer timeout for free tier servers
    } else {
      setReconnecting(false);
    }
  }, [checkConnection]);
  
  // Check for gameId in URL parameters and handle connection
  useEffect(() => {
    const gameId = searchParams.get('id');
    
    // If there's a gameId in the URL and user is not already in a game,
    // attempt to join with stored name or wait for name input
    if (gameId && !playerName) {
      const name = localStorage.getItem('playerName');
      if (name) {
        joinGame(name, gameId);
      }
    }
    
    // Initial connection check
    checkConnection();
    
    // Initial connection attempt if needed
    if (!socketService.isConnected()) {
      setReconnecting(true);
      if (socketService.reconnect()) {
        setTimeout(() => {
          const connected = checkConnection();
          setReconnecting(!connected);
        }, 8000);
      } else {
        setReconnecting(false);
      }
    }
    
    // Set up connection checking interval
    const interval = setInterval(() => {
      checkConnection();
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [searchParams, joinGame, playerName, checkConnection]);

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
              <div className="mt-2 text-xs text-gray-600">
                <p>Note: The server is hosted on a free tier which may take a moment to wake up if it has been inactive.</p>
                <p className="mt-1">
                  Tried server {connectionStatus.currentServer} of {connectionStatus.totalServers}
                  {connectionStatus.reconnectAttempts > 0 && ` (${connectionStatus.reconnectAttempts} reconnection attempts made)`}
                </p>
              </div>
            </AlertDescription>
            <div className="mt-3 flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleReconnect}
                disabled={reconnecting}
                className="bg-white hover:bg-gray-100 flex-1"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${reconnecting ? 'animate-spin' : ''}`} />
                {reconnecting ? 'Reconnecting...' : 'Reconnect'}
              </Button>
            </div>
          </Alert>
        </div>
      )}
      
      {!connectionError && connectionStatus.connected && (
        <div className="max-w-md mx-auto mt-4 mb-4">
          <div className="flex items-center justify-center text-sm text-green-600 gap-1">
            <Wifi className="h-4 w-4" />
            <span>Connected to server {connectionStatus.currentServer}</span>
          </div>
        </div>
      )}
      
      {gameStarted ? <GameBoard /> : <Lobby />}
    </div>
  );
};

export default Game;
