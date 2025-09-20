'use client'

import { useState, useRef } from 'react'
import {
  Sparkles,
  Image,
  Type,
  MessageSquare,
  Upload,
  Download,
  Copy,
  Check,
  Wand2,
  Eye,
  RotateCcw,
  Settings,
  Loader2
} from 'lucide-react'
import {
  generateTextAction,
  generateImageAction,
  generateSocialContentAction,
  improveContentAction,
  analyzeImageAction
} from '@/actions'
// Import utilities directly to avoid import issues
const PLATFORM_GUIDELINES = {
  twitter: {
    maxLength: 280,
    description: 'Short, engaging tweets with hashtags'
  },
  facebook: {
    maxLength: 2000,
    description: 'Engaging posts that encourage interaction'
  },
  instagram: {
    maxLength: 2200,
    description: 'Visual-focused content with engaging captions'
  },
  linkedin: {
    maxLength: 3000,
    description: 'Professional content for business networking'
  },
  tiktok: {
    maxLength: 300,
    description: 'Fun, trendy content for video descriptions'
  },
  youtube: {
    maxLength: 5000,
    description: 'Compelling descriptions for video content'
  },
  pinterest: {
    maxLength: 500,
    description: 'Descriptive content for visual pins'
  }
} as const

const IMPROVEMENT_TYPES = {
  grammar: 'Fix grammar, spelling, and punctuation errors',
  clarity: 'Improve clarity and readability',
  engagement: 'Make content more engaging and compelling',
  tone: 'Adjust tone to be more professional',
  concise: 'Make content more concise and to-the-point'
} as const

// Utility functions
function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }

  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

function createImageDownloadUrl(base64: string): string {
  const blob = base64ToBlob(base64)
  return URL.createObjectURL(blob)
}

function formatUsageStats(usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): string {
  if (!usage) return 'No usage data'

  return `Tokens used: ${usage.total_tokens || 0} (${usage.prompt_tokens || 0} prompt + ${usage.completion_tokens || 0} completion)`
}
import type {
  TextGenerationRequest,
  ImageGenerationRequest,
  SocialContentRequest,
  ContentImprovementRequest,
  ImageAnalysisRequest
} from '@/actions'

