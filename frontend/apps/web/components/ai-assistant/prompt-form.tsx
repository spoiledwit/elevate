'use client'

import { useState, useRef, useCallback } from 'react'
import type { UseCaseKey } from './usecases'
import { getUseCase } from './usecases'

interface PromptFormProps {
    useCase: UseCaseKey
    onSubmit: (payload: { useCase: UseCaseKey; prompt: string; images: File[] }) => void
    isGenerating: boolean
}

export function PromptForm({ useCase, onSubmit, isGenerating }: PromptFormProps) {
    const meta = getUseCase(useCase)!
    const [prompt, setPrompt] = useState('')
    const [images, setImages] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const handleSelectImages = () => {
        fileInputRef.current?.click()
    }

    const handleFiles = (files: FileList | null) => {
        if (!files) return
        const list = Array.from(files).slice(0, 4) // limit preview
        setImages(prev => [...prev, ...list])
    }

    const handleRemoveImage = (idx: number) => {
        setImages(prev => prev.filter((_, i) => i !== idx))
    }

    const submit = useCallback(() => {
        if (!prompt.trim()) return
        onSubmit({ useCase, prompt: prompt.trim(), images })
        setPrompt('')
        setImages([])
    }, [prompt, images, useCase, onSubmit])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{meta.name}</h3>
                <span className="text-xs text-gray-400">{meta.description}</span>
            </div>
            <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={meta.placeholder}
                rows={4}
                className="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {meta.supportsImages && (
                <div className="border border-dashed rounded-md p-3 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            type="button"
                            onClick={handleSelectImages}
                            className="px-3 py-1.5 rounded-md bg-white border text-xs font-medium hover:bg-gray-100"
                        >Attach Images</button>
                        <span className="text-xs text-gray-500">Optional (max 4 preview)</span>
                        <input
                            ref={fileInputRef}
                            onChange={e => handleFiles(e.target.files)}
                            multiple
                            type="file"
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {images.map((f, i) => (
                                <div key={i} className="relative w-16 h-16 border rounded overflow-hidden bg-white">
                                    <img src={URL.createObjectURL(f)} className="object-cover w-full h-full" alt={f.name} />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(i)}
                                        className="absolute -top-1 -right-1 bg-black/70 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center"
                                    >&times;</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={submit}
                    disabled={!prompt.trim() || isGenerating}
                    className="px-5 py-2 rounded-md bg-purple-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
                >{isGenerating ? 'Generating...' : 'Generate'}</button>
            </div>
        </div>
    )
}
