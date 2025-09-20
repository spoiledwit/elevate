'use client'

import { useState } from 'react'
import { X, Wand2, Loader2, Download, RefreshCw, ImageIcon } from 'lucide-react'
import { generateImageAction } from '@/actions/ai-action'
import { cn } from '@/lib/utils'

interface ImageGenerationDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (imageFile: File) => void
}

const imageStyles = [
  { id: 'vivid', label: 'Vivid', description: 'More hyper-real and dramatic' },
  { id: 'natural', label: 'Natural', description: 'More natural, less hyper-real' },
]

const imageSizes = [
  { id: '1024x1024', label: 'Square (1:1)', value: '1024x1024' as const },
  { id: '1792x1024', label: 'Landscape (16:9)', value: '1792x1024' as const },
  { id: '1024x1792', label: 'Portrait (9:16)', value: '1024x1792' as const },
]

export function ImageGenerationDialog({
  isOpen,
  onClose,
  onInsert
}: ImageGenerationDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid')
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [generatedImage, setGeneratedImage] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the image')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedImage('')

    try {
      const result = await generateImageAction({
        prompt: prompt.trim(),
        model: 'dall-e-3',
        size,
        quality,
        style,
        n: 1,
        save_to_media: false
      })

      if (result.success && result.images && result.images.length > 0) {
        const imageData = result.images[0]
        if (imageData.b64_json) {
          setGeneratedImage(`data:image/png;base64,${imageData.b64_json}`)
        } else if (imageData.url) {
          setGeneratedImage(imageData.url)
        }
      } else {
        setError(result.error || 'Failed to generate image')
      }
    } catch (err) {
      setError('An error occurred while generating the image')
      console.error('Image generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `ai-generated-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleInsert = async () => {
    if (!generatedImage) return

    try {
      // Convert base64 to blob
      const response = await fetch(generatedImage)
      const blob = await response.blob()

      // Create a File object
      const file = new File([blob], `ai-image-${Date.now()}.png`, { type: 'image/png' })

      onInsert(file)
      onClose()
    } catch (err) {
      console.error('Error converting image:', err)
      setError('Failed to insert image')
    }
  }

  const handleReset = () => {
    setGeneratedImage('')
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wand2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Image Generator</h2>

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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the image you want to create
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A beautifully set dining table with traditional Eid Al Adha dishes. The table is adorned with candles, flowers, and a centerpiece that represents the festival. The room is filled with warm, festive lighting"
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isGenerating}
                />
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Image Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {imageStyles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id as any)}
                      disabled={isGenerating}
                      className={cn(
                        "p-3 text-left rounded-lg border transition-all",
                        style === s.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300",
                        isGenerating && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <p className="font-medium text-sm text-gray-900">{s.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Image Size
                </label>
                <div className="space-y-2">
                  {imageSizes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSize(s.value)}
                      disabled={isGenerating}
                      className={cn(
                        "w-full p-2 text-left rounded-lg border transition-all",
                        size === s.value
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300",
                        isGenerating && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span className="text-sm font-medium text-gray-900">{s.label}</span>
                      <span className="text-xs text-gray-500 ml-2">({s.value})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quality
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setQuality('standard')}
                    disabled={isGenerating}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      quality === 'standard'
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      isGenerating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setQuality('hd')}
                    disabled={isGenerating}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      quality === 'hd'
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      isGenerating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    HD
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {isGenerating ? (
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Generating your image...</p>
                    <p className="text-xs text-gray-500 mt-2">This may take up to 30 seconds</p>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated image"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your generated image will appear here</p>
                  </div>
                )}
              </div>

              {/* Image Actions */}
              {generatedImage && !isGenerating && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={handleInsert}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Use This Image
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate New Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {!generatedImage ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Image
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Generate Another
              </button>
              <button
                onClick={handleInsert}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Add to Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}