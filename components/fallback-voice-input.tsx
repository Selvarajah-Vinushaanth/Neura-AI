"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Mic } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FallbackVoiceInputProps {
  onTranscript: (text: string) => void
  isDisabled?: boolean
}

export function FallbackVoiceInput({ onTranscript, isDisabled = false }: FallbackVoiceInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")
  const { toast } = useToast()

  const handleSubmit = () => {
    if (text.trim()) {
      onTranscript(text.trim())
      setText("")
      setIsOpen(false)
      toast({
        title: "Text added",
        description: "Your text has been added to the input field.",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full p-2"
          disabled={isDisabled}
          title="Voice input (fallback mode)"
        >
          <Mic className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Input (Fallback Mode)</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Voice input is currently unavailable. Please type what you would like to say instead.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message here..."
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!text.trim()}>
            Add Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

