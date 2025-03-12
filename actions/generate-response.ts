"use server"

import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import type { Message } from "@/types/chat"

export async function generateChatResponse({
  messages,
  prompt,
  hasImage,
  formData,
  model = "gemini-1.5-flash",
}: {
  messages: Message[]
  prompt: string
  hasImage: boolean
  formData?: FormData | null
  model?: string
}) {
  try {
    // If there's an image, handle image-to-text generation
    if (hasImage && formData) {
      const imageFile = formData.get("image") as File
      const imagePrompt = (formData.get("prompt") as string) || "Describe this image in detail"

      if (!imageFile) {
        throw new Error("No image file provided")
      }

      const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

      const { text } = await generateText({
        model: google(model),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: imagePrompt },
              {
                type: "file",
                data: imageBuffer,
                mimeType: imageFile.type,
              },
            ],
          },
        ],
      })

      return text
    }

    // For text-only generation, use chat history for context
    const chatHistory = messages
      .filter((m) => !m.isError) // Filter out error messages
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))

    const { text } = await generateText({
      model: google(model),
      messages: chatHistory,
    })

    return text
  } catch (error) {
    console.error("Error generating response:", error)
    throw new Error("Failed to generate response")
  }
}

