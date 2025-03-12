import ChatInterface from "@/components/chat-interface"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 h-full overflow-hidden">
        <ChatInterface />
      </div>
      <Toaster />
    </main>
  )
}

