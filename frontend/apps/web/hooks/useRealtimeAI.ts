import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { generateImageAction } from '@/actions/ai-action'

// Connection states for the Realtime AI
export enum RealtimeConnectionState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  LISTENING = 'listening',
  SPEAKING = 'speaking',
  ERROR = 'error',
  DISCONNECTED = 'disconnected'
}

interface UseRealtimeAIOptions {
  onError?: (error: string) => void
  onStateChange?: (state: RealtimeConnectionState) => void
  apiBaseUrl?: string
  onContentUpdate?: (content: string) => void
  onTypingComplete?: () => void
  onImageGenerated?: (imageFile: File) => void
  onImageGenerationStart?: () => void
  onImageGenerationComplete?: () => void
}

export function useRealtimeAI(options: UseRealtimeAIOptions = {}) {
  const { data: session } = useSession()
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>(RealtimeConnectionState.IDLE)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)

  // Refs for OpenAI Agents SDK
  const sessionRef = useRef<any>(null)
  const agentRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const apiBaseUrl = "https://admin.elevate.social/api"

  // Update state and notify listeners
  const updateState = useCallback((newState: RealtimeConnectionState) => {
    setConnectionState(newState)
    options.onStateChange?.(newState)
  }, [options, connectionState])

  // Handle errors
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    updateState(RealtimeConnectionState.ERROR)
    options.onError?.(errorMessage)
    console.error('Realtime AI Error:', errorMessage)
  }, [updateState, options])

  // Check if Realtime AI is available
  const checkAvailability = useCallback(async () => {
    if (!session?.accessToken) {
      setIsAvailable(false)
      return false
    }

    try {
      const response = await fetch(`${apiBaseUrl}/realtime/status/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setIsAvailable(data.available)
        return data.available
      } else {
        setIsAvailable(false)
        return false
      }
    } catch (err) {
      setIsAvailable(false)
      return false
    }
  }, [apiBaseUrl, session?.accessToken])

  // Get ephemeral token from backend
  const getEphemeralToken = useCallback(async () => {
    if (!session?.accessToken) {
      throw new Error('No access token available')
    }

    const response = await fetch(`${apiBaseUrl}/realtime/session/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get ephemeral token: ${response.status}`)
    }

    const data = await response.json()
    return data.value
  }, [apiBaseUrl, session?.accessToken])

  // Connect using OpenAI Agents SDK
  const connect = useCallback(async () => {
    if (connectionState !== RealtimeConnectionState.IDLE) {
      return false
    }

    updateState(RealtimeConnectionState.CONNECTING)
    setError(null)

    try {
      // Check availability first
      const available = await checkAvailability()
      if (!available) {
        handleError('Realtime AI is not available')
        return false
      }

      // Dynamic import of OpenAI Agents SDK
      const { RealtimeAgent, RealtimeSession, tool } = await import('@openai/agents/realtime')
      const { z } = await import('zod')

      // Create content update tool
      const updatePostContent = tool({
        name: 'update_post_content',
        description: 'Update the social media post content in the composer',
        parameters: z.object({
          content: z.string().describe('The social media post content to set in the composer')
        }),
        execute: async ({ content }) => {
          console.log('🎯 Milo updating post content:', content)

          // Create futuristic animated typing effect
          if (options.onContentUpdate) {
            // Clear existing content first
            options.onContentUpdate('')

            // Type out the content with animation
            let currentText = ''
            const words = content.split(' ')

            for (let i = 0; i < words.length; i++) {
              currentText += (i > 0 ? ' ' : '') + words[i]
              options.onContentUpdate(currentText)

              // Add delay between words for typewriter effect
              await new Promise(resolve => setTimeout(resolve, 150))
            }

            // Signal completion after a brief pause
            await new Promise(resolve => setTimeout(resolve, 800))

            // Send a special signal to indicate typing is complete
            if (options.onTypingComplete) {
              options.onTypingComplete()
            }
          }

          return `Post content updated successfully: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
        },
      })

      // Create image generation tool
      const generatePostImage = tool({
        name: 'generate_post_image',
        description: 'Generate an AI image for the social media post and add it to the media',
        parameters: z.object({
          prompt: z.string().describe('Description of the image to generate for the social media post'),
          style: z.enum(['vivid', 'natural']).describe('Image style - vivid for dramatic, natural for realistic'),
          size: z.enum(['1024x1024', '1792x1024', '1024x1792']).describe('Image size - square, landscape, or portrait')
        }),
        execute: async ({ prompt, style, size }) => {
          console.log('🎨 Milo generating image:', prompt)

          // Signal that image generation is starting
          if (options.onImageGenerationStart) {
            options.onImageGenerationStart()
          }

          try {
            const result = await generateImageAction({
              prompt,
              model: 'dall-e-3',
              size,
              quality: 'standard',
              style,
              n: 1,
              save_to_media: false
            })

            if (result.success && result.images && result.images.length > 0) {
              const imageData = result.images[0]
              if (imageData.b64_json) {
                // Convert base64 to blob and then to File
                const response = await fetch(`data:image/png;base64,${imageData.b64_json}`)
                const blob = await response.blob()
                const file = new File([blob], `milo-generated-${Date.now()}.png`, { type: 'image/png' })

                // Add to media files
                if (options.onImageGenerated) {
                  options.onImageGenerated(file)
                }

                // Signal completion
                if (options.onImageGenerationComplete) {
                  options.onImageGenerationComplete()
                }

                return `Image generated successfully: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}" and added to your post!`
              }
            }

            // Signal completion on failure
            if (options.onImageGenerationComplete) {
              options.onImageGenerationComplete()
            }

            return `Failed to generate image: ${result.error || 'Unknown error'}`
          } catch (error) {
            console.error('Image generation error:', error)

            // Signal completion on error
            if (options.onImageGenerationComplete) {
              options.onImageGenerationComplete()
            }

            return `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        },
      })

      // Create agent with tools
      const agent = new RealtimeAgent({
        name: 'Milo',
        instructions: 'You are Milo, a helpful AI assistant for social media content creation. Be concise, creative, and friendly. Help users create engaging posts, captions, and content ideas. When you want to help create or update social media content, use the update_post_content tool to put the content directly into their post composer. When users ask for images or visual content, use the generate_post_image tool to create AI-generated images for their posts. For images, use "vivid" style and "1024x1024" size as defaults unless the user specifies otherwise.',
        tools: [updatePostContent, generatePostImage],
      })

      // Create session
      const realtimeSession = new RealtimeSession(agent, {
        model: 'gpt-realtime',
      })

      // Set up session event listeners for state tracking
      // Note: These events may not exist in the current SDK version, keeping for future compatibility

      // Get ephemeral token
      console.log('Getting ephemeral token...')
      const ephemeralToken = await getEphemeralToken()
      console.log('Ephemeral token received')

      // Connect to the session
      console.log('Connecting to session...')
      await realtimeSession.connect({ apiKey: ephemeralToken })
      console.log('Session connect call completed')

      // Set up audio visualization after connection
      if (navigator.mediaDevices) {
        try {
          console.log('Setting up audio visualization...')
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          const audioContext = new AudioContext()
          const source = audioContext.createMediaStreamSource(stream)
          const analyser = audioContext.createAnalyser()

          analyser.fftSize = 256
          analyser.smoothingTimeConstant = 0.8
          source.connect(analyser)

          audioContextRef.current = audioContext
          analyserRef.current = analyser
          console.log('Audio visualization setup complete')
        } catch (err) {
          console.warn('Could not set up audio visualization:', err)
        }
      }

      agentRef.current = agent
      sessionRef.current = realtimeSession

      // Set connected state after successful connection
      updateState(RealtimeConnectionState.CONNECTED)

      console.log('Connected to Milo!')
      return true

    } catch (err) {
      handleError('Failed to connect: ' + (err as Error).message)
      return false
    }
  }, [connectionState, updateState, checkAvailability, handleError, getEphemeralToken])

  // Disconnect from Realtime AI
  const disconnect = useCallback(async () => {
    try {
      if (sessionRef.current) {
        // The SDK doesn't have a disconnect method, just interrupt and clean up
        sessionRef.current.interrupt()
        sessionRef.current = null
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      analyserRef.current = null
      agentRef.current = null

      updateState(RealtimeConnectionState.IDLE)
      setError(null)
    } catch (err) {
      console.error('Error disconnecting:', err)
    }
  }, [updateState])

  // Send event (not needed with Agents SDK but keeping for compatibility)
  const sendEvent = useCallback((event: any) => {
    console.log('sendEvent called with:', event)
    // The Agents SDK handles events automatically
  }, [])

  // Get audio frequency data for visualization
  const getAudioData = useCallback(() => {
    if (!analyserRef.current) return new Uint8Array(0)

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    return dataArray
  }, [])

  // Check availability on mount
  useEffect(() => {
    checkAvailability()
  }, [checkAvailability])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Use refs to cleanup without depending on disconnect function
      if (sessionRef.current) {
        sessionRef.current.interrupt()
        sessionRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      analyserRef.current = null
      agentRef.current = null
    }
  }, []) // Empty dependency array - only runs on unmount

  return {
    // State
    connectionState,
    error,
    isAvailable,

    // Actions
    connect,
    disconnect,
    sendEvent,

    // Audio
    getAudioData,
    audioElement: null, // Not needed with Agents SDK

    // Utilities
    checkAvailability,
  }
}