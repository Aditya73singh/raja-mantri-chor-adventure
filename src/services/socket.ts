
import { io, Socket } from 'socket.io-client';
import { toast } from '@/lib/toast-helpers';

// Socket singleton to manage connection
class SocketService {
  private socket: Socket | null = null;
  private gameId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 seconds
  // Use polling only to avoid websocket issues
  private serverUrl: string = 'https://raja-mantri-server.onrender.com';
  private connectionInProgress: boolean = false;

  // Initialize connection to WebSocket server
  connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionInProgress) {
      console.log("Connection attempt already in progress");
      return this.socket;
    }

    this.connectionInProgress = true;

    if (this.socket && this.socket.connected) {
      this.connectionInProgress = false;
      return this.socket;
    }

    // Clean up existing socket if it exists but is not connected
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    console.log("Connecting to socket server:", this.serverUrl);

    try {
      // Use polling only initially to ensure most reliable connection
      this.socket = io(this.serverUrl, {
        transports: ['polling'], // Start with polling only for reliability
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        timeout: 60000, // 60 seconds timeout (increased)
        forceNew: true, // Create a new connection each time
      });

      // Setup event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error("Error creating socket connection:", error);
      this.connectionInProgress = false;
      return null;
    }

    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.connectionInProgress = false;
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
      
      // Only show toast for first error to avoid spam
      if (this.reconnectAttempts === 1) {
        toast.error(`Connection error: ${error.message}. Attempting to reconnect...`);
      }
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.connectionInProgress = false;
        // Reset connection and try again
        if (this.socket) {
          console.log("Maximum reconnection attempts reached, forcing new connection");
          // Force a clean reconnection
          this.forceReconnect();
        }
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      toast.success(`Reconnected to server after ${attemptNumber} attempts`);
      this.connectionInProgress = false;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      this.connectionInProgress = false;
    });

    this.socket.on('reconnect_failed', () => {
      toast.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts. Please reload the page.`);
      this.connectionInProgress = false;
      // Try one more time with a clean connection
      this.forceReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast.error('Server disconnected. Please reload the page.');
      } else if (reason === 'transport close') {
        toast.error('Connection lost. Attempting to reconnect...');
        // Force a clean connection
        this.forceReconnect();
      } else {
        toast.error(`Disconnected: ${reason}. Attempting to reconnect...`);
      }
      this.connectionInProgress = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.connectionInProgress = false;
    });
  }

  // Force a clean reconnection
  private forceReconnect() {
    // Make sure we clean up first
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Reset state
    this.reconnectAttempts = 0;
    this.connectionInProgress = false;
    
    // Wait a bit before reconnecting
    setTimeout(() => {
      this.connect();
    }, 1000);
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
    
    // Reset connection state
    this.reconnectAttempts = 0;
    this.connectionInProgress = false;
    
    // Try connection
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
