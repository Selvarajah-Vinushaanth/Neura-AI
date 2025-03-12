"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, Check, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSavedItemsStore } from "@/hooks/use-saved-items-store"

interface MessageReactionsProps {
  content: string
  messageId: string
}

export function MessageReactions({ content, messageId }: MessageReactionsProps) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null)
  const { toast } = useToast()

  const { savedItems, saveItem, unsaveItem, getSavedItem } = useSavedItemsStore()
  const isSaved = !!getSavedItem(messageId)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "Message content copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      })
    }
  }

  const toggleSaveMessage = () => {
    if (isSaved) {
      const savedItem = getSavedItem(messageId)
      if (savedItem) {
        unsaveItem(savedItem.id)
        toast({
          title: "Message unsaved",
          description: "Message removed from saved items",
        })
      }
    } else {
      // Find the message in the chat history
      const message = {
        id: messageId,
        role: "assistant",
        content: content,
        timestamp: new Date().toISOString(),
      }

      saveItem(message)
      toast({
        title: "Message saved",
        description: "Message added to saved items",
      })
    }
  }

  const handleReaction = (type: "like" | "dislike") => {
    // In a real app, this would send the reaction to a backend
    setReaction(reaction === type ? null : type)

    if (reaction !== type) {
      toast({
        title: `Message ${type === "like" ? "liked" : "disliked"}`,
        description: "Thank you for your feedback",
      })
    }
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={copyToClipboard}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy to clipboard</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={toggleSaveMessage}>
              {isSaved ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSaved ? "Unsave message" : "Save message"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-full ${reaction === "like" ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => handleReaction("like")}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Like</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-full ${reaction === "dislike" ? "bg-destructive/10 text-destructive" : ""}`}
              onClick={() => handleReaction("dislike")}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dislike</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

