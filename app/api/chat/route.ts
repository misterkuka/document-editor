import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: message,
      system: `You are a helpful document assistant specializing in form filling and document analysis. ${context || ""} 

You can help users:
- Understand what fields need to be filled in their documents
- Provide guidance on how to complete forms
- Explain document requirements
- Suggest appropriate values for different field types
- Help with document formatting and structure

Be concise but helpful in your responses.`,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error generating chat response:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
