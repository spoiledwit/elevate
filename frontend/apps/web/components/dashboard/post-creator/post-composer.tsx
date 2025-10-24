'use client'

import { useState, useEffect, useRef } from 'react'
import { Smile, Hash, AtSign, Sparkles } from 'lucide-react'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { cn } from '@/lib/utils'
import { AIAssistantDialog } from './ai-assistant-dialog'

interface PostComposerProps {
  content: string
  onContentChange: (content: string) => void
  selectedPlatforms: string[]
  isMiloUpdating?: boolean
}

const PLATFORM_LIMITS: Record<string, number> = {
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  youtube: 5000,
  tiktok: 2200,
  twitter: 280,
  pinterest: 500
}

export function PostComposer({ content, onContentChange, selectedPlatforms, isMiloUpdating }: PostComposerProps) {
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Calculate the minimum character limit from selected platforms
  const getCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return 2200 // Default
    return Math.min(...selectedPlatforms.map(p => PLATFORM_LIMITS[p] || 2200))
  }

  const characterLimit = getCharacterLimit()
  const charactersRemaining = characterLimit - content.length
  const isOverLimit = charactersRemaining < 0
  const warningThreshold = characterLimit * 0.1 // Warn at 10% remaining

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const newContent = content.slice(0, start) + emojiData.emoji + content.slice(end)
      onContentChange(newContent)

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + emojiData.emoji.length
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
    setShowEmojiPicker(false)
  }

  const insertHashtag = () => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const newContent = content.slice(0, start) + '#' + content.slice(end)
      onContentChange(newContent)

      setTimeout(() => {
        textarea.focus()
        const newPosition = start + 1
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
  }

  const insertMention = () => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const newContent = content.slice(0, start) + '@' + content.slice(end)
      onContentChange(newContent)

      setTimeout(() => {
        textarea.focus()
        const newPosition = start + 1
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
  }

  const handleAIContentInsert = (aiContent: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const newContent = content.slice(0, start) + aiContent + content.slice(end)
      onContentChange(newContent)

      setTimeout(() => {
        textarea.focus()
        const newPosition = start + aiContent.length
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
  }

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  return (
    <>
      <div className={cn(
        "bg-white rounded-lg border transition-all duration-1000",
        isMiloUpdating
          ? "border-purple-400 shadow-[0_0_30px_rgba(147,51,234,0.3)] animate-pulse"
          : "border-gray-200"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn(
              "text-lg font-semibold transition-all duration-500",
              isMiloUpdating
                ? "text-[#bea456] drop-shadow-sm"
                : "text-gray-900"
            )}>
              Compose Post
              {isMiloUpdating && (
                <span className="ml-2 inline-flex items-center gap-1 text-sm text-[#bea456] font-medium">
                  Milo is writing...
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowAiDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#bea456] bg-[#bea4561a] rounded-lg hover:bg-[#bea4561a] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>
          </div>

          {/* Text Area */}
          <div className="relative">
            {isMiloUpdating && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-500/5 via-violet-500/10 to-brand-500/5 animate-pulse pointer-events-none z-10"></div>
            )}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                onContentChange(e.target.value)
              }}
              placeholder="What would you like to share today?"
              className={cn(
                "w-full min-h-[200px] p-4 text-gray-900 rounded-lg resize-none transition-all duration-500 relative z-20",
                "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bea456]",
                isMiloUpdating
                  ? "bg-gradient-to-br from-purple-50/80 to-violet-50/80 ring-2 ring-purple-300/50 shadow-inner shadow-purple-200/50"
                  : "bg-gray-50 focus:bg-white",
                isOverLimit && !isMiloUpdating && "ring-2 ring-red-500 bg-red-50"
              )}
            />
            {isMiloUpdating && (
              <div className="absolute bottom-2 right-2 z-30">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#bea4561a]0 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce animation-delay-200"></div>
                  <div className="w-2 h-2 bg-[#bea4561a]0 rounded-full animate-bounce animation-delay-400"></div>
                </div>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {/* Emoji Picker */}
              <div className="relative emoji-picker-container">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors",
                    showEmojiPicker && "bg-gray-100 text-gray-900"
                  )}
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 z-50">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={350}
                      height={400}
                      searchDisabled={false}
                      skinTonesDisabled={false}
                      previewConfig={{
                        showPreview: false
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={insertHashtag}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add hashtag"
              >
                <Hash className="w-5 h-5" />
              </button>

              <button
                onClick={insertMention}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add mention"
              >
                <AtSign className="w-5 h-5" />
              </button>
            </div>

            {/* Character Counter */}
            <div className="flex items-center gap-3">
              {selectedPlatforms.length > 0 && (
                <span className="text-xs text-gray-500">
                  {selectedPlatforms.map(p => p).join(', ')}
                </span>
              )}
              <span className={cn(
                "text-sm font-medium",
                isOverLimit ? "text-red-600" :
                  charactersRemaining < warningThreshold ? "text-yellow-600" :
                    "text-gray-600"
              )}>
                {charactersRemaining} / {characterLimit}
              </span>
            </div>
          </div>

          {/* Platform-specific hints */}
          {selectedPlatforms.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <span className="font-medium">Tip:</span>
                {selectedPlatforms.includes('instagram') && ' Use relevant hashtags for better reach.'}
                {selectedPlatforms.includes('facebook') && ' Questions increase engagement on Facebook.'}
                {selectedPlatforms.includes('linkedin') && ' Professional tone works best on LinkedIn.'}
                {selectedPlatforms.includes('youtube') && ' Include keywords for YouTube SEO.'}
                {selectedPlatforms.includes('pinterest') && ' Vertical images perform better on Pinterest.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Dialog */}
      <AIAssistantDialog
        isOpen={showAiDialog}
        onClose={() => setShowAiDialog(false)}
        onInsert={handleAIContentInsert}
        currentContent={content}
        selectedPlatforms={selectedPlatforms}
      />
    </>
  )
}