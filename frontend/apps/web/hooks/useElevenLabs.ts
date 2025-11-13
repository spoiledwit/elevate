import { useState, useCallback } from 'react'
import { useConversation } from '@elevenlabs/react'
import { useRouter } from 'next/navigation'

export enum ConnectionState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  LISTENING = 'listening',
  SPEAKING = 'speaking',
  ERROR = 'error',
  DISCONNECTED = 'disconnected'
}

interface UseElevenLabsOptions {
  mode?: 'voice' | 'text'
  onError?: (error: string) => void
  onStateChange?: (state: ConnectionState) => void
  onMessage?: (message: any) => void
  micMuted?: boolean
  volume?: number
}

export function useElevenLabs(options: UseElevenLabsOptions = {}) {
  const { mode = 'text' } = options
  const isVoiceMode = mode === 'voice'
  const router = useRouter()

  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE)
  const [error, setError] = useState<string | null>(null)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

  const conversation = useConversation({
    textOnly: !isVoiceMode,
    micMuted: isVoiceMode ? (options.micMuted ?? false) : undefined,
    volume: isVoiceMode ? (options.volume ?? 1.0) : undefined,

    // Client Tools - Allow agent to perform actions
    clientTools: {
      redirectToLink: async (parameters: { url: string }) => {
        const { url } = parameters

        console.log('🔗 Milo is redirecting to:', url)

        try {
          const trimmedUrl = url.trim()

          // Check if it's an internal route (starts with /)
          if (trimmedUrl.startsWith('/')) {
            console.log('Internal navigation to:', trimmedUrl)
            router.push(trimmedUrl)
            return `Navigating to ${trimmedUrl}`
          }

          // Check if it's an external URL (has protocol)
          if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
            console.log('External redirect to:', trimmedUrl)
            window.location.href = trimmedUrl
            return `Redirecting to ${trimmedUrl}`
          }

          // No protocol - assume external and add https://
          const externalUrl = `https://${trimmedUrl}`
          console.log('External redirect to:', externalUrl)
          window.location.href = externalUrl
          return `Redirecting to ${externalUrl}`
        } catch (error) {
          console.error('Error redirecting:', error)
          return `Failed to redirect to ${url}`
        }
      },
    },

    onConnect: () => {
      console.log(`${mode} mode connected!`)
      if (isVoiceMode) {
        console.log('Voice mode active - microphone should be listening')
      }
      updateState(ConnectionState.CONNECTED)
    },
    onDisconnect: () => {
      console.log(`${mode} mode disconnected`)
      updateState(ConnectionState.IDLE)
    },
    onError: (error: any) => {
      console.error(`${mode} mode error:`, error)
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Connection error')
      handleError(errorMessage)
    },
    onModeChange: isVoiceMode ? ({ mode }: { mode: string }) => {
      console.log('Voice mode changed to:', mode)
      if (mode === 'listening') {
        console.log('🎤 NOW LISTENING FOR VOICE INPUT')
        updateState(ConnectionState.LISTENING)
      } else if (mode === 'speaking') {
        console.log('🔊 AI IS SPEAKING')
        updateState(ConnectionState.SPEAKING)
      } else if (mode === 'idle') {
        console.log('Voice idle')
        updateState(ConnectionState.CONNECTED)
      }
    } : undefined,
    onMessage: (message) => {
      console.log('Message received:', message)
      options.onMessage?.(message)
    },
  })

  const { sendUserMessage } = conversation

  const updateState = useCallback((newState: ConnectionState) => {
    setConnectionState(newState)
    options.onStateChange?.(newState)
  }, [options])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    updateState(ConnectionState.ERROR)
    options.onError?.(errorMessage)
  }, [updateState, options])

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (!isVoiceMode) return true

    try {
      console.log('Checking microphone permission...')

      // Just check permission, don't actually start the stream
      // ElevenLabs will handle the actual mic stream
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      console.log('Microphone permission status:', permissionStatus.state)

      if (permissionStatus.state === 'denied') {
        handleError('Microphone permission denied')
        setMicPermissionGranted(false)
        return false
      }

      setMicPermissionGranted(true)
      return true
    } catch (err) {
      // If permissions API not available, try requesting mic directly
      // but let ElevenLabs handle it in startSession
      console.log('Permissions API not available, will let ElevenLabs request mic')
      setMicPermissionGranted(true)
      return true
    }
  }, [isVoiceMode, handleError])

  const connect = useCallback(async () => {
    if (connectionState !== ConnectionState.IDLE) {
      return false
    }

    if (!agentId) {
      handleError('ElevenLabs Agent ID is not configured')
      return false
    }

    updateState(ConnectionState.CONNECTING)
    setError(null)

    try {
      console.log(`Starting session with ${isVoiceMode ? 'WebRTC (voice)' : 'WebSocket (text)'}`)

      // For voice mode, ElevenLabs will request mic permission during startSession
      await conversation.startSession({
        agentId,
        connectionType: isVoiceMode ? 'webrtc' : 'websocket',
      })

      console.log(`✅ Connected successfully with ${mode} mode`)

      if (isVoiceMode) {
        console.log('Voice mode ready - microphone should now be active')
        setMicPermissionGranted(true)
      }

      return true
    } catch (err) {
      console.error('Connection failed:', err)
      handleError('Failed to connect: ' + (err as Error).message)
      return false
    }
  }, [connectionState, agentId, conversation, updateState, handleError, isVoiceMode, micPermissionGranted, requestMicPermission])

  const disconnect = useCallback(async () => {
    try {
      await conversation.endSession()
      updateState(ConnectionState.IDLE)
      setError(null)
    } catch (err) {
      console.error('Error disconnecting:', err)
    }
  }, [conversation, updateState])

  const isConnected = connectionState === ConnectionState.CONNECTED ||
                      connectionState === ConnectionState.LISTENING ||
                      connectionState === ConnectionState.SPEAKING

  return {
    connectionState,
    error,
    micPermissionGranted: isVoiceMode ? micPermissionGranted : undefined,
    isConnected,
    isListening: connectionState === ConnectionState.LISTENING,
    isSpeaking: connectionState === ConnectionState.SPEAKING,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    connect,
    disconnect,
    sendUserMessage,
    requestMicPermission: isVoiceMode ? requestMicPermission : undefined,
  }
}
