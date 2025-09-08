'use client'

import { useEffect, useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { 
  Home, Store, Link, Megaphone, Calendar, PlusCircle, 
  FolderOpen, Share2, MessageSquare, Zap, Settings2, 
  BarChart3, Bot, CreditCard, HelpCircle, User 
} from 'lucide-react'

// Helper function to render icon with title
const createTitleWithIcon = (IconComponent: any, title: string) => {
  const iconHtml = renderToString(React.createElement(IconComponent, { size: 16, className: "inline mr-2" }))
  return `${iconHtml}${title}`
}

const ONBOARDING_STORAGE_KEY = 'elevate-onboarding-completed'

interface OnboardingStep {
  element: string
  popover: {
    title: string
    description: string
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
  }
}

interface OnboardingStepWithSection extends OnboardingStep {
  sectionToExpand?: string
}

const sidebarOnboardingSteps: OnboardingStepWithSection[] = [
  // Overview Section
  {
    element: '[data-tour="overview-section"]',
    popover: {
      title: createTitleWithIcon(Home, 'Overview Section'),
      description: 'Start your journey here with your main dashboard and analytics overview.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="dashboard"]',
    sectionToExpand: 'overview',
    popover: {
      title: createTitleWithIcon(BarChart3, 'Dashboard'),
      description: 'Your main hub to view analytics, recent activity, and get quick insights into your social media performance.',
      side: 'right',
      align: 'start'
    }
  },
  
  // Link-in-Bio Section
  {
    element: '[data-tour="linkinbio-section"]',
    popover: {
      title: createTitleWithIcon(Store, 'Link-in-Bio Section'),
      description: 'Create a beautiful landing page for your social media bio. This section contains tools to build your personal storefront.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="storefront"]',
    sectionToExpand: 'linkinbio',
    popover: {
      title: createTitleWithIcon(Store, 'My Storefront'),
      description: 'Design and customize your personal storefront that you can link in your social media bios.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="custom-links"]',
    sectionToExpand: 'linkinbio',
    popover: {
      title: createTitleWithIcon(Link, 'Custom Links'),
      description: 'Add clickable links to your storefront. Perfect for promoting products, services, or other content.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="cta-banners"]',
    sectionToExpand: 'linkinbio',
    popover: {
      title: createTitleWithIcon(Megaphone, 'CTA Banners'),
      description: 'Create eye-catching call-to-action banners to promote special offers, events, or important announcements.',
      side: 'right',
      align: 'start'
    }
  },
  
  // Content & Social Section
  {
    element: '[data-tour="content-section"]',
    popover: {
      title: createTitleWithIcon(Calendar, 'Content & Social Section'),
      description: 'Manage all your social media content from one place. Schedule posts, organize media, and connect your accounts.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="calendar"]',
    sectionToExpand: 'content',
    popover: {
      title: createTitleWithIcon(Calendar, 'Content Calendar'),
      description: 'Plan and schedule your social media posts across all connected platforms with our visual calendar.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="post-creator"]',
    sectionToExpand: 'content',
    popover: {
      title: createTitleWithIcon(PlusCircle, 'Post Creator'),
      description: 'Create engaging posts with our built-in editor. Add images, write captions, and schedule for multiple platforms.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="content-library"]',
    sectionToExpand: 'content',
    popover: {
      title: createTitleWithIcon(FolderOpen, 'Content Library'),
      description: 'Store and organize all your media files, images, and content assets in one centralized library.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="social-accounts"]',
    sectionToExpand: 'content',
    popover: {
      title: createTitleWithIcon(Share2, 'Social Accounts'),
      description: 'Connect and manage your social media platforms. Link Instagram, Facebook, LinkedIn, and more.',
      side: 'right',
      align: 'start'
    }
  },
  
  // Automation Section
  {
    element: '[data-tour="automation-section"]',
    popover: {
      title: createTitleWithIcon(Zap, 'Automation Section'),
      description: 'Set up smart automation to engage with your audience automatically and save time on repetitive tasks.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="comments"]',
    sectionToExpand: 'automation',
    popover: {
      title: createTitleWithIcon(MessageSquare, 'Comments'),
      description: 'View and manage comments from your social media posts. Monitor engagement and interact with your audience.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="automation-rules"]',
    sectionToExpand: 'automation',
    popover: {
      title: createTitleWithIcon(Zap, 'Automation Rules'),
      description: 'Create smart rules to automatically respond to comments, mentions, and direct messages.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="automation-settings"]',
    sectionToExpand: 'automation',
    popover: {
      title: createTitleWithIcon(Settings2, 'Automation Settings'),
      description: 'Configure your automation preferences and manage which accounts have automation enabled.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="reply-analytics"]',
    sectionToExpand: 'automation',
    popover: {
      title: createTitleWithIcon(BarChart3, 'Reply Analytics'),
      description: 'Track the performance of your automated responses and engagement metrics.',
      side: 'right',
      align: 'start'
    }
  },
  
  // AI & Tools Section
  {
    element: '[data-tour="ai-tools-section"]',
    popover: {
      title: createTitleWithIcon(Bot, 'AI & Tools Section'),
      description: 'Access powerful AI tools to help you create better content and automate your social media workflow.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="ai-assistant"]',
    sectionToExpand: 'ai-tools',
    popover: {
      title: createTitleWithIcon(Bot, 'AI Assistant'),
      description: 'Get help creating content with AI. Generate captions, improve text, and get content ideas instantly.',
      side: 'right',
      align: 'start'
    }
  },
  
  // Business Section
  {
    element: '[data-tour="business-section"]',
    popover: {
      title: createTitleWithIcon(CreditCard, 'Business Section'),
      description: 'Manage your subscription, billing, and business-related settings.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="subscription"]',
    sectionToExpand: 'business',
    popover: {
      title: createTitleWithIcon(CreditCard, 'Subscription'),
      description: 'Manage your subscription plan, view usage, and upgrade or modify your plan as needed.',
      side: 'right',
      align: 'start'
    }
  },
  
  // Account Section
  {
    element: '[data-tour="account-section"]',
    popover: {
      title: createTitleWithIcon(Settings2, 'Account Section'),
      description: 'Access your personal account settings, profile information, and get help when needed.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="settings"]',
    sectionToExpand: 'account',
    popover: {
      title: createTitleWithIcon(Settings2, 'Settings'),
      description: 'Update your profile, change passwords, and configure your account preferences.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="support"]',
    sectionToExpand: 'account',
    popover: {
      title: createTitleWithIcon(HelpCircle, 'Support'),
      description: 'Get help, contact support, access documentation, and find answers to common questions.',
      side: 'right',
      align: 'start'
    }
  },
  
  // User Profile
  {
    element: '[data-tour="user-profile"]',
    popover: {
      title: createTitleWithIcon(User, 'Your Profile'),
      description: 'Quick access to your user profile, account menu, and logout options.',
      side: 'top',
      align: 'center'
    }
  }
]

export function useOnboarding(expandSection?: (sectionId: string) => void, allowedSections?: string[]) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true) // Default to true to avoid flash
  
  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    setHasSeenOnboarding(!!completed)
  }, [])

  // Filter onboarding steps based on allowed sections
  const getFilteredOnboardingSteps = () => {
    if (!allowedSections || allowedSections.length === 0) {
      // If no allowed sections provided, show all steps (fallback)
      return sidebarOnboardingSteps
    }

    return sidebarOnboardingSteps.filter(step => {
      // Always include the user profile step at the end
      if (step.element === '[data-tour="user-profile"]') {
        return true
      }

      // Check if this step is for an allowed section
      const sectionMatches = [
        { section: 'overview', selectors: ['[data-tour="overview-section"]', '[data-tour="dashboard"]'] },
        { section: 'linkinbio', selectors: ['[data-tour="linkinbio-section"]', '[data-tour="storefront"]', '[data-tour="custom-links"]', '[data-tour="cta-banners"]'] },
        { section: 'content', selectors: ['[data-tour="content-section"]', '[data-tour="calendar"]', '[data-tour="post-creator"]', '[data-tour="content-library"]', '[data-tour="social-accounts"]'] },
        { section: 'automation', selectors: ['[data-tour="automation-section"]', '[data-tour="comments"]', '[data-tour="automation-rules"]', '[data-tour="automation-settings"]', '[data-tour="reply-analytics"]'] },
        { section: 'ai-tools', selectors: ['[data-tour="ai-tools-section"]', '[data-tour="ai-assistant"]'] },
        { section: 'business', selectors: ['[data-tour="business-section"]', '[data-tour="subscription"]'] },
        { section: 'account', selectors: ['[data-tour="account-section"]', '[data-tour="settings"]', '[data-tour="support"]'] }
      ]

      // Find which section this step belongs to
      for (const sectionMatch of sectionMatches) {
        if (sectionMatch.selectors.includes(step.element)) {
          return allowedSections.includes(sectionMatch.section)
        }
      }

      // If we can't determine the section, exclude it for safety
      return false
    })
  }

  const startOnboarding = () => {
    const filteredSteps = getFilteredOnboardingSteps()
    
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: filteredSteps,
      onDestroyed: () => {
        // Mark onboarding as completed when user finishes or closes
        markOnboardingCompleted()
      },
      onNextClick: (_element, _step, _options) => {
        // Get the current active step index
        const currentStepIndex = driverObj.getActiveIndex() ?? 0
        const nextStepIndex = currentStepIndex + 1
        
        // Before moving to next step, check if we need to expand a section
        if (nextStepIndex < filteredSteps.length) {
          const nextStep = filteredSteps[nextStepIndex] as OnboardingStepWithSection
          if (nextStep.sectionToExpand && expandSection) {
            expandSection(nextStep.sectionToExpand)
            // Wait for section to expand, then move to next step
            setTimeout(() => {
              driverObj.moveNext()
            }, 350)
            return // Prevent default next behavior
          }
        }
        
        // Default next behavior
        driverObj.moveNext()
      },
      // Custom styling to match the app theme
      popoverClass: 'driverjs-theme-elevate',
      // Smooth animations
      animate: true,
      // Don't allow clicking outside to close
      allowClose: true,
      // Overlay settings
      overlayColor: 'black',
      overlayOpacity: 0.7,
    })

    // Before starting the tour, expand the first section if needed
    const firstStep = filteredSteps[0] as OnboardingStepWithSection
    if (firstStep.sectionToExpand && expandSection) {
      expandSection(firstStep.sectionToExpand)
    }

    driverObj.drive()
  }

  const markOnboardingCompleted = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    setHasSeenOnboarding(true)
  }

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    setHasSeenOnboarding(false)
  }

  return {
    hasSeenOnboarding,
    startOnboarding,
    markOnboardingCompleted,
    resetOnboarding
  }
}