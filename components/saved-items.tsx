"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Bookmark,
  BookmarkCheck,
  MoreVertical,
  Trash2,
  Edit,
  Plus,
  Folder,
  Download,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react"
import { useSavedItemsStore, type Collection } from "@/hooks/use-saved-items-store"
import { useChatStore } from "@/hooks/use-chat-store"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface SavedItemsProps {
  className?: string
}

export function SavedItems({ className }: SavedItemsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [newCollectionDescription, setNewCollectionDescription] = useState("")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemNotes, setItemNotes] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  const {
    savedItems,
    collections,
    unsaveItem,
    updateItemNotes,
    moveItemToCollection,
    createCollection,
    updateCollection,
    deleteCollection,
  } = useSavedItemsStore()

  const { activeChat, addMessage, createNewChat, setActiveChat } = useChatStore()
  const { toast } = useToast()

  // Filter items based on active tab
  const filteredItems = activeTab === "all" ? savedItems : savedItems.filter((item) => item.collectionId === activeTab)

  const handleEditNotes = (itemId: string, currentNotes: string) => {
    setEditingItemId(itemId)
    setItemNotes(currentNotes)
  }

  const saveNotes = () => {
    if (editingItemId) {
      updateItemNotes(editingItemId, itemNotes)
      setEditingItemId(null)
      toast({
        title: "Notes updated",
        description: "Your notes have been saved",
      })
    }
  }

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return

    createCollection(newCollectionName, newCollectionDescription)
    setNewCollectionName("")
    setNewCollectionDescription("")
    toast({
      title: "Collection created",
      description: `"${newCollectionName}" has been created`,
    })
  }

  const handleUpdateCollection = () => {
    if (!editingCollection || !newCollectionName.trim()) return

    updateCollection(editingCollection.id, {
      name: newCollectionName,
      description: newCollectionDescription,
    })

    setEditingCollection(null)
    toast({
      title: "Collection updated",
      description: "Collection details have been updated",
    })
  }

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection)
    setNewCollectionName(collection.name)
    setNewCollectionDescription(collection.description)
  }

  const handleDeleteCollection = (id: string) => {
    deleteCollection(id)
    if (activeTab === id) {
      setActiveTab("all")
    }
    toast({
      title: "Collection deleted",
      description: "Collection and its items have been removed",
    })
  }

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(itemId)
      toast({
        title: "Copied to clipboard",
        description: "Content copied to clipboard",
      })
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      })
    }
  }

  const continueConversation = (item: any) => {
    // If no active chat, create one
    if (!activeChat) {
      const newChatId = createNewChat()
      setActiveChat(newChatId)

      // Add the saved message to the new chat
      setTimeout(() => {
        addMessage(newChatId, item.message)
      }, 100)
    } else {
      // Add the saved message to the current chat
      addMessage(activeChat, item.message)
    }

    setIsOpen(false)
    toast({
      title: "Message added to chat",
      description: "You can now continue the conversation",
    })
  }

  const exportSavedItems = () => {
    try {
      const dataStr = JSON.stringify(savedItems, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

      const exportFileDefaultName = `gemini-saved-items-${new Date().toISOString().split("T")[0]}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      toast({
        title: "Export successful",
        description: "Your saved items have been exported",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your saved items",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" className={cn("relative", className)} onClick={() => setIsOpen(true)}>
        <Bookmark className="h-5 w-5" />
        {savedItems.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {savedItems.length}
          </span>
        )}
        <span className="sr-only">Saved Items</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Saved Items</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-4 flex-1 overflow-hidden">
            {/* Collections sidebar */}
            <div className="w-full sm:w-64 flex flex-col border-r pr-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Collections</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="p-2 w-60">
                      <h4 className="font-medium mb-2">New Collection</h4>
                      <div className="space-y-2">
                        <Input
                          placeholder="Collection name"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={newCollectionDescription}
                          onChange={(e) => setNewCollectionDescription(e.target.value)}
                          className="h-20"
                        />
                        <Button
                          className="w-full"
                          onClick={handleCreateCollection}
                          disabled={!newCollectionName.trim()}
                        >
                          Create Collection
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-1 py-2">
                  <Button
                    variant={activeTab === "all" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("all")}
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    All Saved Items
                    <Badge className="ml-auto">{savedItems.length}</Badge>
                  </Button>

                  {collections
                    .filter((c) => c.id !== "default")
                    .map((collection) => (
                      <div key={collection.id} className="flex items-center group">
                        <Button
                          variant={activeTab === collection.id ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setActiveTab(collection.id)}
                        >
                          <Folder className="h-4 w-4 mr-2" style={{ color: collection.color }} />
                          <span className="truncate">{collection.name}</span>
                          <Badge className="ml-auto">
                            {savedItems.filter((item) => item.collectionId === collection.id).length}
                          </Badge>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCollection(collection)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteCollection(collection.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                </div>
              </ScrollArea>

              <Button variant="outline" className="mt-4 w-full" onClick={exportSavedItems}>
                <Download className="h-4 w-4 mr-2" />
                Export All Items
              </Button>
            </div>

            {/* Saved items content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="mb-4">
                <h2 className="text-lg font-medium">
                  {activeTab === "all"
                    ? "All Saved Items"
                    : collections.find((c) => c.id === activeTab)?.name || "Collection"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "all"
                    ? `${savedItems.length} saved items`
                    : collections.find((c) => c.id === activeTab)?.description || ""}
                </p>
              </div>

              <ScrollArea className="flex-1">
                <AnimatePresence>
                  {filteredItems.length > 0 ? (
                    <div className="space-y-4 pr-2">
                      {filteredItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={item.message.role === "user" ? "/user-avatar.png" : "/gemini-avatar.png"}
                                      alt={item.message.role === "user" ? "You" : "Gemini AI"}
                                    />
                                    <AvatarFallback>{item.message.role === "user" ? "U" : "AI"}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <CardTitle className="text-sm">
                                      {item.message.role === "user" ? "You" : "Gemini AI"}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                      {new Date(item.savedAt).toLocaleString()}
                                    </CardDescription>
                                  </div>
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => copyToClipboard(item.message.content, item.id)}>
                                      {copied === item.id ? (
                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                      ) : (
                                        <Copy className="h-4 w-4 mr-2" />
                                      )}
                                      Copy Content
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => continueConversation(item)}>
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Continue in Chat
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleEditNotes(item.id, item.notes)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Notes
                                    </DropdownMenuItem>

                                    {/* Move to collection submenu */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger className="w-full px-2 py-1.5 text-sm cursor-default flex items-center">
                                        <Folder className="h-4 w-4 mr-2" />
                                        Move to Collection
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent side="right">
                                        <DropdownMenuItem
                                          onClick={() => moveItemToCollection(item.id, null)}
                                          className={item.collectionId === null ? "bg-muted" : ""}
                                        >
                                          Uncategorized
                                        </DropdownMenuItem>
                                        {collections.map((collection) => (
                                          <DropdownMenuItem
                                            key={collection.id}
                                            onClick={() => moveItemToCollection(item.id, collection.id)}
                                            className={item.collectionId === collection.id ? "bg-muted" : ""}
                                          >
                                            <div className="flex items-center w-full">
                                              <div
                                                className="h-3 w-3 rounded-full mr-2"
                                                style={{ backgroundColor: collection.color }}
                                              />
                                              {collection.name}
                                            </div>
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => unsaveItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove from Saved
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>

                            <CardContent>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap break-words text-sm">
                                  {item.message.content.length > 300
                                    ? item.message.content.slice(0, 300) + "..."
                                    : item.message.content}
                                </p>
                              </div>

                              {item.notes && (
                                <div className="mt-2 p-2 bg-muted rounded-md">
                                  <p className="text-xs font-medium mb-1">Your Notes:</p>
                                  <p className="text-sm">{item.notes}</p>
                                </div>
                              )}
                            </CardContent>

                            <CardFooter className="pt-0 flex justify-between">
                              <div className="flex items-center gap-2">
                                {item.collectionId && (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                    style={{
                                      borderColor:
                                        collections.find((c) => c.id === item.collectionId)?.color || "currentColor",
                                      color:
                                        collections.find((c) => c.id === item.collectionId)?.color || "currentColor",
                                    }}
                                  >
                                    <Folder className="h-3 w-3" />
                                    {collections.find((c) => c.id === item.collectionId)?.name || "Collection"}
                                  </Badge>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => continueConversation(item)}
                              >
                                Continue in Chat
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <BookmarkCheck className="h-12 w-12 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">No saved items</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === "all" ? "You haven't saved any messages yet" : "This collection is empty"}
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit collection dialog */}
      {editingCollection && (
        <Dialog open={!!editingCollection} onOpenChange={(open) => !open && setEditingCollection(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Collection</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Collection description"
                  className="h-20"
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleUpdateCollection} disabled={!newCollectionName.trim()}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit notes dialog */}
      {editingItemId && (
        <Dialog open={!!editingItemId} onOpenChange={(open) => !open && setEditingItemId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Notes</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <Textarea
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Add your notes about this saved item..."
                className="h-32"
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={saveNotes}>Save Notes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

