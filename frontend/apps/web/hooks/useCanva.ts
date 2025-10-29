'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import {
  getCanvaAuthUrlAction,
  getCanvaConnectionStatusAction,
  createCanvaDesignAction,
  exportCanvaDesignAction,
  getCanvaDesignsAction,
  getCanvaDesignDetailAction,
  updateCanvaDesignAction,
  deleteCanvaDesignAction
} from '@/actions/canva-action'

/**
 * Canva Visual Editor Integration Hook
 *
 * Flow:
 * 1. Check if user is authenticated with Canva
 * 2. If not, connect via OAuth flow
 * 3. Create design via API → Get edit_url
 * 4. Open Canva editor in new tab (FULL visual editor)
 * 5. User designs in Canva
 * 6. User clicks "Done" → Returns to your platform
 * 7. Export and download design
 *
 * Setup Required:
 * 1. Go to https://www.canva.dev/
 * 2. Create app and get Client ID + Secret
 * 3. Add to .env:
 *    CANVA_CLIENT_ID=your_client_id
 *    CANVA_CLIENT_SECRET=your_client_secret
 */

export function useCanva() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check Canva connection status on mount
  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const result = await getCanvaConnectionStatusAction()

      if ('error' in result) {
        console.error('Failed to check Canva status:', result.error)
        setIsConnected(false)
      } else {
        setIsConnected(result.connected)
      }
    } catch (error) {
      console.error('Error checking Canva status:', error)
      setIsConnected(false)
    } finally {
      setChecking(false)
    }
  }

  const connectToCanva = async () => {
    try {
      // Check if user is logged in
      if (!session?.user?.id) {
        toast.error('Please log in first')
        return
      }

      // Store user ID in localStorage for callback page
      localStorage.setItem('canva_user_id', session.user.id.toString())

      // Get Canva OAuth URL
      const result = await getCanvaAuthUrlAction()

      if ('error' in result) {
        toast.error('Failed to connect', {
          description: result.error
        })
        localStorage.removeItem('canva_user_id')
        return
      }

      // Redirect to Canva OAuth in same tab (not popup)
      // This ensures localStorage is accessible in the callback
      window.location.href = result.auth_url

    } catch (error) {
      console.error('Error connecting to Canva:', error)
      toast.error('Failed to connect to Canva')
      localStorage.removeItem('canva_user_id')
    }
  }

  const openCanvaDesign = async () => {
    // Check if connected
    if (!isConnected) {
      toast.error('Not connected to Canva', {
        description: 'Please connect your Canva account first.',
        action: {
          label: 'Connect',
          onClick: connectToCanva
        }
      })
      return
    }

    try {
      toast.loading('Creating design...')

      // Create design via API (square post by default: 1080x1080)
      const result = await createCanvaDesignAction('square_post')

      toast.dismiss()

      if ('error' in result) {
        if (result.needs_auth) {
          toast.error('Session expired', {
            description: 'Please reconnect to Canva.',
            action: {
              label: 'Reconnect',
              onClick: connectToCanva
            }
          })
          setIsConnected(false)
          return
        }
        toast.error('Failed to create design', {
          description: result.error
        })
        return
      }

      // Open Canva editor in new tab
      const canvaWindow = window.open(result.edit_url, '_blank', 'noopener,noreferrer')

      if (!canvaWindow) {
        toast.error('Pop-up blocked', {
          description: 'Please allow pop-ups to open Canva.'
        })
        return
      }

      toast.success('Opening Canva Editor', {
        description: 'Design in the new tab. Click "Done" when finished.',
        duration: 5000
      })

      // Store design ID for export later
      sessionStorage.setItem('canva_design_id', result.design_id)

    } catch (error) {
      toast.dismiss()
      console.error('Error opening Canva design:', error)
      toast.error('Failed to open Canva')
    }
  }

  const exportDesign = async (designId?: string) => {
    const idToExport = designId || sessionStorage.getItem('canva_design_id')

    if (!idToExport) {
      toast.error('No design to export')
      return
    }

    try {
      toast.loading('Exporting design...')

      const result = await exportCanvaDesignAction(idToExport)

      toast.dismiss()

      if ('error' in result) {
        toast.error('Failed to export design', {
          description: result.error
        })
        return
      }

      // Download the exported design
      const link = document.createElement('a')
      link.href = result.export_url
      link.download = `canva-design-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Design downloaded!', {
        description: 'Your design has been saved to your downloads.'
      })

      // Clear stored design ID
      sessionStorage.removeItem('canva_design_id')

    } catch (error) {
      toast.dismiss()
      console.error('Error exporting design:', error)
      toast.error('Failed to export design')
    }
  }

  const getDesigns = async () => {
    try {
      const result = await getCanvaDesignsAction()

      if ('error' in result) {
        toast.error('Failed to load designs', {
          description: result.error
        })
        return []
      }

      return result
    } catch (error) {
      console.error('Error getting designs:', error)
      toast.error('Failed to load designs')
      return []
    }
  }

  const getDesignDetail = async (designId: string) => {
    try {
      const result = await getCanvaDesignDetailAction(designId)

      if ('error' in result) {
        toast.error('Failed to load design', {
          description: result.error
        })
        return null
      }

      return result
    } catch (error) {
      console.error('Error getting design:', error)
      toast.error('Failed to load design')
      return null
    }
  }

  const updateDesign = async (designId: string, data: any) => {
    try {
      const result = await updateCanvaDesignAction(designId, data)

      if ('error' in result) {
        toast.error('Failed to update design', {
          description: result.error
        })
        return null
      }

      toast.success('Design updated successfully')
      return result
    } catch (error) {
      console.error('Error updating design:', error)
      toast.error('Failed to update design')
      return null
    }
  }

  const deleteDesign = async (designId: string) => {
    try {
      const result = await deleteCanvaDesignAction(designId)

      if ('error' in result) {
        toast.error('Failed to delete design', {
          description: result.error
        })
        return false
      }

      toast.success('Design deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting design:', error)
      toast.error('Failed to delete design')
      return false
    }
  }

  return {
    isConnected,
    checking,
    connectToCanva,
    openCanvaDesign,
    exportDesign,
    getDesigns,
    getDesignDetail,
    updateDesign,
    deleteDesign
  }
}