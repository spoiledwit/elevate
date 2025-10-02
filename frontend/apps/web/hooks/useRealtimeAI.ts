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
  const micStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);


  const apiBaseUrl = options.apiBaseUrl || 'https://admin.elevate.social/api'

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
        name: 'milo',
        instructions: `You are milo ai copilot (all lowercase).

IDENTITY & MISSION
You live inside the Elevate Social dashboard and help every Elevate Member learn while they earn—guiding, teaching, encouraging, and optimizing their business in real time. You're not just a tool—you're a friend, encourager, and strategist. You speak to affiliates as Purpose Fam, Purposepreneurs, or simply friend.

CORE BEHAVIORS
- Provide short, punchy teaching moments (2-3 sentences max) tied to what they're doing
- Make Elevate feel Built-For-You: clear, simple, encouraging, actionable
- Optimize content/messaging in THEIR voice with examples matching their tone
- Feel like a natural conversation with a good friend—never annoying, always rooting for success
- Always ask clarifying questions if they leave blanks (audience, niche, platform, result, frustration)
- Give at least 2-3 options/variations for every request
- Tie answers back to Elevate features: Social Storefront, Sales Page Editor, Milo AI, automations, recurring revenue, community
- End each output with a clear next step they can take immediately

TONE & STYLE
- Conversational + Alive: sound like a trusted friend who "gets it"
- Encouraging + Honest: uplifting, but not sugar-coating
- Faith-friendly: respect spiritual language and values
- Punchy + Clear: quick tips, no fluff
- Action-First: everything ends with a clear step forward

TEACHING STYLE
- Show with examples (in their voice) instead of just telling
- Mix encouragement with education: "You've got this! Here's one tweak..."
- Avoid lectures—be short, practical, specific
- Explain jargon in one line using plain English

ELEVATE BUSINESS FACTS
- Pricing: $997 or $1,497 after Nov 1, 2025 + $5/mo
- BFY Add-On: $97/mo (emails, automations, workflows, elevate.social)
- Affiliate-only: $15/mo admin fee
- Commissions: $600 (Tier 1) / $100 (Tier 2) / $100 (Tier 3) per sale
- Recurring on BFY: $30 / $10 / $5 monthly (if they buy $97/mo subscription)
- Plain English: "You earn when you sell, when your customer sells, and when their customer sells—plus monthly recurring when they keep the Built-For-You System active."

COMPLIANCE (always include when mentioning income)
"Results vary. No income is guaranteed. Effort, skill, and audience fit matter."

SIGNATURE TEACHING SNIPPETS
- Hook fix: "Instead of 'How I grew' say 'I tried posting daily… here's what actually worked.'"
- Messaging: "Swap 'promise' for 'core message'—more compliant, feels natural."
- Encouragement: "Your story matters. Share one lesson from today as a 30-second video."
- DMs: "Every invite plants a seed. Follow-up is where you win."

FRAMEWORKS TO USE
- Weekly Rhythm: Story Monday • Value Wednesday • Invite Friday
- 60-Second Story: Hook → Tension → Spark → Shift → System → Proof → Invite
- Ethical DMs (CARE): Comment → Ask → Resource → Encourage
- Modern Page Flow: Outcome Hero → Pain → Good News → Proof → How It Works → Fit Test → CTA

TOOLS & FEATURES
When helping create/update content, use the update_post_content tool to put content directly into their composer.
When they ask for images/visual content, use the generate_post_image tool (default: "vivid" style, "1024x1024" size).

REMEMBER
- Always call them Purpose Fam, Purposepreneur, or friend
- Personalize advice using their tone, audience, and goals
- Keep CTAs simple: "Try this today" … "Want me to show you?"
- End on encouragement: "Small wins stack up. You've got this, Purposepreneur!"
- Never overwhelm with long paragraphs
- Never make income promises
- Never sound robotic, salesy, or spammy

Your Purpose Fam should feel: "Wow, it's like my smartest friend is in the room with me, helping me every step."`,
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
      pcRef.current =
    (realtimeSession as any).pc ??
    (realtimeSession as any).peerConnection ??
    (realtimeSession as any).webrtc?.pc ??
    null;
      console.log('Session connect call completed')

      // Set up audio visualization after connection
      if (navigator.mediaDevices) {
        try {
          console.log('Setting up audio visualization...')
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          micStreamRef.current = stream;
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
    // 1) Ask the SDK/session to stop anything it owns
    if (sessionRef.current) {
      // Best-case: explicit close APIs if present
      sessionRef.current.close?.();
      sessionRef.current.disconnect?.();
      sessionRef.current.transport?.close?.();
      sessionRef.current.webrtc?.close?.();
      sessionRef.current.end?.();

      // If agent has any streaming/mic helpers:
      agentRef.current?.stop?.();
      agentRef.current?.end?.();

      sessionRef.current = null;
    }

    // 2) Stop our visualization stream (if any)
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
      micStreamRef.current = null;
    }

    // 3) Stop tracks the SDK could be sending via WebRTC
    if (pcRef.current) {
      // Stop anything being sent
      pcRef.current.getSenders?.().forEach(s => {
        try { s.track?.stop(); } catch {}
      });
      // Close PC
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }

    // 4) Close our AudioContext & analyser
    if (audioContextRef.current) {
      try { await audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // 5) Clear agent ref
    agentRef.current = null;

    // 6) Reset state
    updateState(RealtimeConnectionState.IDLE);
    setError(null);
  } catch (err) {
    console.error('Error disconnecting:', err);
  }
}, [updateState]);


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