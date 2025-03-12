"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Sparkles, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ModelSelectorProps {
  onSelectModel: (model: string) => void
  currentModel: string
}

const AVAILABLE_MODELS = [
  {
    id: "gemini-1.5-flash",
    name: "Neura 1.5 Flash",
    description: "Fast responses, good for most tasks",
    isDefault: true,
  },
  {
    id: "gemini-1.5-pro",
    name: "Neura 1.5 Pro",
    description: "More capable, better for complex tasks",
    isDefault: false,
  },
  {
    id: "gemini-2.0-flash-thinking-exp",
    name: "Neura 2.0 Flash Thinking",
    description: "Experimental model with improved reasoning",
    isDefault: false,
    isExperimental: true,
  },
]

export function ModelSelector({ onSelectModel, currentModel }: ModelSelectorProps) {
  const { toast } = useToast()

  const selectedModel = AVAILABLE_MODELS.find((model) => model.id === currentModel) || AVAILABLE_MODELS[0]

  const handleSelectModel = (modelId: string) => {
    onSelectModel(modelId)
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId)

    toast({
      title: `Model changed to ${model?.name}`,
      description: model?.description || "Model has been updated",
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">{selectedModel.name}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select AI Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {AVAILABLE_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            className={`flex flex-col items-start ${model.id === currentModel ? "bg-muted" : ""}`}
            onClick={() => handleSelectModel(model.id)}
          >
            <div className="flex items-center w-full">
              <span className="font-medium">{model.name}</span>
              {model.isExperimental && (
                <span className="ml-auto text-xs bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full">
                  Experimental
                </span>
              )}
              {model.isDefault && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Default</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{model.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

