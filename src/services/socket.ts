
import { io, Socket } from 'socket.io-client';
import { toast } from '@/lib/toast-helpers';

// Socket singleton to manage connection
class SocketService {
  private socket: Socket | null = null;
  private gameId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10; // Increased max attempts
  private reconnectInterval: number = 5000; // Increased to 5 seconds
  // Fallback server options - expanded with additional options
  private serverUrls: string[] = [
    'https://raja-mantri-server.onrender.com',
    'https://raja-mantri-backup.onrender.com',
    'https://raja-mantri-chor.onrender.com',  // Additional fallback
    'https://raja-mantri-game.herokuapp.com'  // Additional fallback
  ];
  private currentServerIndex: number = 0;
  private connectionInProgress: boolean = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private localFallbackMode: boolean = false;

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

    const currentServerUrl = this.serverUrls[this.currentServerIndex];
    console.log(`Connecting to socket server (${this.currentServerIndex + 1}/${this.serverUrls.length}):`, currentServerUrl);

    try {
      // Set a timeout to detect stalled connection attempts
      this.connectionTimeout = setTimeout(() => {
        console.log("Connection attempt timed out, trying next server");
        this.handleConnectionTimeout();
      }, 15000); // Increased to 15 seconds for free tier servers that might be slow to wake

      // Use polling only initially to ensure most reliable connection
      this.socket = io(currentServerUrl, {
        transports: ['polling'], // Start with polling only for reliability
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3, // Lower individual reconnection attempts per server
        reconnectionDelay: this.reconnectInterval,
        timeout: 60000, // 60 seconds timeout
        forceNew: true, // Create a new connection each time
      });

      // Setup event listeners
      this.setupEventListeners();
      
      // If we're on the last server and still not connecting, try local fallback
      if (this.currentServerIndex === this.serverUrls.length - 1 && !this.localFallbackMode) {
        this.prepareLocalFallback();
      }
    } catch (error) {
      console.error("Error creating socket connection:", error);
      this.clearConnectionTimeout();
      this.connectionInProgress = false;
      this.tryNextServer();
      return null;
    }

    return this.socket;
  }

  // Handle connection timeout - try switching servers
  private handleConnectionTimeout() {
    this.clearConnectionTimeout();
    
    if (this.socket && !this.socket.connected) {
      console.log(`Connection to server ${this.currentServerIndex + 1} timed out, trying next server`);
      
      // Clean up current socket
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      
      // Move to next server
      this.tryNextServer();
    }
  }
  
  // Try the next server in the list
  private tryNextServer() {
    this.currentServerIndex = (this.currentServerIndex + 1) % this.serverUrls.length;
    this.connectionInProgress = false;
    this.reconnectAttempts += 1;
    
    // If we've tried all servers multiple times, notify the user
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error("All connection attempts failed. The game servers might be down for maintenance. Please try again later.");
      return;
    }
    
    // Try connecting to the next server
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Prepare a local fallback mode when all remote servers fail
  private prepareLocalFallback() {
    if (this.localFallbackMode) return;
    
    console.log("All remote servers failed, preparing local fallback mode");
    this.localFallbackMode = true;
    
    // Show message about offline mode
    toast.error("Could not connect to game servers. Some features may be limited.");
  }
  
  // Clear the connection timeout
  private clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.clearConnectionTimeout();
      this.reconnectAttempts = 0;
      this.connectionInProgress = false;
      this.localFallbackMode = false;
      toast.success(`Connected to game server ${this.currentServerIndex + 1}`);
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
      this.clearConnectionTimeout();
      console.error('Socket connection error:', error);
      
      // Only show toast for first error to avoid spam
      if (this.reconnectAttempts === 0) {
        toast.error(`Connection error: ${error.message}. Attempting to reconnect...`);
      }
      
      // Try next server after a few connection errors
      if (this.reconnectAttempts >= 2) {
        this.connectionInProgress = false;
        console.log("Multiple connection errors, trying next server");
        this.tryNextServer();
      } else {
        this.reconnectAttempts += 1;
        this.connectionInProgress = false;
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.clearConnectionTimeout();
      toast.success(`Reconnected to server after ${attemptNumber} attempts`);
      this.connectionInProgress = false;
      this.localFallbackMode = false;
    });

    this.socket.on('reconnect_error', (error) => {
      this.clearConnectionTimeout();
      console.error('Socket reconnection error:', error);
      this.connectionInProgress = false;
      this.tryNextServer();
    });

    this.socket.on('reconnect_failed', () => {
      this.clearConnectionTimeout();
      toast.error(`Failed to reconnect. Trying another server...`);
      this.connectionInProgress = false;
      this.tryNextServer();
    });

    this.socket.on('disconnect', (reason) => {
      this.clearConnectionTimeout();
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        toast.error('Server disconnected. Trying to reconnect...');
        this.forceReconnect();
      } else if (reason === 'transport close') {
        toast.error('Connection lost. Attempting to reconnect...');
        this.forceReconnect();
      } else {
        toast.error(`Disconnected: ${reason}. Attempting to reconnect...`);
        this.forceReconnect();
      }
      this.connectionInProgress = false;
    });

    this.socket.on('error', (error) => {
      this.clearConnectionTimeout();
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
    this.connectionInProgress = false;
    this.clearConnectionTimeout();
    
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
    // Clean up existing socket if it exists
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Reset connection state
    this.connectionInProgress = false;
    this.clearConnectionTimeout();
    
    // Reset server index to start with the primary server
    this.currentServerIndex = 0;
    
    // Try connection
    console.log("Attempting manual reconnection");
    return this.connect() !== null;
  }

  // Reset the server connection cycle
  resetServerCycle() {
    this.currentServerIndex = 0;
    this.reconnectAttempts = 0;
    this.localFallbackMode = false;
    this.connectionInProgress = false;
    this.clearConnectionTimeout();
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

  // Get current server status
  getServerStatus() {
    return {
      connected: this.isConnected(),
      currentServer: this.currentServerIndex + 1,
      totalServers: this.serverUrls.length,
      reconnectAttempts: this.reconnectAttempts,
      inLocalMode: this.localFallbackMode
    };
  }

  // Disconnect from the server
  disconnect() {
    this.clearConnectionTimeout();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.gameId = null;
    }
  }
}

// Export a singleton instance
export const socketService = new SocketService();
