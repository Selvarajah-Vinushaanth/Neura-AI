"use client"

import { cn } from "@/lib/utils"
import type { Message } from "@/types/chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import ReactMarkdown from "react-markdown"
import { MessageReactions } from "./message-reactions"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { FileIcon } from "lucide-react"

interface ChatMessageProps {
  message: Message
  scrollToMessage?: (id: string) => void
  isHighlighted?: boolean
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function ChatMessage({ message, scrollToMessage, isHighlighted = false }: ChatMessageProps) {
  const isUser = message.role === "user"
  const [userName, setUserName] = useState("User")
  const [userAvatar, setUserAvatar] = useState("../public/gemini-avatar.png")

  // Load user profile from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("gemini-user-name")
      const savedAvatar = localStorage.getItem("gemini-user-avatar")

      if (savedName) setUserName(savedName)
      if (savedAvatar) setUserAvatar(savedAvatar)
    }
  }, [])

  return (
    <motion.div
      id={`message-${message.id}`}
      className={cn(
        "flex gap-3 w-full",
        isUser ? "justify-end" : "justify-start",
        isHighlighted && "bg-yellow-100 dark:bg-yellow-900/20 -mx-4 px-4 py-2 rounded-lg",
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarImage src="/gemini-avatar.png" alt="Gemini AI" />
          <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[85%]")}>
        <div className="flex items-center mb-1">
          {!isUser && <span className="text-xs font-medium">Neura AI</span>}
          {isUser && <span className="text-xs font-medium ml-auto">{userName}</span>}
        </div>

        <Card
          className={cn(
            "overflow-hidden",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted",
            message.isError && "bg-destructive text-destructive-foreground",
          )}
        >
          <CardContent className="p-3">
            {message.hasImage && message.imageUrl && (
              <div className="mb-2 rounded overflow-hidden">
                <img
                  src={message.imageUrl || "/placeholder.svg"}
                  alt="User uploaded"
                  className="max-h-60 max-w-full object-contain"
                />
              </div>
            )}

            {message.hasFile && message.fileMetadata && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md mb-2">
                <FileIcon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{message.fileMetadata.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(message.fileMetadata.size)}
                  </span>
                </div>
              </div>
            )}

            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex items-center justify-between mt-1 px-1">
          <div className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>

          {!isUser && <MessageReactions content={message.content} messageId={message.id} />}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  )
}

