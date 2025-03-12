"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X } from "lucide-react"
import type { Message } from "@/types/chat"
import { cn } from "@/lib/utils"

interface MessageSearchProps {
  messages: Message[]
  onMessageClick: (messageId: string) => void
}

export function MessageSearch({ messages, onMessageClick }: MessageSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<Message[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = messages.filter((message) => message.content.toLowerCase().includes(term))
    setResults(filtered)
  }, [searchTerm, messages])

  const handleMessageClick = (messageId: string) => {
    onMessageClick(messageId)
    setIsOpen(false)
  }

  const formatPreview = (content: string, term: string) => {
    if (!term) return content.slice(0, 100) + (content.length > 100 ? "..." : "")

    const lowerContent = content.toLowerCase()
    const index = lowerContent.indexOf(term.toLowerCase())

    if (index === -1) return content.slice(0, 100) + (content.length > 100 ? "..." : "")

    const start = Math.max(0, index - 40)
    const end = Math.min(content.length, index + term.length + 40)
    let preview = content.slice(start, end)

    if (start > 0) preview = "..." + preview
    if (end < content.length) preview = preview + "..."

    return preview
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search messages</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search message content..."
              className="pl-8 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10 rounded-l-none"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear</span>
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="mt-4 max-h-[300px]">
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "cursor-pointer rounded-md p-2 hover:bg-muted",
                    message.role === "user" ? "border-l-2 border-primary" : "border-l-2 border-muted-foreground",
                  )}
                  onClick={() => handleMessageClick(message.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{message.role === "user" ? "You" : "Gemini AI"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">{formatPreview(message.content, searchTerm)}</p>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center py-8 text-muted-foreground">No messages found matching "{searchTerm}"</div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Type to search messages</div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

