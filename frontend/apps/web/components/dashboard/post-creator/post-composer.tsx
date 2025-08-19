'use client'

import { useState, useEffect, useRef } from 'react'
import { Smile, Hash, AtSign, Sparkles } from 'lucide-react'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { cn } from '@/lib/utils'

interface PostComposerProps {
  content: string
  onContentChange: (content: string) => void
  selectedPlatforms: string[]
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

export function PostComposer({ content, onContentChange, selectedPlatforms }: PostComposerProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [cursorPosition, setCursorPosition] = useState(0)

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
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Compose Post</h2>
          <button
            onClick={() => setShowAiSuggestions(!showAiSuggestions)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI Assistant
          </button>
        </div>

        {/* AI Suggestions Box */}
        {showAiSuggestions && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900 mb-2">
                  AI Writing Assistant
                </p>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm bg-white rounded-lg hover:bg-purple-100 transition-colors">
                    Generate engaging caption
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm bg-white rounded-lg hover:bg-purple-100 transition-colors">
                    Suggest relevant hashtags
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm bg-white rounded-lg hover:bg-purple-100 transition-colors">
                    Improve current text
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Text Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              onContentChange(e.target.value)
              setCursorPosition(e.target.selectionStart)
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            placeholder="What would you like to share today?"
            className={cn(
              "w-full min-h-[200px] p-4 text-gray-900 bg-gray-50 rounded-lg resize-none transition-all",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white",
              isOverLimit && "ring-2 ring-red-500 bg-red-50"
            )}
          />
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
  )
}