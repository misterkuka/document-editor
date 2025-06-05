"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface IdentifiedField {
  name: string
  type: string
  description: string
  placeholder: string
  currentValue?: string
  required: boolean
}

interface FieldManagerProps {
  docxContent: ArrayBuffer | null
  fileName: string
  onFieldsIdentified: (fields: IdentifiedField[]) => void
  identifiedFields: IdentifiedField[]
  isAnalyzing: boolean
  setIsAnalyzing: (analyzing: boolean) => void
}

export default function FieldManager({
  docxContent,
  fileName,
  onFieldsIdentified,
  identifiedFields,
  isAnalyzing,
  setIsAnalyzing,
}: FieldManagerProps) {
  const [documentText, setDocumentText] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    const extractDocumentText = async () => {
      if (!docxContent) return

      try {
        // Import docx-preview to extract text content
        const { renderAsync } = await import("docx-preview")
        const tempContainer = document.createElement("div")

        await renderAsync(docxContent, tempContainer, undefined, {
          inWrapper: false,
          ignoreWidth: true,
          ignoreHeight: true,
        })

        // Extract plain text from the rendered HTML
        const textContent = tempContainer.textContent || tempContainer.innerText || ""
        setDocumentText(textContent)
      } catch (error) {
        console.error("Error extracting document text:", error)
      }
    }

    extractDocumentText()
  }, [docxContent])

  const analyzeDocument = async () => {
    if (!documentText) {
      toast({
        title: "No Document",
        description: "Please upload a document first",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/analyze-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentText }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze document")
      }

      const { analysis } = await response.json()

      try {
        const parsedResponse = JSON.parse(analysis)
        if (parsedResponse.fields && Array.isArray(parsedResponse.fields)) {
          onFieldsIdentified(parsedResponse.fields)
          toast({
            title: "Analysis Complete",
            description: `Found ${parsedResponse.fields.length} fillable fields`,
          })
        } else {
          throw new Error("Invalid response format")
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        toast({
          title: "Analysis Error",
          description: "Failed to parse field analysis results",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error analyzing document:", error)
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze document for fillable fields",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const applyPlaceholders = async () => {
    console.log(identifiedFields)
    if (identifiedFields.length === 0) {
      toast({
        title: "No Fields",
        description: "Please analyze the document first to identify fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Get the current document content from the editor
      const documentContainer = document.querySelector(".document-container")
      if (!documentContainer) {
        console.log("Document container not found")
        return
      }

      let content = documentContainer.innerHTML

      // Replace identified field content with placeholders
      identifiedFields.forEach((field) => {
        // This is a simplified replacement - in a real implementation,
        // you'd want more sophisticated text matching
        const patterns = [
          new RegExp(`\\b${field.name}\\b`, "gi"),
          /_+/g, // Replace underlines commonly used for fill-in fields
          /\.{3,}/g, // Replace dots used for fill-in fields
        ]

        patterns.forEach((pattern) => {
          content = content.replace(pattern, field.placeholder)
        })
      })

      //replace current values as well - this must happen after regex so they dont collide
      identifiedFields.forEach((field) => {
        content = content.replace(new RegExp(`\\b${field.currentValue}\\b`, "gi"), field.placeholder)
      })

      // Update the document content
      documentContainer.innerHTML = content
      console.log("Placeholders applied:", identifiedFields)
      toast({
        title: "Placeholders Applied",
        description: `Applied ${identifiedFields.length} placeholders to the document`,
      })
    } catch (error) {
      console.error("Error applying placeholders:", error)
      toast({
        title: "Error",
        description: "Failed to apply placeholders to document",
        variant: "destructive",
      })
    }
  }

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case "date":
        return "📅"
      case "email":
        return "📧"
      case "phone":
        return "📞"
      case "address":
        return "🏠"
      case "number":
        return "🔢"
      case "checkbox":
        return "☑️"
      default:
        return "📝"
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Field Manager
        </h2>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4">
          <Button onClick={analyzeDocument} disabled={isAnalyzing || !docxContent} className="w-full mb-4">
            <Search className="mr-2 h-4 w-4" />
            {isAnalyzing ? "Analyzing Document..." : "Analyze Document"}
          </Button>

          {identifiedFields.length > 0 && (
            <Button onClick={applyPlaceholders} variant="outline" className="w-full mb-4">
              <CheckCircle className="mr-2 h-4 w-4" />
              Apply Placeholders
            </Button>
          )}
        </div>

        <Separator />

        <ScrollArea className="flex-1 p-4">
          {identifiedFields.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No fields identified yet.</p>
              <p className="text-sm">Upload a document and click "Analyze Document" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700 mb-3">Identified Fields ({identifiedFields.length})</h3>
              {identifiedFields.map((field, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <span className="mr-2">{getFieldTypeIcon(field.type)}</span>
                      <h4 className="font-medium text-sm">{field.name}</h4>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {field.type}
                      </Badge>
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{field.description}</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{field.placeholder}</code>
                  <div className="mt-2 flex-col gap-2">
                    <div className="font-semibold text-sm flex items-center gap-2">Current value:</div>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{field.currentValue}</code>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
