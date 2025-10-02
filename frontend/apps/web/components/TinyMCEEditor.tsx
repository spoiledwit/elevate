'use client'

import { Editor } from '@tinymce/tinymce-react'
import { forwardRef, use, useEffect, useImperativeHandle, useRef } from 'react'

interface TinyMCEEditorProps {
  value?: string
  onChange?: (content: string) => void
  height?: number
}

export interface TinyMCEEditorRef {
  getContent: () => string
  setContent: (content: string) => void
}

export const TinyMCEEditor = forwardRef<TinyMCEEditorRef, TinyMCEEditorProps>(
  ({ value = '', onChange, height = 200 }, ref) => {
    const editorRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      getContent: () => {
        if (editorRef.current) {
          return editorRef.current.getContent()
        }
        return ''
      },
      setContent: (content: string) => {
        if (editorRef.current) {
          editorRef.current.setContent(content)
        }
      }
    }))

    return (
      <Editor
        apiKey="m8r4u1nbtpy71t92brea09iisof920r12yn2y5i66us3e6mf"
        onInit={(evt, editor) => {
          editorRef.current = editor
        }}
        value={value}
        onEditorChange={(content) => {
          onChange?.(content)
        }}
        init={{
          height,
          min_height: height,
          max_height: 500,
          menubar: false,
          plugins: [
            'lists', 'link', 'image', 'code', 'help', 'wordcount', 'autoresize'
          ],
          toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | link image | code | help',
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6;',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px } .tox-editor-container .tox-editor-header { border: none !important; } .tox-tinymce { border: none !important; outline: none !important; } .tox-edit-area { border: none !important; outline: none !important; } .tox-edit-area__iframe { border: none !important; outline: none !important; }',
          placeholder: '',
          resize: false,
          autoresize_bottom_margin: 0,
          autoresize_overflow_padding: 10,
          statusbar: false,
          //@ts-ignore
          images_upload_url: false,
          automatic_uploads: true,
          file_picker_types: 'image',
          images_upload_handler: async (blobInfo: any, progress: (percent: number) => void) => {
            // Convert blob to base64 and return it
            return new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                resolve(reader.result as string)
              }
              reader.onerror = reject
              reader.readAsDataURL(blobInfo.blob())
            })
          },
          setup: (editor) => {
            editor.on('init', () => {
              if (value) {
                editor.setContent(value)
              }
            })
          }
        }}
      />
    )
  }
)

TinyMCEEditor.displayName = 'TinyMCEEditor'