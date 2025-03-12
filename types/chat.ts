export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  hasImage?: boolean
  imageUrl?: string | null
  isError?: boolean
}

