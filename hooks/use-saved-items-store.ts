"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Message } from "@/types/chat"

export interface SavedItem {
  id: string
  message: Message
  collectionId: string | null
  savedAt: string
  notes: string
}

export interface Collection {
  id: string
  name: string
  description: string
  createdAt: string
  color: string
}

interface SavedItemsStore {
  savedItems: SavedItem[]
  collections: Collection[]

  // Saved items actions
  saveItem: (message: Message, collectionId?: string | null) => void
  unsaveItem: (id: string) => void
  updateItemNotes: (id: string, notes: string) => void
  moveItemToCollection: (id: string, collectionId: string | null) => void
  getSavedItem: (messageId: string) => SavedItem | undefined

  // Collections actions
  createCollection: (name: string, description?: string, color?: string) => string
  updateCollection: (id: string, data: Partial<Omit<Collection, "id" | "createdAt">>) => void
  deleteCollection: (id: string) => void
}

const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: "default",
    name: "All Saved Items",
    description: "Default collection for all saved items",
    createdAt: new Date().toISOString(),
    color: "#7C3AED", // Purple
  },
]

export const useSavedItemsStore = create<SavedItemsStore>()(
  persist(
    (set, get) => ({
      savedItems: [],
      collections: DEFAULT_COLLECTIONS,

      saveItem: (message, collectionId = null) => {
        const existingItem = get().savedItems.find((item) => item.message.id === message.id)

        if (existingItem) {
          // If already saved, just update the collection if provided
          if (collectionId !== undefined) {
            set((state) => ({
              savedItems: state.savedItems.map((item) =>
                item.message.id === message.id ? { ...item, collectionId } : item,
              ),
            }))
          }
          return
        }

        const newItem: SavedItem = {
          id: Date.now().toString(),
          message,
          collectionId,
          savedAt: new Date().toISOString(),
          notes: "",
        }

        set((state) => ({
          savedItems: [newItem, ...state.savedItems],
        }))
      },

      unsaveItem: (id) => {
        set((state) => ({
          savedItems: state.savedItems.filter((item) => item.id !== id),
        }))
      },

      updateItemNotes: (id, notes) => {
        set((state) => ({
          savedItems: state.savedItems.map((item) => (item.id === id ? { ...item, notes } : item)),
        }))
      },

      moveItemToCollection: (id, collectionId) => {
        set((state) => ({
          savedItems: state.savedItems.map((item) => (item.id === id ? { ...item, collectionId } : item)),
        }))
      },

      getSavedItem: (messageId) => {
        return get().savedItems.find((item) => item.message.id === messageId)
      },

      createCollection: (name, description = "", color = "#" + Math.floor(Math.random() * 16777215).toString(16)) => {
        const id = Date.now().toString()
        const newCollection: Collection = {
          id,
          name,
          description,
          createdAt: new Date().toISOString(),
          color,
        }

        set((state) => ({
          collections: [...state.collections, newCollection],
        }))

        return id
      },

      updateCollection: (id, data) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === id ? { ...collection, ...data } : collection,
          ),
        }))
      },

      deleteCollection: (id) => {
        // Don't allow deleting the default collection
        if (id === "default") return

        // Move all items from this collection to null (uncategorized)
        set((state) => ({
          collections: state.collections.filter((collection) => collection.id !== id),
          savedItems: state.savedItems.map((item) =>
            item.collectionId === id ? { ...item, collectionId: null } : item,
          ),
        }))
      },
    }),
    {
      name: "gemini-saved-items-store",
    },
  ),
)

