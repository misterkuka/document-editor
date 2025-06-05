"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User } from "lucide-react"
import { createOpenAI } from "@ai-sdk/openai"

// Configure OpenAI client with API key
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  docxContent: ArrayBuffer | null
  fileName: string
}

export default function ChatInterface({ docxContent, fileName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your document assistant. I can help you:\n\n• Analyze documents for fillable fields\n• Fill out forms automatically\n• Answer questions about your document\n• Guide you through document completion\n\nUpload a document to get started!",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (docxContent && fileName) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I see you've uploaded "${fileName}". How can I help you with this document?`,
        },
      ])
    }
  }, [docxContent, fileName])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput("")

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    setIsLoading(true)

    try {
      const context = docxContent
        ? `The user has uploaded a document named "${fileName}".`
        : "No document has been uploaded yet."

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const { response: aiResponse } = await response.json()

      // Add assistant response to chat
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }])
    } catch (error) {
      console.error("Error generating response:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error while processing your request. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          Document Assistant
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="flex items-center mb-1">
                {message.role === "user" ? <User className="h-4 w-4 mr-1" /> : <Bot className="h-4 w-4 mr-1" />}
                <span className="text-xs font-medium">{message.role === "user" ? "You" : "Assistant"}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your document..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
