
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
  isOfflineMode: boolean;
  setPlayerName: (name: string) => void;
  joinGame: (name: string, gameId?: string) => void;
  startGame: () => void;
  distributeRoles: () => void;
  makeGuess: (targetPlayerId: string) => void;
  resetGame: () => void;
  reconnectToGame: () => void;
  startOfflineMode: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Mock player data (in a real app, this would come from a server)
const generateMockPlayers = (): Player[] => {
  return [
    { id: '1', name: 'You', score: 0, isRevealed: false },
    { id: '2', name: 'AI Player 1', score: 0, isRevealed: false },
    { id: '3', name: 'AI Player 2', score: 0, isRevealed: false },
    { id: '4', name: 'AI Player 3', score: 0, isRevealed: false },
  ];
};

// Generate random roles for offline mode
const offlineRoles: RoleType[] = ['Raja', 'Mantri', 'Chor', 'Sipahi'];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
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
  const [isOfflineMode, setIsOfflineMode] = useState(false);

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
    // Don't try to connect if we're in offline mode
    if (isOfflineMode) return;
    
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
  }, [socketInitialized, playerName, gameId, connectionRetries, isOfflineMode]);

  // Start offline mode
  const startOfflineMode = () => {
    // Disconnect from any active socket connection
    socketService.disconnect();
    setSocketInitialized(false);
    
    // Create offline game state
    const offlinePlayers = generateMockPlayers();
    if (playerName) {
      offlinePlayers[0].name = playerName;
    }
    
    setPlayers(offlinePlayers);
    setCurrentPlayer(offlinePlayers[0]);
    setIsOfflineMode(true);
    setGameId('offline-game');
    
    toast.success("Offline mode started. You can play against AI players.");
  };

  // Offline mode game mechanics
  useEffect(() => {
    if (!isOfflineMode || !gameStarted) return;
    
    // In offline mode, automatically distribute roles when game starts
    if (gameStarted && players.every(p => !p.currentRole)) {
      const shuffledRoles = shuffleArray([...offlineRoles]);
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        currentRole: shuffledRoles[index],
      }));
      
      setPlayers(updatedPlayers);
      
      // Update current player's role
      const newCurrentPlayer = updatedPlayers.find(p => p.name === playerName) || null;
      setCurrentPlayer(newCurrentPlayer);
      
      toast.success("Roles have been distributed!");
    }
  }, [isOfflineMode, gameStarted, players, playerName]);

  // Reconnect to game if we have the necessary information
  const reconnectToGame = () => {
    // Don't try to reconnect if we're in offline mode
    if (isOfflineMode) {
      return false;
    }
    
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
    
    if (isOfflineMode) {
      // Join an offline game
      const mockPlayers = generateMockPlayers();
      mockPlayers[0].name = name;
      setPlayers(mockPlayers);
      setCurrentPlayer(mockPlayers[0]);
      toast.success(`Welcome to the offline game, ${name}!`);
      return;
    }
    
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
    
    if (isOfflineMode) {
      // Start offline game
      setGameStarted(true);
      toast.success("Game started in offline mode!");
      return;
    }
    
    socketService.startGame();
  };

  // Distribute roles among players (now handled by server or offline logic)
  const distributeRoles = () => {
    // This is now handled by the server or offline logic
    // Kept for compatibility with existing code
  };

  // Make a guess (Sipahi guessing who is Chor)
  const makeGuess = (targetPlayerId: string) => {
    if (isOfflineMode) {
      // Handle guessing in offline mode
      const targetPlayer = players.find(p => p.id === targetPlayerId);
      const sipahiPlayer = players.find(p => p.currentRole === 'Sipahi');
      const chorPlayer = players.find(p => p.currentRole === 'Chor');
      
      if (!targetPlayer || !sipahiPlayer || !chorPlayer) {
        toast.error("Cannot make guess: roles not properly distributed");
        return;
      }
      
      const isCorrectGuess = targetPlayer.id === chorPlayer.id;
      
      // Reveal all players
      const updatedPlayers = players.map(p => ({
        ...p,
        isRevealed: true,
        // Update scores based on guess result
        score: p.score + (
          isCorrectGuess && p.id === sipahiPlayer.id ? rolePoints['Sipahi'] :
          !isCorrectGuess && p.id === chorPlayer.id ? rolePoints['Sipahi'] :
          p.currentRole ? rolePoints[p.currentRole] : 0
        )
      }));
      
      setPlayers(updatedPlayers);
      
      // Show guess result toast
      if (isCorrectGuess) {
        toast.success(`Correct! ${sipahiPlayer.name} identified ${chorPlayer.name} as the Chor!`);
      } else {
        toast.error(`Wrong guess! ${chorPlayer.name} was the Chor and gets the Sipahi's points!`);
      }
      
      // Set timeout to end the round
      setTimeout(() => {
        if (currentRound < totalRounds) {
          // Start next round
          const nextRound = currentRound + 1;
          setCurrentRound(nextRound);
          
          // Reset player revelations and distribute new roles
          const shuffledRoles = shuffleArray([...offlineRoles]);
          const newRoundPlayers = players.map((player, index) => ({
            ...player,
            currentRole: shuffledRoles[index],
            isRevealed: false
          }));
          
          setPlayers(newRoundPlayers);
          
          // Update current player
          const newCurrentPlayer = newRoundPlayers.find(p => p.name === playerName) || null;
          setCurrentPlayer(newCurrentPlayer);
          
          toast.success(`Round ${nextRound} started!`);
        } else {
          // End game
          setGameEnded(true);
          
          // Find winner
          const winner = [...updatedPlayers].sort((a, b) => b.score - a.score)[0];
          toast.success(`Game over! ${winner.name} wins with ${winner.score} points!`);
        }
      }, 3000);
      
      return;
    }
    
    // Online mode - server handles the guess
    socketService.makeGuess(targetPlayerId);
  };

  // Reset game
  const resetGame = () => {
    setPlayers(generateMockPlayers());
    setCurrentRound(1);
    setGameStarted(false);
    setGameEnded(false);
    setGameId(null);
    setIsOfflineMode(false);
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
        isOfflineMode,
        setPlayerName,
        joinGame,
        startGame,
        distributeRoles,
        makeGuess,
        resetGame,
        reconnectToGame,
        startOfflineMode
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
