'use client'

import { useState, useRef } from 'react'

interface VoiceChatWidgetProps {
    onTranscript: (text: string) => void
}

export function VoiceChatWidget({ onTranscript }: VoiceChatWidgetProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState<string>('')
    const recognitionRef = useRef<any | null>(null)

    const start = async () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            setTranscript('Voice API not supported in this browser.')
            return
        }
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const rec = new SpeechRecognition()
        rec.continuous = true
        rec.interimResults = true
        rec.onresult = (e: any) => {
            let final = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
                final += e.results[i][0].transcript
            }
            setTranscript(final)
        }
        rec.onerror = () => setIsRecording(false)
        rec.onend = () => setIsRecording(false)
        recognitionRef.current = rec
        rec.start()
        setIsRecording(true)
    }

    const stop = () => {
        recognitionRef.current?.stop()
        setIsRecording(false)
        if (transcript.trim()) onTranscript(transcript.trim())
    }

    return (
        <div className="bg-white border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Voice Chat</h4>
                <span className="text-[10px] text-gray-400">Experimental</span>
            </div>
            <p className="text-xs text-gray-500">Record a voice prompt (local browser transcription).</p>
            <div className="flex items-center gap-3">
                <button
                    onClick={isRecording ? stop : start}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium text-white transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
                >{isRecording ? 'Stop' : 'Record'}</button>
                <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
            </div>
            <div className="min-h-[60px] text-xs whitespace-pre-wrap bg-gray-50 rounded p-2 border border-gray-200 overflow-y-auto">
                {transcript || 'Transcript will appear here...'}
            </div>
        </div>
    )
}
