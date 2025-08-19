'use client'

import { useEffect, useRef } from 'react'

export interface GeneratedItem {
    id: string
    useCase: string
    prompt: string
    content: string
    images?: string[]
    createdAt: number
}

interface GeneratedContentProps {
    items: GeneratedItem[]
    isGenerating: boolean
}

export function GeneratedContent({ items, isGenerating }: GeneratedContentProps) {
    const bottomRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [items.length])

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {items.length === 0 && !isGenerating && (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                        No generations yet. Submit a prompt to get started.
                    </div>
                )}
                {items.map(item => (
                    <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">{item.useCase}</span>
                            <span className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-gray-400 italic mb-2">Prompt: {item.prompt}</p>
                        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap text-sm">{item.content}</div>
                        {item.images?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.images.map((src, i) => (
                                    <img key={i} src={src} className="w-20 h-20 object-cover rounded" />
                                ))}
                            </div>
                        ) : null}
                    </div>
                ))}
                {isGenerating && (
                    <div className="animate-pulse border bg-white rounded-lg p-4 text-sm text-gray-500">Generating...</div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    )
}
