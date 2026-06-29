import { create } from 'zustand';
import { Room, UserProgress } from '../shared';

interface GameState {
  rooms: Room[];
  progress: UserProgress[];
  currentRoomId: string | null;
  currentLessonId: string | null;
  setRooms: (rooms: Room[]) => void;
  setProgress: (progress: UserProgress[]) => void;
  setCurrentRoom: (roomId: string) => void;
  setCurrentLesson: (lessonId: string) => void;
  getRoomProgress: (roomId: string) => UserProgress | undefined;
}

export const useGameStore = create<GameState>((set, get) => ({
  rooms: [],
  progress: [],
  currentRoomId: null,
  currentLessonId: null,
  setRooms: (rooms) => set({ rooms }),
  setProgress: (progress) => set({ progress }),
  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),
  setCurrentLesson: (lessonId) => set({ currentLessonId: lessonId }),
  getRoomProgress: (roomId) => get().progress.find((p) => p.roomId === roomId),
}));
