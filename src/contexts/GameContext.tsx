
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "@/lib/toast-helpers";
import { socketService } from '@/services/socket';

// Game roles types
export type RoleType = 'Raja' | 'Mantri' | 'Chor' | 'Sipahi';

// Player type
export interface Player {
  id: string;
  name: string;
  currentRole?: RoleType;
  score: number;
  isRevealed: boolean;
}

// Context type
interface GameContextType {
  players: Player[];
  currentRound: number;
  totalRounds: number;
  currentPlayer: Player | null;
  gameStarted: boolean;
  gameEnded: boolean;
  playerName: string;
  gameId: string | null;
  setPlayerName: (name: string) => void;
  joinGame: (name: string, gameId?: string) => void;
  startGame: () => void;
  distributeRoles: () => void;
  makeGuess: (targetPlayerId: string) => void;
  resetGame: () => void;
  reconnectToGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Mock player data (in a real app, this would come from a server)
const generateMockPlayers = (): Player[] => {
  return [
    { id: '1', name: 'You', score: 0, isRevealed: false },
    { id: '2', name: 'Player 2', score: 0, isRevealed: false },
    { id: '3', name: 'Player 3', score: 0, isRevealed: false },
    { id: '4', name: 'Player 4', score: 0, isRevealed: false },
  ];
};

// Role points
const rolePoints: Record<RoleType, number> = {
  Raja: 800,
  Mantri: 900,
  Chor: 0,
  Sipahi: 1000,
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(7);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);

  // Initialize player name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }
    
    // Check for saved game ID
    const savedGameId = localStorage.getItem('gameId');
    if (savedGameId) {
      setGameId(savedGameId);
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    // Avoid re-initializing socket if it's already set up
    if (socketInitialized) return;
    
    const socket = socketService.connect();
    
    if (!socket) {
      // If initial connection fails, schedule retry with exponential backoff
      const retryDelay = Math.min(1000 * (2 ** connectionRetries), 10000);
      const retryTimer = setTimeout(() => {
        setConnectionRetries(prev => prev + 1);
        socketService.reconnect();
      }, retryDelay);
      
      return () => clearTimeout(retryTimer);
    }
    
    setSocketInitialized(true);
    setConnectionRetries(0);
    
    // Listen for game state updates
    socket.on('game_state', (data) => {
      setPlayers(data.players);
      setCurrentRound(data.currentRound);
      setGameStarted(data.gameStarted);
      setGameEnded(data.gameEnded);
      
      // Update current player
      const newCurrentPlayer = data.players.find((p: Player) => p.name === playerName);
      if (newCurrentPlayer) {
        setCurrentPlayer(newCurrentPlayer);
      }
      
      // Set game ID if it's available
      if (data.gameId && !gameId) {
        setGameId(data.gameId);
        localStorage.setItem('gameId', data.gameId);
      }
    });
    
    socket.on('player_joined', (data) => {
      toast.success(`${data.playerName} joined the game`);
    });
    
    socket.on('game_started', () => {
      toast.success("Game started! Roles have been distributed.");
    });
    
    socket.on('guess_result', (data) => {
      if (data.correct) {
        toast.success(`Correct! ${data.sipahiName} identified ${data.chorName} as the Chor!`);
      } else {
        toast.error(`Wrong guess! ${data.chorName} was the Chor and gets the Sipahi's points!`);
      }
    });
    
    socket.on('round_ended', (data) => {
      toast.success(`Round ${data.round} has ended.`);
    });
    
    socket.on('game_ended', (data) => {
      toast.success(`Game over! ${data.winner.name} wins with ${data.winner.score} points!`);
    });
    
    socket.on('error', (data) => {
      toast.error(data.message);
    });
    
    return () => {
      // Don't disconnect on unmount if we're still in a game
      if (!gameId) {
        socketService.disconnect();
      }
    };
  }, [socketInitialized, playerName, gameId, connectionRetries]);

  // Reconnect to game if we have the necessary information
  const reconnectToGame = () => {
    if (gameId && playerName) {
      socketService.joinGame(gameId, playerName);
      return true;
    }
    return false;
  };

  // Join game function
  const joinGame = (name: string, gameIdToJoin?: string) => {
    setPlayerName(name);
    localStorage.setItem('playerName', name);
    
    if (gameIdToJoin) {
      // Join an existing game
      const joined = socketService.joinGame(gameIdToJoin, name);
      if (joined) {
        setGameId(gameIdToJoin);
        localStorage.setItem('gameId', gameIdToJoin);
      }
    } else {
      // Create a new game
      const created = socketService.createGame(name);
      if (created) {
        const mockPlayers = generateMockPlayers();
        mockPlayers[0].name = name;
        setPlayers(mockPlayers);
        setCurrentPlayer(mockPlayers[0]);
        toast.success(`Welcome to the game, ${name}!`);
      }
    }
  };

  // Start game function
  const startGame = () => {
    if (players.length < 4) {
      toast.error("Need at least 4 players to start the game.");
      return;
    }
    
    socketService.startGame();
  };

  // Distribute roles among players (now handled by server)
  const distributeRoles = () => {
    // This is now handled by the server
    // Kept for compatibility with existing code
  };

  // Make a guess (Sipahi guessing who is Chor)
  const makeGuess = (targetPlayerId: string) => {
    socketService.makeGuess(targetPlayerId);
  };

  // Reset game
  const resetGame = () => {
    setPlayers(generateMockPlayers());
    setCurrentRound(1);
    setGameStarted(false);
    setGameEnded(false);
    setGameId(null);
    localStorage.removeItem('gameId');
    toast.success("Game has been reset.");
  };

  return (
    <GameContext.Provider
      value={{
        players,
        currentRound,
        totalRounds,
        currentPlayer,
        gameStarted,
        gameEnded,
        playerName,
        gameId,
        setPlayerName,
        joinGame,
        startGame,
        distributeRoles,
        makeGuess,
        resetGame,
        reconnectToGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
