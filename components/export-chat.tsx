"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, Loader2 } from "lucide-react"
import type { Message } from "@/types/chat"
import { useToast } from "@/hooks/use-toast"

interface ExportChatProps {
  messages: Message[]
  chatTitle: string
}

export function ExportChat({ messages, chatTitle }: ExportChatProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const formatDate = () => {
    const date = new Date()
    return date.toISOString().split("T")[0]
  }

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
  }

  const exportAsText = async () => {
    setIsExporting(true)
    try {
      const content = messages
        .map((msg) => {
          const role = msg.role === "user" ? "You" : "Gemini AI"
          const time = new Date(msg.timestamp).toLocaleTimeString()
          return `[${time}] ${role}:\n${msg.content}\n`
        })
        .join("\n")

      const filename = `${sanitizeFilename(chatTitle)}_${formatDate()}.txt`

      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Chat exported successfully",
        description: `Saved as ${filename}`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your chat.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsJSON = async () => {
    setIsExporting(true)
    try {
      const content = JSON.stringify(messages, null, 2)
      const filename = `${sanitizeFilename(chatTitle)}_${formatDate()}.json`

      const blob = new Blob([content], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Chat exported successfully",
        description: `Saved as ${filename}`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your chat.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isExporting || messages.length === 0} className="rounded-full">
          {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          <span className="sr-only">Export chat</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsText}>Export as Text</DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJSON}>Export as JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

