"use client"

import { useState, useEffect } from "react"
import { VoiceInput } from "./voice-input"
import { FallbackVoiceInput } from "./fallback-voice-input"

interface SmartVoiceInputProps {
  onTranscript: (text: string) => void
  isDisabled?: boolean
}

export function SmartVoiceInput({ onTranscript, isDisabled = false }: SmartVoiceInputProps) {
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Check if speech recognition is supported
    const isSupported =
      typeof window !== "undefined" &&
      (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined)

    setIsSpeechRecognitionSupported(isSupported)
  }, [])

  // Don't render anything during SSR
  if (!isClient) {
    return null
  }

  // Choose the appropriate component based on support
  return isSpeechRecognitionSupported ? (
    <VoiceInput onTranscript={onTranscript} isDisabled={isDisabled} />
  ) : (
    <FallbackVoiceInput onTranscript={onTranscript} isDisabled={isDisabled} />
  )
}

