import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Wand2 } from "lucide-react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PromptEnhancerProps {
  prompt: string
  onEnhancedPrompt: (enhancedPrompt: string) => void
  isDisabled?: boolean
}

export function PromptEnhancer({ prompt, onEnhancedPrompt, isDisabled }: PromptEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const { toast } = useToast()

  const enhancePrompt = async () => {
    if (!prompt.trim()) return
    
    setIsEnhancing(true)
    try {
      const response = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.enhancedPrompt) {
        onEnhancedPrompt(data.enhancedPrompt)
        toast({
          title: "Prompt Enhanced",
          description: "Your prompt has been improved with AI suggestions",
        })
      } else if (data.error) {
        throw new Error(data.error)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error)
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : "Could not enhance the prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          disabled={isDisabled || !prompt.trim() || isEnhancing}
        >
          {isEnhancing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Wand2 className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">Enhance Prompt</h4>
          <p className="text-sm text-muted-foreground">
            Make your prompt more detailed and effective using AI suggestions
          </p>
          <Button
            size="sm"
            className="w-full"
            onClick={enhancePrompt}
            disabled={!prompt.trim() || isEnhancing}
          >
            {isEnhancing ? "Enhancing..." : "Enhance"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
