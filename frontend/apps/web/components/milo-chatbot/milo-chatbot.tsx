'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Mic, MicOff, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useRealtimeAI, RealtimeConnectionState } from '@/hooks/useRealtimeAI'
import milo from "@/assets/milo.svg";

interface MiloChatbotProps {
  onContentUpdate?: (content: string) => void
  onTypingComplete?: () => void
  onImageGenerated?: (imageFile: File) => void
  onImageGenerationStart?: () => void
  onImageGenerationComplete?: () => void
}

export function MiloChatbot(props: MiloChatbotProps = {}) {
  const { onContentUpdate, onTypingComplete, onImageGenerated, onImageGenerationStart, onImageGenerationComplete } = props
  const [isOpen, setIsOpen] = useState(false)
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(7))

  const {
    connectionState,
    error,
    isAvailable,
    connect,
    disconnect,
    getAudioData,
  } = useRealtimeAI({
    onError: (error) => {
      console.error('Milo AI Error:', error)
    },
    onStateChange: (state) => {
      console.log('Milo AI State:', state)
    },
    onContentUpdate: onContentUpdate,
    onTypingComplete: onTypingComplete,
    onImageGenerated: onImageGenerated,
    onImageGenerationStart: onImageGenerationStart,
    onImageGenerationComplete: onImageGenerationComplete
  })

  const isConnected = connectionState === RealtimeConnectionState.CONNECTED ||
    connectionState === RealtimeConnectionState.LISTENING ||
    connectionState === RealtimeConnectionState.SPEAKING

  const isListening = connectionState === RealtimeConnectionState.LISTENING
  const isSpeaking = connectionState === RealtimeConnectionState.SPEAKING
  const isConnecting = connectionState === RealtimeConnectionState.CONNECTING

  // Update audio visualization data
  useEffect(() => {
    let animationFrame: number

    const updateAudioData = () => {
      if (isConnected) {
        const data = getAudioData()
        // Convert to 7 bars by grouping frequency bins
        const bars = new Uint8Array(7)
        const binSize = Math.floor(data.length / 7)

        for (let i = 0; i < 7; i++) {
          let sum = 0
          for (let j = 0; j < binSize; j++) {
            sum += data[i * binSize + j] || 0
          }
          bars[i] = sum / binSize
        }

        setAudioData(bars)
      }
      animationFrame = requestAnimationFrame(updateAudioData)
    }

    if (isConnected) {
      updateAudioData()
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isConnected, getAudioData])

  const handleMicClick = useCallback(async () => {
    if (!isAvailable) {
      return
    }

    if (isConnected) {
      disconnect()
    } else {
      await connect()
    }
  }, [isAvailable, isConnected, connect, disconnect])

  const handleClose = useCallback(() => {
    if (isConnected) {
      disconnect()
    }
    setIsOpen(false)
  }, [isConnected, disconnect])

  return (
    <>
      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 group",
          "w-16 h-16 rounded-full",
          "bg-gradient-to-br from-violet-600 via-brand-600 to-indigo-700",
          "shadow-[0_0_40px_rgba(139,92,246,0.5)]",
          "hover:shadow-[0_0_60px_rgba(139,92,246,0.8)]",
          "transition-all duration-500 transform hover:scale-110",
          "flex items-center justify-center",
          "backdrop-blur-xl border border-white/10",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
        aria-label="Open Milo"
      >
        <div className="relative w-16 h-16 flex items-center justify-center">
          <Image src={milo.src} alt="Milo" fill className="object-contain" />
        </div>
      </button>

      {/* Chat Dialog - Dark Theme */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-[420px] h-[600px] max-h-[80vh]",
          "bg-gradient-to-b from-gray-900/95 to-black/95",
          "backdrop-blur-2xl",
          "rounded-3xl",
          "border border-white/10",
          "shadow-[0_0_80px_rgba(139,92,246,0.3)]",
          "flex flex-col overflow-hidden",
          "transition-all duration-500 transform origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header - Minimal */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden">
                <Image src={milo.src} alt="Milo" fill className="object-contain" />
              </div>
              {/* Animated status dot */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-gray-900">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight">MILO</h3>
              <p className="text-xs text-purple-400 font-medium">AI Voice</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Voice Visualization Area - Futuristic */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-8">
          {/* Background gradient orb */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "w-64 h-64 rounded-full transition-all duration-1000",
              isConnected
                ? "bg-gradient-to-r from-violet-600/20 to-brand-600/20 blur-3xl animate-pulse"
                : isConnecting
                  ? "bg-gradient-to-r from-blue-600/15 to-violet-600/15 blur-3xl animate-pulse"
                  : "bg-gradient-to-r from-violet-600/10 to-brand-600/10 blur-3xl"
            )}></div>
          </div>

          {/* Debug: Show current state - commented out for production */}
          {/* <div className="absolute top-2 left-2 text-xs text-white/70 z-50">
            State: {connectionState} | Connecting: {isConnecting.toString()} | Connected: {isConnected.toString()}
          </div> */}

          {error ? (
            <div className="relative text-center space-y-6 z-10">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-xl flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-red-400 font-light tracking-widest uppercase text-sm">Error</h3>
                <p className="text-xs text-red-300 max-w-xs">{error}</p>
                <div className="flex items-center justify-center gap-6 pt-2">
                  <button
                    onClick={handleMicClick}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 transition-all duration-300 group"
                  >
                    <Mic className="w-5 h-5 text-purple-300 group-hover:text-purple-200" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-400/50 transition-all duration-300 group"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-red-300" />
                  </button>
                </div>
              </div>
            </div>
          ) : isConnecting ? (
            <div className="relative text-center space-y-6 z-10">
              <div className="relative w-32 h-32 mx-auto">
                <Image src={milo.src} alt="Milo" fill className="object-contain animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-blue-300 font-light tracking-widest uppercase text-sm">Connecting</h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto"></div>
              </div>
            </div>
          ) : isConnected ? (
            <div className="relative space-y-8 z-10">
              {/* Real-time audio visualization */}
              <div className="flex items-center justify-center gap-1.5">
                {Array.from(audioData).map((amplitude, i) => {
                  const height = Math.max(20, (amplitude / 255) * 80 + 20)
                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-1 rounded-full transition-all duration-75",
                        isListening
                          ? "bg-gradient-to-t from-violet-500 to-purple-400 shadow-lg shadow-brand-500/50"
                          : isSpeaking
                            ? "bg-gradient-to-t from-green-500 to-emerald-400 shadow-lg shadow-green-500/50"
                            : "bg-gradient-to-t from-violet-500/50 to-purple-400/50"
                      )}
                      style={{ height: `${height}px` }}
                    ></div>
                  )
                })}
              </div>

              {/* Status */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    isListening ? "bg-purple-400" : isSpeaking ? "bg-green-400" : "bg-blue-400"
                  )}></div>
                  <span className={cn(
                    "text-sm font-medium tracking-wider uppercase",
                    isListening ? "text-purple-400" : isSpeaking ? "text-green-400" : "text-blue-400"
                  )}>
                    {isListening ? "Listening" : isSpeaking ? "Speaking" : "Connected"}
                  </span>
                </div>

                {/* Control Icons */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  <button
                    onClick={handleMicClick}
                    className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 hover:border-red-400/50 transition-all duration-300 group"
                  >
                    <MicOff className="w-5 h-5 text-red-300 group-hover:text-red-200" />
                  </button>

                  <button
                    onClick={handleClose}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-400/50 transition-all duration-300 group"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-red-300" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative text-center space-y-6 z-10">
              {/* Milo icon */}
              <div className="relative w-32 h-32 mx-auto">
                <Image src={milo.src} alt="Milo" fill className="object-contain" />
              </div>

              {/* Minimal text */}
              <div className="space-y-4">
                <h3 className="text-white font-light tracking-widest uppercase text-sm">Milo</h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent mx-auto"></div>

                {/* Control Icons */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  <button
                    onClick={handleMicClick}
                    disabled={!isAvailable}
                    className={cn(
                      "p-3 rounded-full border transition-all duration-300 group",
                      isAvailable
                        ? "bg-white/5 hover:bg-white/10 border-white/10 hover:border-purple-400/50"
                        : "bg-gray-500/20 border-gray-500/30 cursor-not-allowed opacity-50"
                    )}
                  >
                    <Mic className={cn(
                      "w-5 h-5 transition-colors",
                      isAvailable ? "text-purple-300 group-hover:text-purple-200" : "text-gray-500"
                    )} />
                  </button>

                  <button
                    onClick={handleClose}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-400/50 transition-all duration-300 group"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-red-300" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  )
}