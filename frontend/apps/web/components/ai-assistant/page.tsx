'use client'

import { useState, useCallback } from 'react'
import { USE_CASES, type UseCaseKey } from './usecases'
import { PromptForm } from './prompt-form'
import { GeneratedContent, type GeneratedItem } from './generated-content'
import { VoiceChatWidget } from './voice-chat'

export function AIAssistantPage() {
    const [activeUseCase, setActiveUseCase] = useState<UseCaseKey>('caption')
    const [items, setItems] = useState<GeneratedItem[]>([])
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = useCallback(async (payload: { useCase: UseCaseKey; prompt: string; images: File[] }) => {
        setIsGenerating(true)
        await new Promise(r => setTimeout(r, 900))
        setItems(prev => [...prev, {
            id: crypto.randomUUID(),
            useCase: payload.useCase,
            prompt: payload.prompt,
            content: mockGenerate(payload.useCase, payload.prompt),
            images: payload.images.map(f => URL.createObjectURL(f)),
            createdAt: Date.now()
        }])
        setIsGenerating(false)
    }, [])

    const addTranscript = (text: string) => {
        setItems(prev => [...prev, {
            id: crypto.randomUUID(),
            useCase: 'voice',
            prompt: text,
            content: mockGenerate('voice', text),
            createdAt: Date.now()
        }])
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Content Assistant</h1>
                    <p className="text-sm text-gray-500 mt-1">Built‑in GPT style assistant for rapid content ideation & production.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {USE_CASES.map(c => (
                        <button
                            key={c.key}
                            onClick={() => setActiveUseCase(c.key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${activeUseCase === c.key ? 'bg-purple-600 text-white border-purple-600' : 'bg-white hover:bg-gray-100'}`}
                        >{c.name}</button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col h-[70vh]">
                    <div className="flex-1 min-h-0 mb-6">
                        <GeneratedContent items={items} isGenerating={isGenerating} />
                    </div>
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <PromptForm useCase={activeUseCase} onSubmit={handleGenerate} isGenerating={isGenerating} />
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white border rounded-lg p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Workflow Tips</h3>
                        <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
                            <li>Switch use cases quickly via tabs.</li>
                            <li>Attach reference images for style consistency.</li>
                            <li>Generate multiple variants; remix prompts.</li>
                            <li>Voice prompts supported (experimental).</li>
                            <li>Future: save to templates & schedule directly.</li>
                        </ul>
                    </div>
                    <VoiceChatWidget onTranscript={addTranscript} />
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 text-xs text-purple-800">
                        <p className="font-semibold mb-1">Roadmap</p>
                        <p>Will connect to backend AI endpoint, enable post scheduling, variant scoring, brand voice memory, and image generation.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function mockGenerate(useCase: UseCaseKey, prompt: string) {
    const base = prompt.slice(0, 120)
    switch (useCase) {
        case 'caption':
            return `${base}\n\n1) ${titleCase(base)} ✨\n2) ${titleCase(base)} 🚀\n3) ${titleCase(base)} 🔥`
        case 'affiliate':
            return `Affiliate Outreach Draft:\nHi [Creator], ${base}...\nLet me know & I’ll send tracking links.`
        case 'email':
            return `Subject Lines:\n• ${titleCase(base)} Today\n• ${titleCase(base)} – Last Chance\n\nBody Starter:\n${base}...`
        case 'cta':
            return `CTA Options:\n• ${titleCase(base)} Now\n• Get Started — ${titleCase(base)}\n• Unlock ${titleCase(base)}`
        case 'image':
            return `Prompt Variations:\n1) Cinematic, volumetric light: ${base}\n2) Flat vector minimal: ${base}\n3) Moody film grain: ${base}`
        case 'voice':
            return `Transcribed Voice Prompt:\n${base}\n\nSuggested Response:\n${titleCase(base)}.`
        default:
            return base
    }
}

function titleCase(s: string) {
    return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}
