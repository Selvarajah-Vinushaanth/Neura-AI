"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Download, ImageIcon, X } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { generateImageFromPrompt } from "@/actions/generate-image"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

interface ImageGeneratorProps {
  onImageSelect?: (imageUrl: string) => void
}

export function ImageGenerator({ onImageSelect }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<{ url: string; base64: string | null }[]>([])
  const [numberOfImages, setNumberOfImages] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the image you want to generate",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedImages([])

    try {
      const result = await generateImageFromPrompt(prompt, numberOfImages)

      if (result.success && result.images) {
        setGeneratedImages(result.images)
        toast({
          title: "Images generated",
          description: `Successfully generated ${result.images.length} image(s)`,
        })
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Failed to generate images. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating images:", error)
      toast({
        title: "Generation failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageSelect = (imageUrl: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl)
      setIsOpen(false)
    }
  }

  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      // For placeholder images, we'll create a simple canvas image
      if (imageUrl.startsWith("/placeholder")) {
        const canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.fillStyle = "#f0f0f0"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = "#333"
          ctx.font = "24px Arial"
          ctx.textAlign = "center"
          ctx.fillText(`Image ${index + 1}`, canvas.width / 2, canvas.height / 2)

          const dataUrl = canvas.toDataURL("image/png")
          const a = document.createElement("a")
          a.href = dataUrl
          a.download = `generated-image-${index + 1}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)

          toast({
            title: "Placeholder image downloaded",
            description: "A placeholder image has been saved to your device",
          })
          return
        }
      }

      // For real images
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `generated-image-${index + 1}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Image downloaded",
        description: "The image has been saved to your device",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearImages = () => {
    setGeneratedImages([])
    setPrompt("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <ImageIcon className="h-5 w-5" />
          <span className="sr-only">Generate Images</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Images</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 overflow-hidden">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                className="flex-1"
              />
              <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Generate</>
                )}
              </Button>
            </div>

            {/* <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="number-of-images">Number of Images: {numberOfImages}</Label>
              </div>
              <Slider
                id="number-of-images"
                min={1}
                max={4}
                step={1}
                value={[numberOfImages]}
                onValueChange={(value) => setNumberOfImages(value[0])}
                disabled={isGenerating}
                className="w-full"
              />
            </div> */}
          </div>

          <AnimatePresence>
            {generatedImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Generated Images</h3>
                  <Button variant="ghost" size="sm" onClick={clearImages}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[400px] p-1">
                  {generatedImages.map((image, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-0 relative group">
                        <img
                          src={image.url || `data:image/png;base64,${image.base64}`}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-auto object-cover aspect-square cursor-pointer"
                          onClick={() => handleImageSelect(image.url || `data:image/png;base64,${image.base64}`)}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleImageSelect(image.url || `data:image/png;base64,${image.base64}`)}
                          >
                            Use Image
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => downloadImage(image.url || `data:image/png;base64,${image.base64}`, index)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">Generating your images... This may take a moment.</p>
            </div>
          )}

          {!isGenerating && generatedImages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No images generated yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Enter a detailed description of what you want to see, and the AI will create it for you.
                <br />
                For example: "A serene mountain landscape at sunset with a lake reflection"
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

