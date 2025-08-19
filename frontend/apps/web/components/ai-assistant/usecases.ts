export type UseCaseKey = 'caption' | 'affiliate' | 'email' | 'cta' | 'image' | 'voice'

export interface UseCaseMeta {
  key: UseCaseKey
  name: string
  description: string
  placeholder: string
  multiInput?: boolean
  supportsImages?: boolean
  supportsVoice?: boolean
}

export const USE_CASES: UseCaseMeta[] = [
  {
    key: 'caption',
    name: 'Captions & Posts',
    description: 'Generate social media captions or multi-platform post drafts.',
    placeholder: 'Describe the post topic, tone, target platform(s)...'
  },
  {
    key: 'affiliate',
    name: 'Affiliate Messages',
    description: 'Craft persuasive affiliate outreach or promo DMs.',
    placeholder: 'Provide product, audience, incentive details...'
  },
  {
    key: 'email',
    name: 'Email & Marketing Copy',
    description: 'Generate email subject lines, sequences or landing copy.',
    placeholder: 'Explain campaign goal, audience, offer, tone...'
  },
  {
    key: 'cta',
    name: 'CTA & Banner Copy',
    description: 'Short high-converting call‑to‑action & banner variants.',
    placeholder: 'Explain product / action desired / style (urgent, friendly, etc.)'
  },
  {
    key: 'image',
    name: 'Image Prompts',
    description: 'Draft prompts for AI image generation or attach reference images.',
    placeholder: 'Describe the visual style, subject, mood, color palette...',
    supportsImages: true
  },
  {
    key: 'voice',
    name: 'Voice Chat',
    description: 'Talk to the assistant; transcribe + generate responses.',
    placeholder: 'Click record and start speaking...',
    supportsVoice: true
  }
]

export function getUseCase(key: UseCaseKey) {
  return USE_CASES.find(c => c.key === key)
}
