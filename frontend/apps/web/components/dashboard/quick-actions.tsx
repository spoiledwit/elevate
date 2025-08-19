'use client'

export function QuickActions() {
  const actions = [
    {
      id: 'posts',
      title: 'My posts',
      value: '0',
      subtitle: 'Aug 6 - 13',
      action: 'Connect socials',
      icon: PostIcon,
      color: 'purple'
    },
    {
      id: 'clicks',
      title: 'My clicks',
      value: '0',
      subtitle: 'Aug 6 - 13',
      action: 'Share Link in Bio',
      icon: ClickIcon,
      color: 'blue'
    },
    {
      id: 'sales',
      title: 'My sales',
      value: '0',
      subtitle: 'Aug 6 - 13',
      action: 'Add a product',
      icon: SalesIcon,
      color: 'green'
    }
  ]

  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <div key={action.id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <action.icon className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">{action.title}</h3>
            </div>
            <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
              {action.action}
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900">{action.value}</div>
            <div className="text-sm text-gray-500">{action.subtitle}</div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  action.color === 'purple' ? 'bg-purple-500' :
                  action.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: '10%' }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PostIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function ClickIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
  )
}

function SalesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
}