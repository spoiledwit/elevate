'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import NextLink from 'next/link'
import {
  Link,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ExternalLink,
  Eye,
  EyeOff,
  Image,
  BarChart3,
  MousePointerClick
} from 'lucide-react'
import { LinkForm } from './LinkForm'
import { LinkAnalytics } from './LinkAnalytics'
import { ConfirmDialog } from './ConfirmDialog'
import {
  getCustomLinksAction,
  deleteCustomLinkAction,
  reorderCustomLinksAction,
  updateCustomLinkAction
} from '@/actions'

interface CustomLinksManagerProps {
  initialLinks: any[]
}

export function CustomLinksManager({ initialLinks }: CustomLinksManagerProps) {
  const { data: session } = useSession()
  const [links, setLinks] = useState(initialLinks)
  const [selectedLink, setSelectedLink] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analyticsLinkId, setAnalyticsLinkId] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const loadLinks = async () => {
    try {
      const result = await getCustomLinksAction()
      if (!('error' in result)) {
        setLinks(result.results || [])
      }
    } catch (error) {
      console.error('Error loading links:', error)
    }
  }

  const handleDeleteLink = (linkId: string) => {
    setLinkToDelete(linkId)
    setShowConfirmDialog(true)
  }

  const confirmDeleteLink = async () => {
    if (!linkToDelete) return

    try {
      const result = await deleteCustomLinkAction(linkToDelete)
      if (!('error' in result)) {
        await loadLinks()
      }
    } catch (error) {
      console.error('Error deleting link:', error)
    } finally {
      setLinkToDelete(null)
      setShowConfirmDialog(false)
    }
  }

  const handleToggleActive = async (link: any) => {
    try {
      const result = await updateCustomLinkAction(link.id, {
        is_active: !link.is_active
      })
      if (!('error' in result)) {
        await loadLinks()
      }
    } catch (error) {
      console.error('Error updating link:', error)
    }
  }

  const handleEditLink = (link: any) => {
    setSelectedLink(link)
    setShowForm(true)
  }


  const handleFormComplete = () => {
    setShowForm(false)
    setSelectedLink(null)
    loadLinks()
  }

  const handleReorderLinks = async (newOrder: any[]) => {
    try {
      const reorderData = newOrder.map((link, index) => ({
        id: link.id,
        order: index
      }))
      await reorderCustomLinksAction(reorderData)
      // Don't set links here - it's already set in handleDrop
    } catch (error) {
      console.error('Error reordering links:', error)
      // On error, reload links from backend to ensure consistency
      await loadLinks()
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newLinks = [...links]
    const draggedLink = newLinks[draggedIndex]
    
    // Remove dragged item
    newLinks.splice(draggedIndex, 1)
    
    // Insert at new position
    newLinks.splice(dropIndex, 0, draggedLink)
    
    // Update UI immediately for smooth UX
    setLinks(newLinks)
    setDraggedIndex(null)
    
    // Save new order to backend
    await handleReorderLinks(newLinks)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleShowAnalytics = (linkId: string) => {
    setAnalyticsLinkId(linkId)
    setShowAnalytics(true)
  }

  const activeLinksCount = links.filter(link => link.is_active).length
  const totalClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0)

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Link className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
                  <p className="text-gray-600">
                    Manage up to 10 products and links for your storefront
                  </p>
                </div>
              </div>

              <NextLink
                href="/custom-links/create"
                className={`inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium ${
                  links.length >= 10 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Product
              </NextLink>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Link className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{links.length}/10</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">{activeLinksCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">{totalClicks}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content with Mobile Preview */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Links List - Left side */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl" style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
                </div>

                <div className="p-6">
                  {links.length > 0 ? (
                    <div className="space-y-4">
                      {links.map((link, index) => (
                        <div
                          key={link.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-move ${link.is_active
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-100 bg-gray-50'
                            } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                        >
                          {/* Drag Handle */}
                          <div className="cursor-move text-gray-400 hover:text-gray-600">
                            <GripVertical className="w-5 h-5" />
                          </div>

                          {/* Thumbnail */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {link.thumbnail ? (
                              <img
                                src={link.thumbnail}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Image className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          {/* Link Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900 truncate">
                                {link.text}
                              </h3>
                              {!link.is_active && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  Hidden
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{link.url}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">
                                Order: {link.order}
                              </span>
                              <span className="text-xs text-gray-500">
                                Clicks: {link.click_count || 0}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(link)}
                              className={`p-2 rounded-lg transition-colors ${link.is_active
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                                }`}
                              title={link.is_active ? 'Hide link' : 'Show link'}
                            >
                              {link.is_active ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => handleShowAnalytics(link.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View analytics"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleEditLink(link)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit link"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Open link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center pb-10 pt-[-20px]">
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Your First Product</h2>
                        <p className="text-gray-600 text-base">Transform your storefront with products and links that drive engagement</p>
                      </div>
                      <NextLink
                        href="/custom-links/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Product
                      </NextLink>
                    </div>
                  )}

                  {/* Usage Limit Warning */}
                  {links.length >= 8 && (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <p className="text-sm font-medium text-orange-900">
                          {links.length === 10
                            ? 'You\'ve reached the maximum limit of 10 products'
                            : `You can add ${10 - links.length} more product${10 - links.length > 1 ? 's' : ''}`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Preview - Right side */}
            <div className="flex items-start justify-center">
              <div
                className="w-80 h-[700px] bg-white rounded-[2rem] sticky top-6 p-4"
                style={{
                  boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset'
                }}
              >
                <div className="w-full h-full rounded-xl overflow-hidden">
                  <iframe
                    src={`/${session?.user?.username}`}
                    className="w-full h-full"
                    style={{
                      transform: 'scale(0.9)',
                      transformOrigin: 'top left',
                      width: '111%',
                      height: '111%',
                      border: 'none',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <LinkForm
          link={selectedLink}
          onClose={() => setShowForm(false)}
          onComplete={handleFormComplete}
        />
      )}

      {/* Analytics Modal */}
      {showAnalytics && analyticsLinkId && (
        <LinkAnalytics
          linkId={analyticsLinkId}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDeleteLink}
        title="Delete Link"
        message="Are you sure you want to delete this link? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}