type TabType = 'text' | 'image' | 'social' | 'improve' | 'analyze'

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<TabType>('text')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: 'text', label: 'Text Generation', icon: Type, description: 'Generate any type of content' },
    { id: 'image', label: 'Image Creation', icon: Image, description: 'Create AI-generated images' },
    { id: 'social', label: 'Social Content', icon: MessageSquare, description: 'Platform-specific posts' },
    { id: 'improve', label: 'Content Polish', icon: Wand2, description: 'Enhance existing content' },
    { id: 'analyze', label: 'Image Analysis', icon: Eye, description: 'Understand image content' }
  ]

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetResult = () => {
    setResult(null)
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-sm text-gray-600">
                Harness the power of AI to create, enhance, and analyze content
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType)
                      resetResult()
                    }}
                    className={`p-6 rounded-2xl text-left transition-all ${isActive
                      ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                      : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isActive ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                      <Icon className={`w-6 h-6 ${isActive ? 'text-brand-600' : 'text-gray-600'}`} />
                    </div>
                    <h3 className={`font-semibold mb-2 ${isActive ? 'text-purple-900' : 'text-gray-900'}`}>
                      {tab.label}
                    </h3>
                    <p className="text-sm text-gray-600">{tab.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
              </div>

              {activeTab === 'text' && <TextGenerationForm onResult={setResult} setLoading={setIsLoading} />}
              {activeTab === 'image' && <ImageGenerationForm onResult={setResult} setLoading={setIsLoading} />}
              {activeTab === 'social' && <SocialContentForm onResult={setResult} setLoading={setIsLoading} />}
              {activeTab === 'improve' && <ContentImprovementForm onResult={setResult} setLoading={setIsLoading} />}
              {activeTab === 'analyze' && <ImageAnalysisForm onResult={setResult} setLoading={setIsLoading} />}
            </div>

            {/* Result Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  <h2 className="text-lg font-semibold text-gray-900">AI Output</h2>
                </div>
                {result && (
                  <button
                    onClick={resetResult}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Clear result"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">AI is working its magic...</p>
                  </div>
                </div>
              ) : result ? (
                <ResultDisplay result={result} activeTab={activeTab} onCopy={handleCopy} copied={copied} />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Configure your AI request and generate content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Text Generation Form Component
function TextGenerationForm({ onResult, setLoading }: {
  onResult: (result: any) => void
  setLoading: (loading: boolean) => void
}) {
  const [formData, setFormData] = useState<TextGenerationRequest>({
    prompt: '',
    temperature: 0.7,
    max_tokens: 1000
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.prompt.trim()) return

    setLoading(true)
    try {
      const result = await generateTextAction(formData)
      onResult(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What would you like me to write?
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
          placeholder="Write a professional email about project updates..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Creativity Level
          </label>
          <select
            value={formData.temperature}
            onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          >
            <option value={0.3}>Conservative</option>
            <option value={0.7}>Balanced</option>
            <option value={1.0}>Creative</option>
            <option value={1.5}>Very Creative</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Length
          </label>
          <select
            value={formData.max_tokens}
            onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          >
            <option value={500}>Short (500 tokens)</option>
            <option value={1000}>Medium (1000 tokens)</option>
            <option value={2000}>Long (2000 tokens)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Instructions (Optional)
        </label>
        <input
          type="text"
          value={formData.system_message || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, system_message: e.target.value }))}
          placeholder="You are a professional copywriter..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <button
        type="submit"
        disabled={!formData.prompt.trim()}
        className="w-full bg-brand-600 text-white py-3 px-4 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Generate Text
      </button>
    </form>
  )
}

// Image Generation Form Component
function ImageGenerationForm({ onResult, setLoading }: {
  onResult: (result: any) => void
  setLoading: (loading: boolean) => void
}) {
  const [formData, setFormData] = useState<ImageGenerationRequest>({
    prompt: '',
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    n: 1
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.prompt.trim()) return

    setLoading(true)
    try {
      const result = await generateImageAction(formData)
      onResult(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe the image you want to create
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
          placeholder="A serene landscape with mountains and a lake at sunset..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image Size
          </label>
          <select
            value={formData.size}
            onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          >
            <option value="1024x1024">Square (1024×1024)</option>
            <option value="1792x1024">Landscape (1792×1024)</option>
            <option value="1024x1792">Portrait (1024×1792)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quality
          </label>
          <select
            value={formData.quality}
            onChange={(e) => setFormData(prev => ({ ...prev, quality: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          >
            <option value="standard">Standard</option>
            <option value="hd">HD Quality</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Style
        </label>
        <select
          value={formData.style}
          onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value as any }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
        >
          <option value="vivid">Vivid & Dramatic</option>
          <option value="natural">Natural & Realistic</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={!formData.prompt.trim()}
        className="w-full bg-brand-600 text-white py-3 px-4 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Generate Image
      </button>
    </form>
  )
}

// Social Content Form Component  
function SocialContentForm({ onResult, setLoading }: {
  onResult: (result: any) => void
  setLoading: (loading: boolean) => void
}) {
  const [formData, setFormData] = useState<SocialContentRequest>({
    platform: 'instagram',
    topic: '',
    tone: 'professional',
    include_hashtags: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic.trim()) return

    setLoading(true)
    try {
      const result = await generateSocialContentAction(formData)
      onResult(result)
    } finally {
      setLoading(false)
    }
  }

  const platformGuideline = PLATFORM_GUIDELINES[formData.platform]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's your post about?
        </label>
        <textarea
          value={formData.topic}
          onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
          placeholder="Announcing our new product launch..."
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform
          </label>
          <select
            value={formData.platform}
            onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="pinterest">Pinterest</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone
          </label>
          <select
            value={formData.tone}
            onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="funny">Funny</option>
            <option value="inspirational">Inspirational</option>
            <option value="educational">Educational</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hashtags"
          checked={formData.include_hashtags}
          onChange={(e) => setFormData(prev => ({ ...prev, include_hashtags: e.target.checked }))}
          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="hashtags" className="text-sm font-medium text-gray-700">
          Include hashtags
        </label>
      </div>

      {platformGuideline && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <strong>{formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1)}:</strong> {platformGuideline.description}
            {platformGuideline.maxLength && ` (Max: ${platformGuideline.maxLength} characters)`}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!formData.topic.trim()}
        className="w-full bg-brand-600 text-white py-3 px-4 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Generate Post
      </button>
    </form>
  )
}

// Content Improvement Form Component
function ContentImprovementForm({ onResult, setLoading }: {
  onResult: (result: any) => void
  setLoading: (loading: boolean) => void
}) {
  const [formData, setFormData] = useState<ContentImprovementRequest>({
    content: '',
    improvement_type: 'grammar'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.content.trim()) return

    setLoading(true)
    try {
      const result = await improveContentAction(formData)
      onResult(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content to improve
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Paste your content here to enhance it..."
          className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Improvement Type
        </label>
        <select
          value={formData.improvement_type}
          onChange={(e) => setFormData(prev => ({ ...prev, improvement_type: e.target.value as any }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
        >
          {Object.entries(IMPROVEMENT_TYPES).map(([key, description]) => (
            <option key={key} value={key}>
              {key.charAt(0).toUpperCase() + key.slice(1)} - {description}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Audience (Optional)
        </label>
        <input
          type="text"
          value={formData.target_audience || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
          placeholder="Business professionals, young adults, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <button
        type="submit"
        disabled={!formData.content.trim()}
        className="w-full bg-brand-600 text-white py-3 px-4 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Improve Content
      </button>
    </form>
  )
}

// Image Analysis Form Component
function ImageAnalysisForm({ onResult, setLoading }: {
  onResult: (result: any) => void
  setLoading: (loading: boolean) => void
}) {
  const [formData, setFormData] = useState<Omit<ImageAnalysisRequest, 'image'>>({
    prompt: "What's in this image?",
    detail: 'auto'
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setLoading(true)
    try {
      const result = await analyzeImageAction({
        ...formData,
        image: selectedFile
      })
      onResult(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Image
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors"
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-48 mx-auto rounded-lg"
            />
          ) : (
            <div>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Click to upload an image</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What would you like to know about the image?
        </label>
        <input
          type="text"
          value={formData.prompt}
          onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
          placeholder="Describe what you see in detail..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Analysis Detail Level
        </label>
        <select
          value={formData.detail}
          onChange={(e) => setFormData(prev => ({ ...prev, detail: e.target.value as any }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
        >
          <option value="auto">Auto (AI decides)</option>
          <option value="low">Low (faster, basic analysis)</option>
          <option value="high">High (detailed analysis)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={!selectedFile}
        className="w-full bg-brand-600 text-white py-3 px-4 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Analyze Image
      </button>
    </form>
  )
}

// Result Display Component
function ResultDisplay({
  result,
  activeTab,
  onCopy,
  copied
}: {
  result: any
  activeTab: TabType
  onCopy: (text: string) => void
  copied: boolean
}) {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Error</p>
        <p className="text-red-600 text-sm mt-1">{result.error}</p>
      </div>
    )
  }

  if (activeTab === 'image') {
    return (
      <div className="space-y-4">
        {result.images?.map((image: any, index: number) => (
          <div key={index} className="space-y-3">
            <img
              src={`data:image/png;base64,${image.b64_json}`}
              alt="Generated image"
              className="w-full rounded-lg shadow-sm"
            />
            {image.revised_prompt && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Revised Prompt:</p>
                <p className="text-sm text-gray-600">{image.revised_prompt}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const url = createImageDownloadUrl(image.b64_json)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `ai-generated-${Date.now()}.png`
                  a.click()
                }}
                className="flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const textResult = result.text || result.analysis

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Generated Content</h3>
          <button
            onClick={() => onCopy(textResult)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {textResult}
          </p>
        </div>
      </div>

      {result.usage && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-800 mb-1">Usage Statistics</p>
          <p className="text-sm text-blue-700">{formatUsageStats(result.usage)}</p>
        </div>
      )}
    </div>
  )
}