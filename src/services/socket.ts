
import { io, Socket } from 'socket.io-client';
import { toast } from '@/lib/toast-helpers';

// Socket singleton to manage connection
class SocketService {
  private socket: Socket | null = null;
  private gameId: string | null = null;

  // Initialize connection to WebSocket server
  connect() {
    if (this.socket) return;

    // Connect to the WebSocket server (replace with your actual server URL in production)
    this.socket = io('https://raja-mantri-server.onrender.com', {
      transports: ['websocket'],
      autoConnect: true,
    });

    // Setup event listeners
    this.socket.on('connect', () => {
      toast.success('Connected to game server');
    });

    this.socket.on('connect_error', (error) => {
      toast.error(`Connection error: ${error.message}`);
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        toast.error('Server disconnected');
      } else {
        toast.error('Disconnected from server');
      }
    });

    return this.socket;
  }

  // Get the socket instance
  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  // Join a game room
  joinGame(gameId: string, playerName: string) {
    const socket = this.getSocket();
    if (!socket) return;
    
    this.gameId = gameId;
    socket.emit('join_game', { gameId, playerName });
  }

  // Create a new game
  createGame(playerName: string) {
    const socket = this.getSocket();
    if (!socket) return;
    
    socket.emit('create_game', { playerName });
  }

  // Start the game
  startGame() {
    const socket = this.getSocket();
    if (!socket || !this.gameId) return;
    
    socket.emit('start_game', { gameId: this.gameId });
  }

  // Make a guess in the game
  makeGuess(targetPlayerId: string) {
    const socket = this.getSocket();
    if (!socket || !this.gameId) return;
    
    socket.emit('make_guess', { gameId: this.gameId, targetPlayerId });
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
