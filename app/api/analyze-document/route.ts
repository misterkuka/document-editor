import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { documentText } = await request.json()

    if (!documentText) {
      return NextResponse.json({ error: "Document text is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Analyze this document and identify all fillable fields that would typically need to be completed by a user. 

Document content:
${documentText}

Please identify fields such as:
- Names (first name, last name, full name)
- Addresses (street, city, state, zip)
- Contact information (phone, email)
- Dates (birth date, signature date, etc.)
- Numbers (SSN, ID numbers, amounts)
- Text fields (descriptions, comments)
- Checkboxes or selections

For each field found, provide a JSON response in this exact format:
{
  "fields": [
    {
      "name": "field_name",
      "type": "text|number|date|email|phone|address|checkbox",
      "description": "Brief description of what this field is for",
      "placeholder": "[[FIELD_NAME]]",
      "required": true|false,
      "currentValue": "string"
    }
  ]
}

Only return the JSON itself.`,
      system:
        "You are a document analysis expert. Analyze documents to identify fillable fields that users would need to complete. Return only valid JSON,  no other text or json/markdown prefixes, just the JSON string that can be parsed without errors with JSON.parse function.",
    })

    return NextResponse.json({ analysis: text })
  } catch (error) {
    console.error("Error analyzing document:", error)
    return NextResponse.json({ error: "Failed to analyze document" }, { status: 500 })
  }
}
