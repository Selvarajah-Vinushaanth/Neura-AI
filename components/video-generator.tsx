"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Download, VideoIcon, X } from "lucide-react"
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
import { generateVideoFromTemplate } from "@/actions/generate-video"

interface VideoGeneratorProps {
  onVideoSelect?: (videoUrl: string) => void
}

export function VideoGenerator({ onVideoSelect }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideos, setGeneratedVideos] = useState<{ url: string }[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [numberOfVideos, setNumberOfVideos] = useState(1)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the video you want to generate",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedVideos([])

    try {
      const result = await generateVideoFromTemplate(prompt, numberOfVideos)

      if (result.success && result.videoUrl) {
        setGeneratedVideos([{ url: result.videoUrl }])
        toast({
          title: "Video generated",
          description: "Successfully generated the video",
        })
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "Failed to generate videos. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const clearVideos = () => {
    setGeneratedVideos([])
    setPrompt("")
  }

  const handleVideoSelect = (videoUrl: string) => {
    if (onVideoSelect) {
      onVideoSelect(videoUrl)
      setIsOpen(false)
    }
  }

  const downloadVideo = async (videoUrl: string, index: number) => {
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `generated-video-${index + 1}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Video downloaded",
        description: "The video has been saved to your device",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the video. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <VideoIcon className="h-5 w-5" />
          <span className="sr-only">Generate Videos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Videos</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 overflow-hidden">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Describe the video you want to generate..."
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
                <Label htmlFor="number-of-videos">Number of Videos: {numberOfVideos}</Label>
              </div>
              <Slider
                id="number-of-videos"
                min={1}
                max={4}
                step={1}
                value={[numberOfVideos]}
                onValueChange={(value) => setNumberOfVideos(value[0])}
                disabled={isGenerating}
                className="w-full"
              />
            </div> */}
          </div>

          <AnimatePresence>
            {generatedVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Generated Videos</h3>
                  <Button variant="ghost" size="sm" onClick={clearVideos}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[400px] p-1">
                  {generatedVideos.map((video, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-0 relative group">
                        <video controls className="w-full h-auto">
                          <source src={video.url} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleVideoSelect(video.url)}
                          >
                            Use Video
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => downloadVideo(video.url, index)}
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
              <p className="text-center text-muted-foreground">Generating your videos... This may take a moment.</p>
            </div>
          )}

          {!isGenerating && generatedVideos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <VideoIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No videos generated yet</h3>
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
