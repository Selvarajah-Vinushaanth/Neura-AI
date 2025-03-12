"use client"

import { useState, useEffect } from "react"
import type { Message } from "@/types/chat"

export function useChatHistory() {
  const [messages, setMessages] = useState<Message[]>([])

  // Load messages from localStorage on initial render
  useEffect(() => {
    const savedMessages = localStorage.getItem("gemini-chat-history")
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (error) {
        console.error("Failed to parse saved messages:", error)
        localStorage.removeItem("gemini-chat-history")
      }
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("gemini-chat-history", JSON.stringify(messages))
  }, [messages])

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const clearMessages = () => {
    setMessages([])
  }

  return { messages, addMessage, clearMessages }
}

