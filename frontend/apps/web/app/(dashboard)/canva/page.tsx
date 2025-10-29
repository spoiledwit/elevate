'use client'

import { useEffect, useState } from 'react'
import { useCanva } from '@/hooks/useCanva'
import { Loader2, Plus, ExternalLink, Download, Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface CanvaDesign {
  id: number
  design_id: string
  design_type: string
  title: string
  thumbnail_url: string
  edit_url: string
  export_url: string
  status: string
  status_display: string
  opened_count: number
  created_at: string
  exported_at: string | null
}

export default function CanvaDesignsPage() {
  const {
    isConnected,
    checking,
    connectToCanva,
    openCanvaDesign,
    getDesigns,
    deleteDesign,
    exportDesign
  } = useCanva()

  const [designs, setDesigns] = useState<CanvaDesign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!checking && isConnected) {
      loadDesigns()
    } else if (!checking && !isConnected) {
      setLoading(false)
    }
  }, [checking, isConnected])

  const loadDesigns = async () => {
    setLoading(true)
    const result = await getDesigns()
    setDesigns(result as CanvaDesign[])
    setLoading(false)
  }

  const handleDelete = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) {
      return
    }

    const success = await deleteDesign(designId)
    if (success) {
      loadDesigns()
    }
  }

  const handleExport = async (designId: string) => {
    await exportDesign(designId)
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect to Canva
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your Canva account to start creating and managing designs
          </p>
          <button
            onClick={connectToCanva}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Connect Canva
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Canva Designs</h1>
          <p className="text-gray-600 mt-1">
            Create, manage, and export your Canva designs
          </p>
        </div>
        <button
          onClick={openCanvaDesign}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Design
        </button>
      </div>

      {/* Designs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : designs.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No designs yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first design in Canva
          </p>
          <button
            onClick={openCanvaDesign}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Design
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <div
              key={design.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                {design.thumbnail_url ? (
                  <img
                    src={design.thumbnail_url}
                    alt={design.title || 'Canva Design'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, hide it
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium">Thumbnail</span>
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${design.status === 'exported' ? 'bg-green-100 text-green-800' :
                    design.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      design.status === 'editing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {design.status_display}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Meta Info */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(design.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (design.edit_url) {
                        window.open(design.edit_url, '_blank')
                      } else {
                        toast.error('Edit URL not available')
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-50 text-purple-600 text-sm font-medium rounded hover:bg-purple-100 transition-colors"
                    title="Edit in Canva"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleExport(design.design_id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 text-sm font-medium rounded hover:bg-green-100 transition-colors"
                    title="Export Design"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(design.design_id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded hover:bg-red-100 transition-colors"
                    title="Delete Design"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}