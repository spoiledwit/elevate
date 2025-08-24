import { getMediaAction, getFoldersAction } from '@/actions'
import { ContentLibraryManager } from '@/components/dashboard/content-library/ContentLibraryManager'

// Types for the transformed media items
interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video' | 'document' | 'archive'
  size: number
  dimensions?: { width: number; height: number }
  duration?: number
  url: string
  thumbnail: string
  uploadedAt: Date
  tags: string[]
  usedIn: string[]
  folder: string
}

interface FolderItem {
  id: string
  name: string
  media_count: number
  is_default: boolean
}

// Transform API data to UI format
const transformMediaItem = (apiItem: any): MediaItem => {
  return {
    id: apiItem.id.toString(),
    name: apiItem.file_name || 'Untitled',
    type: 'image', // For now, assume all are images since we only support images
    size: apiItem.file_size || 0,
    url: apiItem.url,
    thumbnail: apiItem.url, // Use same URL for thumbnail
    uploadedAt: new Date(apiItem.created_at),
    tags: [], // No tags in current API
    usedIn: [`Used in ${apiItem.used_in_posts_count} posts`],
    folder: apiItem.folder_name || 'Default'
  }
}

export default async function ContentLibraryPage() {
  // Load both media and folders in parallel on server
  const [mediaResult, foldersResult] = await Promise.all([
    getMediaAction(),
    getFoldersAction()
  ])

  // Handle media transformation
  let initialMediaItems: MediaItem[] = []

  if (!('error' in mediaResult)) {
    initialMediaItems = Array.isArray(mediaResult)
      ? mediaResult.map(transformMediaItem)
      : []
  }

  // Handle folders transformation
  let initialFolders: FolderItem[] = []

  if (!('error' in foldersResult)) {
    const folderItems = foldersResult.results || []
    initialFolders = folderItems.map((folder: any) => ({
      id: folder.id.toString(),
      name: folder.name,
      media_count: parseInt(folder.media_count),
      is_default: folder.is_default
    }))
  }

  return (
    <ContentLibraryManager
      initialMediaItems={initialMediaItems}
      initialFolders={initialFolders}
    />
  )
}