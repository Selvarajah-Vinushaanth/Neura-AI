"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, ImageIcon, Trash2, PlusCircle, Sparkles, FileIcon } from "lucide-react"
import ChatMessage from "./chat-message"
import type { Message } from "@/types/chat"
import { useChatStore } from "@/hooks/use-chat-store"
import { generateChatResponse } from "@/actions/generate-response"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { SmartVoiceInput } from "./smart-voice-input"
import { PromptTemplates } from "./prompt-templates"
import { ExportChat } from "./export-chat"
import { MessageSearch } from "./message-search"
import { SavedItems } from "./saved-items"
import { ImageGenerator } from "./image-generator"
import { ModelSelector } from "./model-selector"
import { Toaster } from "@/components/ui/toaster"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { generateVideoFromTemplate } from "@/actions/generate-video"

export default function ChatInterface() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [currentModel, setCurrentModel] = useState("gemini-1.5-flash")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [fileSummary, setFileSummary] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const { activeChat, createNewChat, addMessage, getChatMessages, clearMessages, chats, updateChatTitle } = useChatStore()

  const messages = activeChat ? getChatMessages(activeChat) : []
  const activeTitle = activeChat ? chats.find((c) => c.id === activeChat)?.title || "New Conversation" : ""

  // Create a new chat if none exists
  useEffect(() => {
    if (!activeChat && typeof window !== "undefined") {
      createNewChat()
    }
  }, [activeChat, createNewChat])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Clear highlight after a delay
  useEffect(() => {
    if (highlightedMessageId) {
      const timer = setTimeout(() => {
        setHighlightedMessageId(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedMessageId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleImageUpload(acceptedFiles[0])
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedImage && !generatedImageUrl && !selectedFile) || isLoading || !activeChat) return

    // Set chat title if this is the first message
    const currentMessages = getChatMessages(activeChat)
    if (currentMessages.length === 0 && input.trim()) {
      const titleText = input.trim().slice(0, 20) + (input.length > 20 ? "..." : "")
      updateChatTitle(activeChat, titleText)
    }

    if (selectedFile) {
      try {
        setIsLoading(true)
        // Add user message with file and prompt
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: input || "Please analyze this file",
          timestamp: new Date().toISOString(),
          hasFile: true,
          fileMetadata: {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type
          }
        }
        addMessage(activeChat, userMessage)

        const result = await generateVideoFromTemplate(
          'default-template',
          'default-modifications',
          selectedFile
        )

        if (result.success && result.fileSummary) {
          addMessage(activeChat, {
            id: Date.now().toString(),
            role: "assistant",
            content: result.fileSummary,
            timestamp: new Date().toISOString(),
          })
        } else {
          addMessage(activeChat, {
            id: Date.now().toString(),
            role: "assistant",
            content: "Sorry, I couldn't analyze this file. Please try again.",
            timestamp: new Date().toISOString(),
            isError: true,
          })
        }
      } catch (error) {
        console.error('Error handling file upload:', error)
        addMessage(activeChat, {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error processing your file. Please try again.",
          timestamp: new Date().toISOString(),
          isError: true,
        })
      } finally {
        setIsLoading(false)
        setInput("")
        setSelectedFile(null)
        setFilePreview(null)
        setFileSummary(null)
      }
      return
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
      hasImage: !!selectedImage || !!generatedImageUrl,
      imageUrl: imagePreview || generatedImageUrl,
      hasFile: !!selectedFile,
      fileUrl: filePreview,
    }
    addMessage(activeChat, userMessage)

    // Clear input
    setInput("")

    // Set loading state
    setIsLoading(true)

    try {
      // Prepare form data for image or file if present
      let formData = null
      if (selectedImage) {
        formData = new FormData()
        formData.append("image", selectedImage)
        formData.append("prompt", input || "Describe this image in detail")
      } else if (generatedImageUrl) {
        const response = await fetch(generatedImageUrl)
        const blob = await response.blob()
        const file = new File([blob], "generated-image.png", { type: "image/png" })

        formData = new FormData()
        formData.append("image", file)
        formData.append("prompt", input || "Describe this image in detail")
      } else if (selectedFile) {
        formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("prompt", input || "Summarize this document")
      }

      // Generate response
      const response = await generateChatResponse({
        messages: [...messages, userMessage],
        prompt: input,
        hasImage: !!selectedImage || !!generatedImageUrl,
        hasFile: !!selectedFile,
        formData,
        model: currentModel,
      })

      // Add AI response
      addMessage(activeChat, {
        id: Date.now().toString(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      })

      // Clear image and file after sending
      setSelectedImage(null)
      setImagePreview(null)
      setGeneratedImageUrl(null)
      setSelectedFile(null)
      setFilePreview(null)
      setFileSummary(null)
    } catch (error) {
      console.error("Error generating response:", error)
      // Add error message
      addMessage(activeChat, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (file: File) => {
    setSelectedImage(file)
    setGeneratedImageUrl(null)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileUpload = async (file: File) => {
    // Just set the file and preview without sending
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setFilePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    toast({
      title: "File selected",
      description: "Write an optional message and press send",
    })
  }

  const handleGeneratedImage = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl)
    setSelectedImage(null)
    setImagePreview(null)

    toast({
      title: "Image added",
      description: "Generated image has been added to your message",
    })
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setGeneratedImageUrl(null)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    setFileSummary(null)
  }

  const handleVoiceInput = (transcript: string) => {
    setInput((prev) => prev + (prev ? " " : "") + transcript)
    toast({
      title: "Voice input received",
      description: transcript,
      duration: 3000,
    })
  }

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      // Highlight the message
      setHighlightedMessageId(messageId)
    }
  }

  if (!activeChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button onClick={createNewChat} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Start a new chat
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">Neura AI Chat</h1>
        <div className="flex items-center gap-2">
          <ModelSelector onSelectModel={setCurrentModel} currentModel={currentModel} />
          <SavedItems />
          <MessageSearch messages={messages} onMessageClick={scrollToMessage} />
          <ExportChat messages={messages} chatTitle={activeTitle} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeChat) {
                clearMessages(activeChat)
                toast({
                  title: "Chat cleared",
                  description: "All messages have been removed",
                })
              }
            }}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear Chat</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center h-full text-center p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold mb-2">Welcome to Neura AI Chat!</h3>
            <p className="text-muted-foreground mb-4">
              Ask me anything, upload an image for analysis, or generate images with Neura.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              <Card className="p-4 flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Chat with Neura</h4>
                <p className="text-sm text-muted-foreground">
                  Ask questions, get creative content, or have a conversation
                </p>
              </Card>
              <Card className="p-4 flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Analyze Images</h4>
                <p className="text-sm text-muted-foreground">Upload images for detailed analysis and descriptions</p>
              </Card>
              <Card className="p-4 flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Generate Images</h4>
                <p className="text-sm text-muted-foreground">Create custom images with Neura's Imagen model</p>
              </Card>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4 pb-4 max-w-3xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  scrollToMessage={scrollToMessage}
                  isHighlighted={message.id === highlightedMessageId}
                />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        <Card className="m-4 border rounded-lg">
          <div className="p-3">
            {(imagePreview || generatedImageUrl || filePreview) && (
              <motion.div
                className="relative mb-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="relative rounded-md overflow-hidden w-24 h-24 flex items-center justify-center bg-muted">
                  {imagePreview || generatedImageUrl ? (
                    <>
                      <img
                        src={imagePreview || generatedImageUrl || "/placeholder.svg"}
                        alt="Media preview"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5"
                        onClick={clearImage}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : filePreview && (
                    <>
                      <div className="flex items-center justify-center w-full h-full">
                        <FileIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5"
                        onClick={clearFile}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex items-center justify-center rounded-full p-2 cursor-pointer hover:bg-muted transition-colors",
                    isDragActive && "bg-muted",
                  )}
                >
                  <input {...getInputProps()} />
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="flex items-center justify-center rounded-full p-2 cursor-pointer hover:bg-muted transition-colors"
                >
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                </div>

                <input
                  id="file-input"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload(file)
                    }
                  }}
                />

                <ImageGenerator onImageSelect={handleGeneratedImage} />
                <PromptTemplates onSelectPrompt={setInput} />
                <SmartVoiceInput onTranscript={handleVoiceInput} isDisabled={isLoading} />
              </div>

              <Input
                placeholder="Message Neura AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />

              <Button
                type="submit"
                size="icon"
                disabled={(!input.trim() && !selectedImage && !generatedImageUrl && !selectedFile) || isLoading}
                className="rounded-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>

      <Toaster />
    </div>
  )
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / 1048576).toFixed(1) + ' MB'
}

