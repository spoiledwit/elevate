'use client'

import { useState, useCallback } from 'react'
import { PromptForm } from './prompt-form'
import { GeneratedContent, type GeneratedItem } from './generated-content'
import { USE_CASES, type UseCaseKey } from './usecases'

export function FloatingAssistant() {
    const [open, setOpen] = useState(false)
    const [activeUseCase, setActiveUseCase] = useState<UseCaseKey>('caption')
    const [items, setItems] = useState<GeneratedItem[]>([])
    const [isGenerating, setIsGenerating] = useState(false)

    const generate = useCallback(async (payload: { useCase: UseCaseKey; prompt: string; images: File[] }) => {
        setIsGenerating(true)
        // Simulated generation delay
        await new Promise(r => setTimeout(r, 800))
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

    return (
        <>
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-5 right-5 z-50 shadow-lg bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14 flex items-center justify-center text-xs font-semibold"
                aria-label="Toggle AI Assistant"
            >AI</button>
            {open && (
                <div className="fixed bottom-24 right-5 z-50 w-[380px] h-[560px] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-500 text-white">
                        <h3 className="text-sm font-semibold">AI Assistant</h3>
                        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xs">Close</button>
                    </div>
                    <div className="flex p-2 gap-2 overflow-x-auto no-scrollbar bg-gray-50">
                        {USE_CASES.filter(c => c.key !== 'voice').map(c => (
                            <button
                                key={c.key}
                                onClick={() => setActiveUseCase(c.key)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${activeUseCase === c.key ? 'bg-purple-600 text-white border-purple-600' : 'bg-white hover:bg-gray-100'}`}
                            >{c.name}</button>
                        ))}
                    </div>
                    <div className="flex-1 flex flex-col px-4 py-3 gap-3">
                        <div className="flex-1 min-h-0">
                            <GeneratedContent items={items} isGenerating={isGenerating} />
                        </div>
                        <PromptForm useCase={activeUseCase} onSubmit={generate} isGenerating={isGenerating} />
                    </div>
                </div>
            )}
        </>
    )
}

function mockGenerate(useCase: UseCaseKey, prompt: string) {
    const base = prompt.slice(0, 80)
    switch (useCase) {
        case 'caption':
            return `${base}\n\nVariant 1: ${titleCase(base)} ✨\nVariant 2: ${titleCase(base)} 🚀\nVariant 3: ${titleCase(base)} 🔥`;
        case 'affiliate':
            return `Hi there! Quick note about an opportunity: ${base}...\n\nCTA: Let me know if you'd like assets.`
        case 'email':
            return `Subject Ideas:\n- ${titleCase(base)} Today\n- ${titleCase(base)} (Don't Miss Out)\n\nBody Draft:\n${base}...`;
        case 'cta':
            return `Primary CTA: ${titleCase(base)} Now\nAlt CTA: Get Started — ${titleCase(base)}\nBanner Copy: ${titleCase(base)} In Minutes.`
        case 'image':
            return `Image Prompt Suggestions:\n1) Ultra-detailed, cinematic: ${base}\n2) Minimal flat vector illustration: ${base}\n3) Moody documentary style: ${base}`
        case 'voice':
            return `Transcribed voice intent: ${base}\nSuggested Reply: ${titleCase(base)}.`
        default:
            return base
    }
}

function titleCase(s: string) {
    return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}
