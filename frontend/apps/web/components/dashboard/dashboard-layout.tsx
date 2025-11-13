'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingTrigger } from './onboarding-trigger'
import { getCurrentUser } from '@/actions/user-action'
import type { UserCurrent } from '@frontend/types/api'
import '@/styles/driver-theme.css'
import {
  Home,
  BarChart3,
  Store,
  Package,
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
  ChevronDown,
  Users,
  ExternalLink,
  Mail,
  Palette,
  GraduationCap,
  LogOut
} from 'lucide-react'
import logo from '@/assets/logo.png'
import { MiloChatbot } from '@/components/milo-chatbot/milo-chatbot'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [activeItem, setActiveItem] = useState('dashboard')
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview'])
  const [userPermissions, setUserPermissions] = useState<UserCurrent | null>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(true)
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  // Fetch user permissions
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!session?.accessToken) {
        setPermissionsLoading(false)
        return
      }

      try {
        const result = await getCurrentUser()
        if (result.success && result.user) {
          setUserPermissions(result.user)
        } else {
          console.error('Failed to fetch user permissions:', result.error)
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error)
      } finally {
        setPermissionsLoading(false)
      }
    }

    fetchUserPermissions()
  }, [session?.accessToken])

  // Define sidebar sections first
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
        { id: 'custom-links', label: 'My Listings', icon: Package },
        { id: 'leads', label: 'Leads', icon: Users },
      ]
    },
    // {
    //   id: 'content',
    //   title: 'Content & Social AI',
    //   icon: Calendar,
    //   items: [
    //     { id: 'calendar', label: 'Content Calendar', icon: Calendar },
    //     { id: 'post-creator', label: 'Post Creator', icon: PlusCircle },
    //     { id: 'content-library', label: 'Content Library', icon: FolderOpen },
    //     { id: 'social-accounts', label: 'Social Accounts', icon: Share2 },
    //   ]
    // },
    // {
    //   id: 'automation',
    //   title: 'Automation',
    //   icon: Zap,
    //   items: [
    //     { id: 'comments', label: 'Comments', icon: MessageSquare },
    //     { id: 'automation-rules', label: 'Automation Rules', icon: Zap },
    //     { id: 'automation-settings', label: 'Automation Settings', icon: Settings2 },
    //     { id: 'reply-analytics', label: 'Reply Analytics', icon: BarChart3 },
    //   ]
    // },
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

  // Check if user has permission for a section
  const hasPermission = (sectionId: string): boolean => {
    if (!userPermissions?.permissions || permissionsLoading) return false // Hide sections until permissions are loaded

    const permissions = userPermissions.permissions as any

    switch (sectionId) {
      case 'overview':
        return permissions.can_access_overview
      case 'linkinbio':
        return permissions.can_access_linkinbio
      case 'content':
        return permissions.can_access_content
      case 'automation':
        return permissions.can_access_automation
      case 'business':
        return permissions.can_access_business
      case 'account':
        return permissions.can_access_account
      default:
        return false
    }
  }

  // Filter sidebar sections based on permissions - only show sections when permissions are loaded
  const allowedSidebarSections = useMemo(() => {
    return permissionsLoading ? [] : sidebarSections.filter(section => hasPermission(section.id))
  }, [permissionsLoading, userPermissions])

  // Initialize onboarding with allowed sections (disabled for now)
  const { hasSeenOnboarding, startOnboarding } = useOnboarding(
    (sectionId: string) => {
      setExpandedSections([sectionId])
    },
    allowedSidebarSections.map(section => section.id)
  )

  // Disable onboarding
  const disableOnboarding = true

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
      case '/custom-links/create':
        return { itemId: 'custom-links', sectionId: 'linkinbio' }
      case '/leads':
        return { itemId: 'leads', sectionId: 'linkinbio' }
      case '/calendar':
        return { itemId: 'calendar', sectionId: 'content' }
      case '/post-creator':
        return { itemId: 'post-creator', sectionId: 'content' }
      case '/content-library':
        return { itemId: 'content-library', sectionId: 'content' }
      case '/social-accounts':
        return { itemId: 'social-accounts', sectionId: 'content' }
      case '/comments':
        return { itemId: 'comments', sectionId: 'automation' }
      case '/automation-rules':
        return { itemId: 'automation-rules', sectionId: 'automation' }
      case '/automation-settings':
        return { itemId: 'automation-settings', sectionId: 'automation' }
      case '/reply-analytics':
        return { itemId: 'reply-analytics', sectionId: 'automation' }
      case '/inbox':
        return { itemId: 'inbox', sectionId: 'communication' }
      case '/subscription':
        return { itemId: 'subscription', sectionId: 'business' }
      case '/settings':
        return { itemId: 'settings', sectionId: 'account' }
      case '/community':
        return { itemId: 'community', sectionId: 'community' }
      case '/prompt-library':
        return { itemId: 'prompt-library', sectionId: 'prompt-library' }
      case '/faq':
        return { itemId: 'faq', sectionId: 'faq' }
      case '/training':
        return { itemId: 'training', sectionId: 'training' }
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

  // Start onboarding for first-time users (disabled)
  useEffect(() => {
    if (!disableOnboarding && !hasSeenOnboarding && pathname === '/dashboard') {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        startOnboarding()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [hasSeenOnboarding, pathname, disableOnboarding]) // Removed startOnboarding from dependencies

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
      case 'leads':
        router.push('/leads')
        break
      case 'subscription':
        router.push('/subscription')
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
      case 'inbox':
        router.push('/inbox')
        break
      case 'settings':
        router.push('/settings')
        break
      case 'prompt-library':
        router.push('/prompt-library')
        break
      default:
        break
    }
  }

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
            {permissionsLoading ? (
              // Skeleton loading state
              <>
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="animate-pulse">
                    {/* Section Header Skeleton */}
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                        <div className="w-24 h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    </div>
                    {/* Section Items Skeleton */}
                    <div className="ml-6 mt-1 space-y-1">
                      {[1, 2].map((itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-3 px-3 py-2">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div className="w-20 h-3 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {allowedSidebarSections.map((section) => (
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
                            ? 'text-white border shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                            }`}
                          style={activeItem === item.id ? { backgroundColor: '#bea4561a', color: '#bea456', borderColor: '#bea45633' } : {}}
                        >
                          <item.icon className={`w-4 h-4 transition-colors duration-200 ${activeItem === item.id ? '' : 'text-gray-400'}`} style={activeItem === item.id ? { color: '#bea456' } : {}} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Community - Standalone clickable item */}
                <button
                  onClick={() => {
                    setActiveItem('community')
                    router.push('/community')
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeItem === 'community'
                    ? 'text-gray-900 bg-gray-50'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Users className="w-5 h-5 text-gray-500" />
                  <span>Community</span>
                </button>

                {/* External Links Section */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  {/* Prompt Library */}
                  <button
                    onClick={() => {
                      setActiveItem('prompt-library')
                      router.push('/prompt-library')
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeItem === 'prompt-library'
                      ? 'text-gray-900 bg-gray-50'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Bot className="w-5 h-5 text-gray-500" />
                    <span>Prompt Library</span>
                  </button>

                  {/* Canva Designs */}
                  <button
                    onClick={() => {
                      setActiveItem('canva')
                      router.push('/canva')
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                  >
                    <Palette className="w-5 h-5 text-gray-500" />
                    <span>Canva Designs</span>
                  </button>

                  {/* Elevate Training */}
                  <button
                    onClick={() => {
                      setActiveItem('training')
                      router.push('/training')
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeItem === 'training'
                      ? 'text-gray-900 bg-gray-50'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <GraduationCap className="w-5 h-5 text-gray-500" />
                    <span>Elevate Training</span>
                  </button>

                  {/* FAQ */}
                  <button
                    onClick={() => {
                      setActiveItem('faq')
                      router.push('/faq')
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeItem === 'faq'
                      ? 'text-gray-900 bg-gray-50'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <HelpCircle className="w-5 h-5 text-gray-500" />
                    <span>FAQ</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Firm Foundation Button */}
        <div className="flex-shrink-0 px-4 pb-4">
          <a
            href="https://app.thewealthcreator.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #bea456 0%, #af9442ff 100%)' }}
          >
            <span>Visit Firm Foundation</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Bottom section - User profile */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div
            onClick={() => {
              router.push('/settings')
            }}
            data-tour="user-profile"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #bea456 0%, #af9442ff 100%)' }}>
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

          {/* Sign Out Button */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content with left margin for fixed sidebar */}
      <div className="ml-64 flex-1 min-w-0">
        {children}
      </div>

      {/* Onboarding help trigger (disabled) */}
      {!disableOnboarding && (
        <OnboardingTrigger expandSection={(sectionId: string) => setExpandedSections([sectionId])} />
      )}

      {/* Milo Chatbot */}
      <MiloChatbot />
    </div>
  )
}

