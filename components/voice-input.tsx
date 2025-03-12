"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  isDisabled?: boolean
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function VoiceInput({ onTranscript, isDisabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3
  const { toast } = useToast()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
          setIsSupported(true)
          const recognition = new SpeechRecognition()

          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = "en-US"

          setRecognitionInstance(recognition)
        } else {
          setIsSupported(false)
        }
      } catch (error) {
        console.error("Speech recognition initialization error:", error)
        setIsSupported(false)
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Set up event handlers when recognition instance changes
  useEffect(() => {
    if (!recognitionInstance) return

    const handleResult = (event: any) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
      // Reset retry count on successful results
      setRetryCount(0)
    }

    const handleError = (event: any) => {
      console.error("Speech recognition error", event.error)

      // Handle network errors specifically
      if (event.error === "network") {
        if (retryCount < maxRetries) {
          // Increment retry count
          setRetryCount((prev) => prev + 1)

          // Show toast with retry information
          toast({
            title: "Network issue detected",
            description: `Retrying... (${retryCount + 1}/${maxRetries})`,
            variant: "default",
          })

          // Stop current instance
          try {
            recognitionInstance.stop()
          } catch (e) {
            // Ignore errors when stopping
          }

          // Try to restart after a delay
          timeoutRef.current = setTimeout(() => {
            if (isListening) {
              try {
                recognitionInstance.start()
              } catch (e) {
                handleStopListening()
                toast({
                  title: "Voice input failed",
                  description: "Could not restart voice recognition. Please try again later.",
                  variant: "destructive",
                })
              }
            }
          }, 1000)
        } else {
          // Max retries reached
          handleStopListening()
          toast({
            title: "Voice input unavailable",
            description: "Network connection issues. Please check your internet connection and try again.",
            variant: "destructive",
          })
        }
      } else {
        // Handle other errors
        handleStopListening()
        toast({
          title: "Voice input error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive",
        })
      }
    }

    const handleEnd = () => {
      // Only set isListening to false if we're not in a retry cycle
      if (retryCount >= maxRetries) {
        setIsListening(false)
      }
    }

    // Add event listeners
    recognitionInstance.onresult = handleResult
    recognitionInstance.onerror = handleError
    recognitionInstance.onend = handleEnd

    return () => {
      // Remove event listeners
      recognitionInstance.onresult = null
      recognitionInstance.onerror = null
      recognitionInstance.onend = null
    }
  }, [recognitionInstance, isListening, retryCount, maxRetries, toast])

  const handleStartListening = useCallback(() => {
    if (!recognitionInstance) return

    setTranscript("")
    setRetryCount(0)
    setIsListening(true)

    try {
      recognitionInstance.start()
    } catch (error) {
      console.error("Failed to start speech recognition:", error)
      setIsListening(false)
      toast({
        title: "Voice input error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive",
      })
    }
  }, [recognitionInstance, toast])

  const handleStopListening = useCallback(() => {
    if (!recognitionInstance) return

    setIsListening(false)

    try {
      recognitionInstance.stop()
    } catch (error) {
      console.error("Failed to stop speech recognition:", error)
    }

    if (transcript) {
      onTranscript(transcript)
      setTranscript("")
    }
  }, [recognitionInstance, transcript, onTranscript])

  const toggleListening = useCallback(() => {
    if (!isSupported) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input. Please try a different browser.",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      handleStopListening()
    } else {
      handleStartListening()
    }
  }, [isSupported, isListening, handleStartListening, handleStopListening, toast])

  // Don't render if speech recognition is not supported
  if (!isSupported) {
    return null
  }

  return (
    <div className="relative">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn(
          "rounded-full p-2 transition-colors",
          isListening && "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600",
        )}
        onClick={toggleListening}
        disabled={isDisabled}
        title={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      {isListening && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-background border rounded-md p-2 text-xs shadow-md min-w-[150px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="truncate">{transcript || "Listening..."}</span>
          </div>
        </div>
      )}
    </div>
  )
}

