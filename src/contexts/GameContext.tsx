
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";

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
  setPlayerName: (name: string) => void;
  joinGame: (name: string) => void;
  startGame: () => void;
  distributeRoles: () => void;
  makeGuess: (targetPlayerId: string) => void;
  resetGame: () => void;
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

  // Join game function
  const joinGame = (name: string) => {
    const mockPlayers = generateMockPlayers();
    mockPlayers[0].name = name;
    setPlayers(mockPlayers);
    setCurrentPlayer(mockPlayers[0]);
    setPlayerName(name);
    toast.success(`Welcome to the game, ${name}!`);
  };

  // Start game function
  const startGame = () => {
    if (players.length < 4) {
      toast.error("Need at least 4 players to start the game.");
      return;
    }
    
    setGameStarted(true);
    distributeRoles();
    toast.success("Game started! Roles have been distributed.");
  };

  // Distribute roles among players
  const distributeRoles = () => {
    const roles: RoleType[] = ['Raja', 'Mantri', 'Chor', 'Sipahi'];
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
    
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      currentRole: shuffledRoles[index],
      isRevealed: shuffledRoles[index] === 'Raja' || shuffledRoles[index] === 'Sipahi'
    }));
    
    setPlayers(updatedPlayers);
    
    // Update current player with their role
    if (currentPlayer) {
      const playerWithRole = updatedPlayers.find(p => p.id === currentPlayer.id);
      setCurrentPlayer(playerWithRole || null);
    }
  };

  // Make a guess (Sipahi guessing who is Chor)
  const makeGuess = (targetPlayerId: string) => {
    const targetPlayer = players.find(p => p.id === targetPlayerId);
    const rajaPlayer = players.find(p => p.currentRole === 'Raja');
    const mantriPlayer = players.find(p => p.currentRole === 'Mantri');
    const chorPlayer = players.find(p => p.currentRole === 'Chor');
    const sipahiPlayer = players.find(p => p.currentRole === 'Sipahi');
    
    if (!targetPlayer || !rajaPlayer || !mantriPlayer || !chorPlayer || !sipahiPlayer) {
      toast.error("Error in game state. Missing players or roles.");
      return;
    }
    
    // Check if the guess is correct
    const isCorrectGuess = targetPlayer.currentRole === 'Chor';
    
    // Calculate points based on the rules
    const updatedPlayers = players.map(player => {
      const newPlayer = { ...player };
      
      if (player.currentRole === 'Raja') {
        newPlayer.score += rolePoints.Raja;
      } else if (player.currentRole === 'Mantri') {
        newPlayer.score += rolePoints.Mantri;
      } else if (player.currentRole === 'Sipahi') {
        newPlayer.score += isCorrectGuess ? rolePoints.Sipahi : 0;
      } else if (player.currentRole === 'Chor') {
        newPlayer.score += isCorrectGuess ? 0 : rolePoints.Sipahi;
      }
      
      // Reveal all roles for this round
      newPlayer.isRevealed = true;
      
      return newPlayer;
    });
    
    setPlayers(updatedPlayers);
    
    // Update current player
    if (currentPlayer) {
      const updatedCurrentPlayer = updatedPlayers.find(p => p.id === currentPlayer.id);
      setCurrentPlayer(updatedCurrentPlayer || null);
    }
    
    if (isCorrectGuess) {
      toast.success(`Correct! ${sipahiPlayer.name} correctly identified ${chorPlayer.name} as the Chor!`);
    } else {
      toast.error(`Wrong guess! ${chorPlayer.name} was the Chor and gets the Sipahi's points!`);
    }
    
    // Check if game should advance to next round
    setTimeout(() => {
      if (currentRound < totalRounds) {
        setCurrentRound(prev => prev + 1);
        
        // Reset player roles and revealed status for next round
        const resetPlayers = updatedPlayers.map(player => ({
          ...player,
          currentRole: undefined,
          isRevealed: false
        }));
        
        setPlayers(resetPlayers);
        
        // Distribute roles for next round
        setTimeout(() => {
          distributeRoles();
          toast.success(`Round ${currentRound + 1} begins!`);
        }, 1000);
      } else {
        // End game
        setGameEnded(true);
        const winner = [...updatedPlayers].sort((a, b) => b.score - a.score)[0];
        toast.success(`Game over! ${winner.name} wins with ${winner.score} points!`);
      }
    }, 3000);
  };

  // Reset game
  const resetGame = () => {
    setPlayers(generateMockPlayers());
    setCurrentRound(1);
    setGameStarted(false);
    setGameEnded(false);
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
        setPlayerName,
        joinGame,
        startGame,
        distributeRoles,
        makeGuess,
        resetGame
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
