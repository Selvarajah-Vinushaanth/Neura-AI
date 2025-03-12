"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sparkles } from "lucide-react"

interface PromptTemplatesProps {
  onSelectPrompt: (prompt: string) => void
}

const PROMPT_TEMPLATES = [
  {
    category: "General",
    prompts: [
      "Explain quantum computing in simple terms",
      "Write a short story about a robot learning to love",
      "What are the most important scientific discoveries of the 21st century?",
      "Give me 5 ideas for a weekend project",
    ],
  },
  {
    category: "Creative",
    prompts: [
      "Write a poem about the changing seasons",
      "Create a recipe for a dish that combines Italian and Japanese cuisines",
      "Describe a futuristic city in the year 2150",
      "Design a fictional animal and describe its habitat and behaviors",
    ],
  },
  {
    category: "Professional",
    prompts: [
      "Draft an email requesting a meeting with a potential client",
      "Create a 30-second elevator pitch for a productivity app",
      "Suggest ways to improve team communication in a remote work environment",
      "Write a LinkedIn post announcing a new product launch",
    ],
  },
]

export function PromptTemplates({ onSelectPrompt }: PromptTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Sparkles className="h-5 w-5" />
          <span className="sr-only">Prompt templates</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {PROMPT_TEMPLATES.map((category) => (
          <div key={category.category} className="px-2 py-1.5">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">{category.category}</h3>
            {category.prompts.map((prompt) => (
              <DropdownMenuItem
                key={prompt}
                className="cursor-pointer"
                onClick={() => {
                  onSelectPrompt(prompt)
                  setIsOpen(false)
                }}
              >
                <span className="truncate">{prompt}</span>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

