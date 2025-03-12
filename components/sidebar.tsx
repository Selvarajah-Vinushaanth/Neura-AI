"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, MessageSquare, Trash2, Menu, X, MoreVertical, Edit, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/hooks/use-chat-store"
import { ThemeToggle } from "@/components/theme-toggle"
import { useMediaQuery } from "@/hooks/use-media-query"
import { UserProfile } from "./user-profile"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

export function Sidebar() {
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()

  const { chats, activeChat, createNewChat, setActiveChat, deleteChat, updateChatTitle } = useChatStore()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [isMobile])

  const handleDeleteChat = (id: string) => {
    setChatToDelete(id)
  }

  const confirmDelete = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete)
      setChatToDelete(null)
      toast({
        title: "Chat deleted",
        description: "The conversation has been deleted",
      })
    }
  }

  const startEditingTitle = (id: string, currentTitle: string) => {
    setEditingChatId(id)
    setEditTitle(currentTitle === "New Conversation" ? "" : currentTitle)
  }

  const saveTitle = () => {
    if (editingChatId) {
      if (editTitle.length > 20) {
        toast({
          title: "Title too long",
          description: "Chat title must be 20 characters or less",
          status: "error",
        })
        return
      }
      updateChatTitle(editingChatId, editTitle || "New Conversation")
      setEditingChatId(null)
      toast({
        title: "Title updated",
        description: "Chat title has been updated",
      })
    }
  }


  if (!isMounted) return null

  return (
    <>
      {isMobile && (
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </Button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "bg-muted/40 border-r h-full transition-all duration-300 flex flex-col",
              "w-64",
              isMobile ? "fixed inset-y-0 left-0 z-40" : "",
            )}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">Neura AI</h2>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserProfile />
              </div>
            </div>

            <div className="p-3">
              <Button
                onClick={() => {
                  createNewChat()
                  if (isMobile) setIsOpen(false)
                }}
                className="w-full justify-start gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                New Chatterbox
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3">
              <AnimatePresence>
                {chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "group flex items-center gap-2 rounded-md p-2 text-sm cursor-pointer hover:bg-muted mb-1",
                      activeChat === chat.id && "bg-muted",
                    )}
                    onClick={() => {
                      if (editingChatId !== chat.id) {
                        setActiveChat(chat.id)
                        if (isMobile) setIsOpen(false)
                      }
                    }}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />

                    {editingChatId === chat.id ? (
                      <div className="flex items-center flex-1 gap-1">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-7 py-1 text-sm"
                          placeholder="Chat title"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              saveTitle()
                            } else if (e.key === "Escape") {
                              e.preventDefault()
                              setEditingChatId(null)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            saveTitle()
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate flex-1">{chat.title || "New Conversation"}</span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" side="right">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingTitle(chat.id, chat.title)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteChat(chat.id)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {chats.length === 0 && <div className="text-center text-muted-foreground py-6">No conversations yet</div>}
            </ScrollArea>

            <div className="p-3 border-t text-xs text-muted-foreground">Powered by Neura AI</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

