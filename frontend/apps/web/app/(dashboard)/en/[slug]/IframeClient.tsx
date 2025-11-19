'use client'

import type { IframeMenuItem } from '@frontend/types/api'

interface IframeClientProps {
  menuItem: IframeMenuItem
}

export default function IframeClient({ menuItem }: IframeClientProps) {
  return (
    <div className="h-screen flex flex-col">
      <iframe
        src={menuItem.link}
        className="w-full h-full border-0"
        title={menuItem.title}
        allow="payment"
      />
    </div>
  )
}
