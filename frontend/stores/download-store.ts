import { create } from 'zustand'
import type { Download } from '@/types/online-video'

interface DownloadStore {
  isQueueOpen: boolean
  setQueueOpen: (open: boolean) => void
  toggleQueue: () => void
}

export const useDownloadStore = create<DownloadStore>((set) => ({
  isQueueOpen: true,
  setQueueOpen: (open) => set({ isQueueOpen: open }),
  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
}))
