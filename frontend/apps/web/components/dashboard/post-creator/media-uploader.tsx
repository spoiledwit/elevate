'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, X, Image, Film, FileText, Loader2, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaUploaderProps {
  mediaFiles: File[]
  onMediaChange: (files: File[]) => void
  selectedPlatforms: string[]
  isLoadingMedia?: boolean
  onGenerateImage?: () => void
  isMiloGeneratingImage?: boolean
}

export function MediaUploader({ mediaFiles, onMediaChange, selectedPlatforms, isLoadingMedia = false, onGenerateImage, isMiloGeneratingImage = false }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])

  // Generate previews whenever mediaFiles change
  useEffect(() => {
    const generatePreviews = async () => {
      const newPreviews: string[] = []
      
      for (const file of mediaFiles) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          const preview = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          newPreviews.push(preview)
        } else {
          newPreviews.push('') // Empty string for non-image files
        }
      }
      
      setPreviews(newPreviews)
    }
    
    if (mediaFiles.length > 0) {
      generatePreviews()
    } else {
      setPreviews([])
    }
  }, [mediaFiles])

  // Platform-specific media limits
  const getMediaLimits = () => {
    const hasInstagram = selectedPlatforms.includes('instagram')
    const hasFacebook = selectedPlatforms.includes('facebook')
    
    if (hasInstagram) {
      return { maxFiles: 10, maxSize: 100, formats: 'JPG, PNG, MP4, MOV' } // 100MB for video
    }
    if (hasFacebook) {
      return { maxFiles: 10, maxSize: 100, formats: 'JPG, PNG, GIF, MP4' }
    }
    return { maxFiles: 10, maxSize: 50, formats: 'JPG, PNG, GIF, MP4, MOV' }
  }

  const limits = getMediaLimits()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = (newFiles: File[]) => {
    // Validate files
    const validFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const sizeInMB = file.size / (1024 * 1024)
      
      if (!isImage && !isVideo) {
        console.error(`Invalid file type: ${file.type}`)
        return false
      }
      
      if (sizeInMB > limits.maxSize) {
        console.error(`File too large: ${file.name}`)
        return false
      }
      
      return true
    })

    // Add to existing files (up to limit)
    const totalFiles = [...mediaFiles, ...validFiles].slice(0, limits.maxFiles)
    onMediaChange(totalFiles)
    
    // Previews are now handled by useEffect
  }

  const removeFile = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index)
    onMediaChange(newFiles)
    // Previews will be updated automatically by useEffect
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image
    if (file.type.startsWith('video/')) return Film
    return FileText
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Media</h2>
        {onGenerateImage && (
          <button
            onClick={onGenerateImage}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            title="Generate image with AI"
          >
            <Wand2 className="w-4 h-4" />
            Generate Image
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all",
          isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300",
          mediaFiles.length > 0 || isLoadingMedia || isMiloGeneratingImage ? "p-4" : "p-8"
        )}
      >
        {isLoadingMedia ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading image from content library...</p>
          </div>
        ) : isMiloGeneratingImage ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-purple-700 font-medium">Milo is generating your image...</p>
            <p className="text-sm text-gray-500 mt-2">This may take up to 30 seconds</p>
          </div>
        ) : mediaFiles.length === 0 ? (
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop your media here, or
            </p>
            <label className="cursor-pointer">
              <span className="text-purple-600 hover:text-purple-700 font-medium">
                browse files
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              {limits.formats} • Max {limits.maxSize}MB • Up to {limits.maxFiles} files
            </p>
          </div>
        ) : (
          <div>
            {/* Media Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {mediaFiles.map((file, index) => {
                const FileIcon = getFileIcon(file)
                const isImage = file.type.startsWith('image/')
                
                return (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {isImage && previews[index] ? (
                        <img
                          src={previews[index]}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    {/* File info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-xs text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-white/80">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add more button */}
            {mediaFiles.length < limits.maxFiles && (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 hover:bg-purple-50 transition-all">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Add more media</span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Platform-specific media tips */}
      {selectedPlatforms.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-900">
            <span className="font-medium">Media tips:</span>
            {selectedPlatforms.includes('instagram') && ' Square (1:1) or vertical (4:5) works best for Instagram.'}
            {selectedPlatforms.includes('youtube') && ' YouTube recommends 16:9 aspect ratio.'}
            {selectedPlatforms.includes('tiktok') && ' Vertical videos (9:16) are ideal for TikTok.'}
          </p>
        </div>
      )}
    </div>
  )
}