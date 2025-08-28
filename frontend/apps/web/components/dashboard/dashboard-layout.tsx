'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingTrigger } from './onboarding-trigger'
import '@/styles/driver-theme.css'
import {
  Home,
  BarChart3,
  Store,
  Link,
  Megaphone,
  Calendar,
  PlusCircle,
  FolderOpen,
  Share2,
  Bot,
  MessageSquare,
  Settings2,
  CreditCard,
  HelpCircle,
  Zap,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import logo from '@/assets/logo.png'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [activeItem, setActiveItem] = useState('dashboard')
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview'])
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { hasSeenOnboarding, startOnboarding } = useOnboarding((sectionId: string) => {
    setExpandedSections([sectionId])
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? [] // Close the section if it's currently open
        : [sectionId] // Open only this section, close all others
    )
  }

  // Map pathname to sidebar items and sections
  const getActiveItemFromPath = (path: string) => {
    switch (path) {
      case '/dashboard':
        return { itemId: 'dashboard', sectionId: 'overview' }
      case '/analytics':
        return { itemId: 'analytics', sectionId: 'overview' }
      case '/storefront':
        return { itemId: 'storefront', sectionId: 'linkinbio' }
      case '/custom-links':
        return { itemId: 'custom-links', sectionId: 'linkinbio' }
      case '/cta-banners':
        return { itemId: 'cta-banners', sectionId: 'linkinbio' }
      case '/calendar':
        return { itemId: 'calendar', sectionId: 'content' }
      case '/post-creator':
        return { itemId: 'post-creator', sectionId: 'content' }
      case '/content-library':
        return { itemId: 'content-library', sectionId: 'content' }
      case '/social-accounts':
        return { itemId: 'social-accounts', sectionId: 'content' }
      case '/ai-assistant':
        return { itemId: 'ai-assistant', sectionId: 'ai-tools' }
      case '/comments':
        return { itemId: 'comments', sectionId: 'automation' }
      case '/automation-rules':
        return { itemId: 'automation-rules', sectionId: 'automation' }
      case '/automation-settings':
        return { itemId: 'automation-settings', sectionId: 'automation' }
      case '/reply-analytics':
        return { itemId: 'reply-analytics', sectionId: 'automation' }
      case '/subscription':
        return { itemId: 'subscription', sectionId: 'business' }
      case '/settings':
        return { itemId: 'settings', sectionId: 'account' }
      default:
        return { itemId: 'dashboard', sectionId: 'overview' }
    }
  }

  // Update active item and expanded section based on current path
  useEffect(() => {
    const { itemId, sectionId } = getActiveItemFromPath(pathname)
    setActiveItem(itemId)
    setExpandedSections([sectionId])
  }, [pathname])

  // Start onboarding for first-time users
  useEffect(() => {
    if (!hasSeenOnboarding && pathname === '/dashboard') {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        startOnboarding()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [hasSeenOnboarding, pathname, startOnboarding])

  const handleItemClick = (itemId: string, sectionId: string) => {
    // Auto-expand this section and close others
    setExpandedSections([sectionId])
    setActiveItem(itemId)

    // Handle navigation
    switch (itemId) {
      case 'dashboard':
        router.push('/dashboard')
        break
      case 'storefront':
        router.push('/storefront')
        break
      case 'custom-links':
        router.push('/custom-links')
        break
      case 'cta-banners':
        router.push('/cta-banners')
        break
      case 'subscription':
        router.push('/subscription')
        break
      case 'ai-assistant':
        router.push('/ai-assistant')
        break
      case 'comments':
        router.push('/comments')
        break
      case 'automation-rules':
        router.push('/automation-rules')
        break
      case 'automation-settings':
        router.push('/automation-settings')
        break
      case 'reply-analytics':
        router.push('/reply-analytics')
        break
      case 'post-creator':
        router.push('/post-creator')
        break
      case 'calendar':
        router.push('/calendar')
        break
      case 'content-library':
        router.push('/content-library')
        break
      case 'social-accounts':
        router.push('/social-accounts')
        break
      case 'settings':
        router.push('/settings')
        break
      default:
        break
    }
  }

  const sidebarSections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: Home,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
      ]
    },
    {
      id: 'linkinbio',
      title: 'Link-in-Bio',
      icon: Store,
      items: [
        { id: 'storefront', label: 'My Storefront', icon: Store },
        { id: 'custom-links', label: 'Custom Links', icon: Link },
        { id: 'cta-banners', label: 'CTA Banners', icon: Megaphone },
      ]
    },
    {
      id: 'content',
      title: 'Content & Social',
      icon: Calendar,
      items: [
        { id: 'calendar', label: 'Content Calendar', icon: Calendar },
        { id: 'post-creator', label: 'Post Creator', icon: PlusCircle },
        { id: 'content-library', label: 'Content Library', icon: FolderOpen },
        { id: 'social-accounts', label: 'Social Accounts', icon: Share2 },
      ]
    },
    {
      id: 'automation',
      title: 'Automation',
      icon: Zap,
      items: [
        { id: 'comments', label: 'Comments', icon: MessageSquare },
        { id: 'automation-rules', label: 'Automation Rules', icon: Zap },
        { id: 'automation-settings', label: 'Automation Settings', icon: Settings2 },
        { id: 'reply-analytics', label: 'Reply Analytics', icon: BarChart3 },
      ]
    },
    {
      id: 'ai-tools',
      title: 'AI & Tools',
      icon: Bot,
      items: [
        { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
      ]
    },
    {
      id: 'business',
      title: 'Business',
      icon: CreditCard,
      items: [
        { id: 'subscription', label: 'Subscription', icon: CreditCard },
      ]
    },
    {
      id: 'account',
      title: 'Account',
      icon: Settings2,
      items: [
        { id: 'settings', label: 'Settings', icon: Settings2 },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50">
        {/* Logo */}
        <div
          onClick={() => {
            router.push('/dashboard')
          }}
          className="flex-shrink-0 p-6 border-b border-gray-200 cursor-pointer">
          <div className="flex items-center gap-2">
            <img src={logo.src} alt="Elevate Social" className="h-10" />
            <span className="font-semibold text-lg text-gray-900">Elevate Social</span>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {sidebarSections.map((section) => (
              <div key={section.id}>
                {/* Section Header - Clickable */}
                <button
                  onClick={() => toggleSection(section.id)}
                  data-tour={`${section.id}-section`}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-5 h-5 text-gray-500" />
                    <span>{section.title}</span>
                  </div>
                  {expandedSections.includes(section.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Section Items - Collapsible with smooth animation */}
                <div
                  className={`ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.includes(section.id)
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                    }`}
                >
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id, section.id)}
                      data-tour={item.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform border ${activeItem === item.id
                        ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                        }`}
                    >
                      <item.icon className={`w-4 h-4 transition-colors duration-200 ${activeItem === item.id ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom section - User profile */}
        <div
          onClick={() => {
            router.push('/settings')
          }}
          className="flex-shrink-0 p-4 border-t border-gray-200">
          <div data-tour="user-profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {session?.user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                @{session?.user?.username || 'username'}
              </p>

            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main content with left margin for fixed sidebar */}
      <div className="ml-64 flex-1">
        {children}
      </div>

      {/* Onboarding help trigger */}
      <OnboardingTrigger expandSection={(sectionId: string) => setExpandedSections([sectionId])} />
    </div>
  )
}

