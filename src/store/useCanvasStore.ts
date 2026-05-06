import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface CanvasState {
  socket: Socket | null;
  isConnected: boolean;
  canvaId: string | null;
  snapshot: any | null;
  commits: any[];
  /** The commit number currently at the "head" (tip) of the visible history. */
  headNumber: number;
  error: string | null;

  connect: (canvaId: string) => void;
  disconnect: () => void;
  sendCommit: (changes: any[]) => void;
  undo: () => void;
  redo: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  socket: null,
  isConnected: false,
  canvaId: null,
  snapshot: null,
  commits: [],
  headNumber: 0,
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
      const commits = state.commits ?? [];
      const headNumber = commits.length > 0 ? commits[commits.length - 1].number : 0;
      set({ snapshot: state.snapshot, commits, headNumber });
    });

    socket.on('commit:ack', (commit) => {
      console.log('Received commit:', commit);
      set((state) => {
        const activeCommits = state.commits.filter((c) => c.number <= state.headNumber);
        const commits = [...activeCommits, commit];
        return { commits, headNumber: commit.number };
      });
    });

    socket.on('snapshot', (data) => {
      console.log('Received snapshot boundary:', data);
      const commits = data.commits ?? [];
      const headNumber = commits.length > 0 ? commits[commits.length - 1].number : 0;
      set({ snapshot: data.snapshot, commits, headNumber });
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      set({ error: err.message });
    });

    socket.on('commit:error', (err) => {
      console.error('Commit error:', err);
      set({ error: `Commit error: ${err.message}` });
    });

    socket.on('undo', (payload: { head: number }) => {
      console.log('Undo to head:', payload.head);
      set({ headNumber: payload.head });
    });

    socket.on('redo', (payload: { head: number }) => {
      console.log('Redo to head:', payload.head);
      // The server re-delivers the re-applied commits via commit:ack, but we also
      // update headNumber so canRedo recalculates correctly.
      set({ headNumber: payload.head });
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
      set({ socket: null, isConnected: false, canvaId: null, snapshot: null, commits: [], headNumber: 0 });
    }
  },

  sendCommit: (changes: any[]) => {
    const { socket, commits } = get();
    if (socket && socket.connected) {
      const previous = commits.length > 0 ? commits[commits.length - 1].number : 0; 
      socket.emit('commit', { previous, changes });
    }
  },

  /**
   * Undo one step: asks the server to roll back to the commit just before the
   * current head. The server responds with an 'undo' event containing the new head.
   */
  undo: () => {
    const { socket, commits, headNumber } = get();
    if (!socket) return;
    // Find the commit immediately before the current head
    const currentIdx = commits.findIndex((c) => c.number === headNumber);
    const targetHead = currentIdx > 0 ? commits[currentIdx - 1].number : 0;
    socket.emit('undo', { head: targetHead });
  },

  /**
   * Redo one step: asks the server to re-apply the next commit after the current head.
   */
  redo: () => {
    const { socket, commits, headNumber } = get();
    if (!socket) return;
    const currentIdx = commits.findIndex((c) => c.number === headNumber);
    // If there is a commit after current head in the list, re-apply it
    if (currentIdx >= 0 && currentIdx < commits.length - 1) {
      const nextCommit = commits[currentIdx + 1];
      socket.emit('redo', { head: nextCommit.number });
    }
  },
}));

