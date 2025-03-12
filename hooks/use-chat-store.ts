"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Message } from "@/types/chat"

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

interface ChatStore {
  chats: Chat[]
  activeChat: string | null
  createNewChat: () => string
  setActiveChat: (id: string) => void
  deleteChat: (id: string) => void
  addMessage: (chatId: string, message: Message) => void
  updateChatTitle: (chatId: string, title: string) => void
  getChatMessages: (chatId: string) => Message[]
  clearMessages: (chatId: string) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChat: null,

      createNewChat: () => {
        const id = Date.now().toString()
        set((state) => ({
          chats: [
            {
              id,
              title: "New Conversation",
              messages: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...state.chats,
          ],
          activeChat: id,
        }))
        return id
      },

      setActiveChat: (id) => {
        set({ activeChat: id })
      },

      deleteChat: (id) => {
        set((state) => {
          const newChats = state.chats.filter((chat) => chat.id !== id)
          let newActiveChat = state.activeChat

          if (state.activeChat === id) {
            newActiveChat = newChats.length > 0 ? newChats[0].id : null
          }

          return {
            chats: newChats,
            activeChat: newActiveChat,
          }
        })
      },

      addMessage: (chatId, message) => {
        set((state) => {
          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId) {
              // Update chat title based on first user message if still default
              let title = chat.title
              if (title === "New Conversation" && message.role === "user") {
                title = message.content.slice(0, 30) + (message.content.length > 30 ? "..." : "")
              }

              return {
                ...chat,
                title,
                messages: [...chat.messages, message],
                updatedAt: new Date().toISOString(),
              }
            }
            return chat
          })

          return { chats: updatedChats }
        })
      },

      updateChatTitle: (chatId, title) => {
        set((state) => ({
          chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)),
        }))
      },

      getChatMessages: (chatId) => {
        const chat = get().chats.find((c) => c.id === chatId)
        return chat ? chat.messages : []
      },

      clearMessages: (chatId) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [],
                  title: "New Conversation",
                  updatedAt: new Date().toISOString(),
                }
              : chat,
          ),
        }))
      },
    }),
    {
      name: "gemini-chat-store",
    },
  ),
)

