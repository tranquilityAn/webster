import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface CanvasState {
  socket: Socket | null;
  isConnected: boolean;
  canvaId: string | null;
  snapshot: any | null;
  commits: any[];
  error: string | null;
  
  connect: (canvaId: string) => void;
  disconnect: () => void;
  sendCommit: (changes: any[]) => void;
  undo: (head: number) => void;
  redo: (head: number) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  socket: null,
  isConnected: false,
  canvaId: null,
  snapshot: null,
  commits: [],
  error: null,

  connect: (canvaId: string) => {
    // Avoid creating multiple connections
    if (get().socket) {
      return;
    }

    // Determine the WS backend URL. If not specified via env rules, use Vite proxy or localhost:6767.
    // The backend's Swagger/AsyncAPI states wss://<host>/canvas or ws://localhost:3000/canvas
    // based on our architecture, the backend runs on port 6767 behind proxy.
    // Using relative path to use vite proxy for credentials and same-origin or absolute URL.
    const backendUrl = import.meta.env.VITE_WS_URL || 'http://localhost:6767';
    
    const socket = io(`${backendUrl}/canvas`, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Socket connected, joining room...');
      set({ isConnected: true, canvaId, error: null });
      socket.emit('join', { canva_id: canvaId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    socket.on('joined', (state) => {
      console.log('Joined with initial state:', state);
      set({ snapshot: state.snapshot, commits: state.commits });
    });

    socket.on('commit:ack', (commit) => {
      console.log('Received commit:', commit);
      set((state) => ({ commits: [...state.commits, commit] }));
    });

    socket.on('snapshot', (data) => {
      console.log('Received snapshot boundary:', data);
      set({ snapshot: data.snapshot, commits: data.commits });
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      set({ error: err.message });
    });

    socket.on('commit:error', (err) => {
      console.error('Commit error:', err);
      set({ error: `Commit error: ${err.message}` });
    });

    socket.on('undo', (payload) => {
      console.log('Undo to head:', payload.head);
      // Implementation placeholder for moving head
    });

    socket.on('redo', (payload) => {
      console.log('Redo to head:', payload.head);
      // Implementation placeholder for moving head
    });

    socket.on('undo:error', (err) => {
      console.error('Undo error:', err);
      set({ error: `Undo error: ${err.message}` });
    });

    socket.on('redo:error', (err) => {
      console.error('Redo error:', err);
      set({ error: `Redo error: ${err.message}` });
    });

    set({ socket, canvaId });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, canvaId: null, snapshot: null, commits: [] });
    }
  },

  sendCommit: (changes: any[]) => {
    const { socket, commits } = get();
    if (socket && socket.connected) {
      const previous = commits.length > 0 ? commits[commits.length - 1].number : 0; 
      socket.emit('commit', { previous, changes });
    }
  },

  undo: (head: number) => {
    get().socket?.emit('undo', { head });
  },

  redo: (head: number) => {
    get().socket?.emit('redo', { head });
  }
}));
