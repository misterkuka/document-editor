"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import Heading from "@tiptap/extension-heading"
import Bold from "@tiptap/extension-bold"
import Italic from "@tiptap/extension-italic"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"

interface DocumentRendererProps {
  docxContent: ArrayBuffer
  isEditing: boolean
}

export default function DocumentRenderer({ docxContent, isEditing }: DocumentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [htmlContent, setHtmlContent] = useState<string>("")
  const { toast } = useToast()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Document,
      Paragraph,
      Text,
      Heading,
      Bold,
      Italic,
      Underline,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: htmlContent,
    editable: isEditing,
  })

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing)
    }
  }, [isEditing, editor])

  useEffect(() => {
    const renderDocx = async () => {
      try {
        // Import docx-preview dynamically to avoid SSR issues
        const { renderAsync } = await import("docx-preview")

        // Create a temporary container for the docx content
        const tempContainer = document.createElement("div")

        await renderAsync(docxContent, tempContainer, undefined, {
          inWrapper: false,
          ignoreWidth: true,
          ignoreHeight: true,
        })

        // Extract the HTML content
        const extractedHtml = tempContainer.innerHTML
        setHtmlContent(extractedHtml)

        // Also update the preview container
        const previewContainer = document.getElementById("preview-container")
        if (previewContainer) {
          previewContainer.innerHTML = extractedHtml
        }
      } catch (error) {
        console.error("Error rendering DOCX:", error)
        toast({
          title: "Error",
          description: "Failed to render document",
          variant: "destructive",
        })
      }
    }

    if (docxContent) {
      renderDocx()
    }
  }, [docxContent, toast])

  useEffect(() => {
    if (editor && htmlContent) {
      editor.commands.setContent(htmlContent)
    }
  }, [htmlContent, editor])

  return (
    <Card className="h-full overflow-auto p-6">
      <div ref={containerRef} className="document-container">
        {editor && <EditorContent editor={editor} />}
      </div>
    </Card>
  )
}
