'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, Image, Video, Archive, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LibraryUploadProps {
  folders: string[]
  onClose: () => void
  onUpload: (files: File[], folder: string) => void
  onCreateFolder: (folderName: string) => void
}

interface UploadFile {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return Image
  if (file.type.startsWith('video/')) return Video
  if (file.type.includes('zip') || file.type.includes('rar')) return Archive
  return FileText
}

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export function LibraryUpload({ folders, onClose, onUpload, onCreateFolder }: LibraryUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState(folders[0] || 'General')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadFile[] = Array.from(files).map(file => ({
      file,
      status: 'pending' as const,
      progress: 0
    }))

    setUploadFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const simulateUpload = async () => {
    // Simulate upload process
    for (let i = 0; i < uploadFiles.length; i++) {
      setUploadFiles(prev => prev.map((file, index) =>
        index === i ? { ...file, status: 'uploading' } : file
      ))

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 50))
        setUploadFiles(prev => prev.map((file, index) =>
          index === i ? { ...file, progress } : file
        ))
      }

      // Mark as complete
      setUploadFiles(prev => prev.map((file, index) =>
        index === i ? { ...file, status: 'success', progress: 100 } : file
      ))
    }

    // Close modal after a brief delay
    setTimeout(() => {
      onUpload(uploadFiles.map(uf => uf.file), selectedFolder)
      onClose()
    }, 500)
  }

  const isUploading = uploadFiles.some(file => file.status === 'uploading')
  const canUpload = uploadFiles.length > 0 && !isUploading

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload Media</h2>
            <p className="text-sm text-gray-600 mt-1">Add files to your content library</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Folder Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload to folder
              </label>
              <button
                onClick={() => setShowCreateFolder(true)}
                className="text-sm text-[#bea456] hover:text-[#bea456] font-medium"
              >
                + New Folder
              </button>
            </div>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bea456] focus:border-transparent"
            >
              {folders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>

          {/* Create New Folder */}
          {showCreateFolder && (
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New folder name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bea456] focus:border-transparent"
                />
                <button
                  onClick={() => {
                    if (newFolderName.trim()) {
                      onCreateFolder(newFolderName.trim())
                      setSelectedFolder(newFolderName.trim())
                      setNewFolderName('')
                      setShowCreateFolder(false)
                    }
                  }}
                  disabled={!newFolderName.trim()}
                  className="px-3 py-2 bg-[#bea456] text-white rounded-lg hover:bg-[#af9442ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateFolder(false)
                    setNewFolderName('')
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging
                ? "border-[#bea456] bg-[#bea4561a]"
                : "border-gray-300 hover:border-gray-400"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[#bea456] hover:text-[#bea456] font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-gray-500">
              Support for images, videos, documents, and archives up to 100MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.zip,.rar"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {uploadFiles.map((uploadFile, index) => {
                const Icon = getFileIcon(uploadFile.file)

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadFile.file.size)}
                      </p>

                      {/* Progress Bar */}
                      {uploadFile.status === 'uploading' && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-[#bea456] h-1 rounded-full transition-all duration-300"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {uploadFile.status === 'pending' && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                      {uploadFile.status === 'uploading' && (
                        <div className="text-xs text-blue-600 font-medium">
                          {uploadFile.progress}%
                        </div>
                      )}
                      {uploadFile.status === 'success' && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={simulateUpload}
              disabled={!canUpload}
              className="px-6 py-2 bg-[#bea456] text-white rounded-lg hover:bg-[#af9442ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}