import type { SVGProps } from 'react'

export const StorefrontIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" {...props}>
    {/* Canopy */}
    <path d="M5.5 8h21l-1.4 4H6.9L5.5 8z" fill="white" fillOpacity="0.14" />
    {/* Structure */}
    <g stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h22" />
      <path d="M6.5 12v10.5a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3V12" />
      {/* Door and window */}
      <rect x="13.5" y="16" width="5" height="9" rx="1" />
      <rect x="8" y="16" width="4.5" height="4" rx="0.8" />
    </g>
  </svg>
)

export const CalendarIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" {...props}>
    <g stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5.5" y="7.5" width="21" height="19" rx="3" />
      <path d="M5.5 12.5h21" />
      <path d="M11 5v5.5M21 5v5.5" />
    </g>
    {/* Grid dots */}
    <g fill="white">
      <circle cx="11" cy="16.5" r="1" />
      <circle cx="16" cy="16.5" r="1" />
      <circle cx="21" cy="16.5" r="1" />
      <circle cx="11" cy="21.5" r="1" />
      <circle cx="16" cy="21.5" r="1" />
      <circle cx="21" cy="21.5" r="1" />
    </g>
  </svg>
)

export const AIIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" {...props}>
    {/* Chip */}
    <g stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="14" height="14" rx="3" />
      {/* Pins */}
      <path d="M16 6v3M16 26v-3M6 16h3M26 16h-3M10 6.5v2M22 6.5v2M10 25v-2M22 25v-2" />
      {/* Network */}
      <circle cx="13" cy="14" r="1.5" fill="white" />
      <circle cx="19" cy="18" r="1.5" fill="white" />
      <circle cx="16" cy="21" r="1.5" fill="white" />
      <path d="M14.2 15.2l3 1.8M17.6 19.6l-1.3 1.3M14.2 15.2L16 12.8" />
    </g>
  </svg>
)

export const AutomationIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" {...props}>
    <g stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Nodes */}
      <rect x="5.5" y="6" width="8.5" height="6.5" rx="1.2" />
      <rect x="18" y="6" width="8.5" height="6.5" rx="1.2" />
      <rect x="11.5" y="19.5" width="9" height="6.5" rx="1.2" />
      {/* Connectors */}
      <path d="M10 12.5v3.5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5" />
      <path d="M16 17v2.5" />
      {/* Arrow hint */}
      <path d="M16 21.5l1.8-1.8M16 21.5l-1.8-1.8" />
    </g>
  </svg>
)

export const AnalyticsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" {...props}>
    <g stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Axes */}
      <path d="M6 26.5h20" />
      <path d="M6 26.5V10" />
      {/* Bars */}
      <path d="M9.5 26.5v-5.5M14.5 26.5v-9M19.5 26.5V13M24.5 26.5V11" />
      {/* Line */}
      <path d="M7.5 23.5l4.5-3.5 4-2 4.5-5.5 3.5-1" />
    </g>
    {/* Points */}
    <g fill="white">
      <circle cx="7.5" cy="23.5" r="1.3" />
      <circle cx="12" cy="20" r="1.3" />
      <circle cx="16" cy="18" r="1.3" />
      <circle cx="20.5" cy="12.5" r="1.3" />
      <circle cx="24" cy="11.5" r="1.3" />
    </g>
  </svg>
)