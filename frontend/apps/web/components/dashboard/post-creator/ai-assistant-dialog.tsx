'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2, Copy, Check, Wand2 } from 'lucide-react'
import { generateSocialContentAction } from '@/actions/ai-action'
import { cn } from '@/lib/utils'

interface AIAssistantDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (content: string) => void
  currentContent?: string
  selectedPlatforms: string[]
}

const contentTypes = [
  { id: 'caption', label: 'Caption', description: 'Generate engaging captions' },
  { id: 'hashtags', label: 'Hashtags', description: 'Suggest relevant hashtags' },
  { id: 'improve', label: 'Improve', description: 'Enhance existing content' },
  { id: 'ideas', label: 'Ideas', description: 'Get content ideas' },
]

const tones = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'funny', label: 'Funny' },
  { id: 'inspirational', label: 'Inspirational' },
  { id: 'educational', label: 'Educational' },
]

export function AIAssistantDialog({
  isOpen,
  onClose,
  onInsert,
  currentContent = '',
  selectedPlatforms
}: AIAssistantDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState('caption')
  const [tone, setTone] = useState<'professional' | 'casual' | 'funny' | 'inspirational' | 'educational'>('professional')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedContent('')

    try {
      // Use the first selected platform or default to instagram
      const platform = (selectedPlatforms[0] || 'instagram') as any

      // Build the topic based on content type
      let topic = prompt
      if (contentType === 'hashtags') {
        topic = `Generate relevant hashtags for: ${prompt}`
      } else if (contentType === 'improve' && currentContent) {
        topic = `Improve this content: ${currentContent}. Additional context: ${prompt}`
      } else if (contentType === 'ideas') {
        topic = `Generate content ideas about: ${prompt}`
      }

      const result = await generateSocialContentAction({
        platform,
        topic,
        tone,
        include_hashtags: contentType === 'caption' || contentType === 'hashtags'
      })

      if (result.success && result.text) {
        setGeneratedContent(result.text)
      } else {
        setError(result.error || 'Failed to generate content')
      }
    } catch (err) {
      setError('An error occurred while generating content')
      console.error('AI generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInsert = () => {
    onInsert(generatedContent)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#bea4561a] rounded-lg">
              <Sparkles className="w-5 h-5 text-[#bea456]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Content Assistant</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Content Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What would you like to generate?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={cn(
                    "p-3 text-left rounded-lg border transition-all",
                    contentType === type.id
                      ? "border-[#bea456] bg-[#bea4561a]"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <p className="font-medium text-sm text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select tone
            </label>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    tone === t.id
                      ? "bg-[#bea456] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe what you want to create
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                contentType === 'improve' && currentContent
                  ? "What improvements would you like?"
                  : "E.g., Announcing our new product launch, summer sale promotion..."
              }
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#bea456]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Generated content</label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{generatedContent}</p>
              </div>
            </div>
          )}

          {/* Platform Info */}
          {selectedPlatforms.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                Optimizing for: {selectedPlatforms.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {!generatedContent ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#bea456] hover:bg-[#af9442ff] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleInsert}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#bea456] hover:bg-[#af9442ff] rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Insert Content
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}