
import { io, Socket } from 'socket.io-client';
import { toast } from '@/lib/toast-helpers';

// Socket singleton to manage connection
class SocketService {
  private socket: Socket | null = null;
  private gameId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 seconds
  private serverUrl: string = 'https://raja-mantri-server.onrender.com';

  // Initialize connection to WebSocket server
  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    // Clean up existing socket if it exists but is not connected
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Connect to the WebSocket server with fallback to HTTP polling
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'], // Try WebSocket first, then fall back to polling
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
      timeout: 20000, // 20 seconds timeout (increased from 10s)
      forceNew: true, // Create a new connection each time
    });

    // Setup event listeners
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      toast.success('Connected to game server');
      console.log('Socket connected:', this.socket?.id);
      
      // Rejoin game if there was an active game
      if (this.gameId) {
        const playerName = localStorage.getItem('playerName');
        if (playerName) {
          this.joinGame(this.gameId, playerName);
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error('Socket connection error:', error);
      
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        toast.error(`Connection error: ${error.message}. Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      } else {
        toast.error(`Connection failed after ${this.maxReconnectAttempts} attempts. Please check your internet connection and try again.`);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      toast.success(`Reconnected to server after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      toast.error(`Reconnection error: ${error.message}`);
    });

    this.socket.on('reconnect_failed', () => {
      toast.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts. Please reload the page.`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast.error('Server disconnected. Please reload the page.');
      } else if (reason === 'transport close') {
        toast.error('Connection lost. Attempting to reconnect...');
        // Try to reconnect with polling if websocket fails
        this.switchToPolling();
      } else {
        toast.error(`Disconnected: ${reason}. Attempting to reconnect...`);
      }
    });

    return this.socket;
  }

  // Switch to polling transport if websocket fails
  private switchToPolling() {
    if (this.socket) {
      console.log("Switching to polling transport");
      this.socket.io.opts.transports = ['polling'];
      this.socket.connect();
    }
  }

  // Get the socket instance
  getSocket() {
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }

  // Check if socket is connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Manual reconnect function
  reconnect() {
    // Clear any existing listeners to prevent duplicates
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    // Try connection with both transports
    console.log("Attempting manual reconnection");
    return this.connect() !== null;
  }

  // Join a game room
  joinGame(gameId: string, playerName: string) {
    const socket = this.getSocket();
    if (!socket) {
      toast.error('Cannot join game: Not connected to server');
      return false;
    }
    
    this.gameId = gameId;
    socket.emit('join_game', { gameId, playerName });
    return true;
  }

  // Create a new game
  createGame(playerName: string) {
    const socket = this.getSocket();
    if (!socket) {
      toast.error('Cannot create game: Not connected to server');
      return false;
    }
    
    socket.emit('create_game', { playerName });
    return true;
  }

  // Start the game
  startGame() {
    const socket = this.getSocket();
    if (!socket || !this.gameId) {
      toast.error('Cannot start game: Not connected to server or no game joined');
      return false;
    }
    
    socket.emit('start_game', { gameId: this.gameId });
    return true;
  }

  // Make a guess in the game
  makeGuess(targetPlayerId: string) {
    const socket = this.getSocket();
    if (!socket || !this.gameId) {
      toast.error('Cannot make guess: Not connected to server or no game joined');
      return false;
    }
    
    socket.emit('make_guess', { gameId: this.gameId, targetPlayerId });
    return true;
  }

  // Disconnect from the server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.gameId = null;
    }
  }
}

// Export a singleton instance
export const socketService = new SocketService();
