'use client'

import { useState } from 'react'
import { Calendar, Clock, ChevronDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostSchedulerProps {
  isScheduled: boolean
  scheduledDate: Date | null
  onScheduleToggle: (scheduled: boolean) => void
  onDateChange: (date: Date | null) => void
}

export function PostScheduler({ isScheduled, scheduledDate, onScheduleToggle, onDateChange }: PostSchedulerProps) {
  const [showTimeSlots, setShowTimeSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [selectedDate, setSelectedDate] = useState('')

  // Generate suggested optimal posting times
  const optimalTimes = [
    { time: '09:00', label: '9:00 AM', engagement: 'high' },
    { time: '12:00', label: '12:00 PM', engagement: 'peak' },
    { time: '17:00', label: '5:00 PM', engagement: 'peak' },
    { time: '19:00', label: '7:00 PM', engagement: 'high' },
    { time: '21:00', label: '9:00 PM', engagement: 'medium' }
  ]

  const handleScheduleToggle = () => {
    const newScheduled = !isScheduled
    onScheduleToggle(newScheduled)

    if (newScheduled && !scheduledDate) {
      // Set default date to tomorrow at 9 AM
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      onDateChange(tomorrow)
    } else if (!newScheduled) {
      onDateChange(null)
    }
  }

  const handleDateTimeChange = () => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const date = new Date(selectedDate)
      date.setHours(hours, minutes, 0, 0)
      onDateChange(date)
    }
  }

  // Format date for display
  const formatScheduledDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Schedule Post</h2>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isScheduled}
            onChange={handleScheduleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bea45666] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bea456]"></div>
        </label>
      </div>

      {isScheduled && (
        <div className="space-y-4">
          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  handleDateTimeChange()
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bea456]"
              />
            </div>

            {/* Time Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value)
                    handleDateTimeChange()
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bea456]"
                />
              </div>
            </div>
          </div>

          {/* Optimal Times Suggestions */}
          <div>
            <button
              onClick={() => setShowTimeSlots(!showTimeSlots)}
              className="flex items-center gap-2 text-sm text-[#bea456] hover:text-[#bea456] transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Show optimal posting times</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showTimeSlots && "rotate-180")} />
            </button>

            {showTimeSlots && (
              <div className="mt-3 p-4 bg-[#bea4561a] rounded-lg">
                <p className="text-sm font-medium text-[#af9442ff] mb-3">
                  Recommended times for maximum engagement:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {optimalTimes.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        setSelectedTime(slot.time)
                        handleDateTimeChange()
                      }}
                      className={cn(
                        "px-3 py-2 text-sm rounded-lg transition-all",
                        selectedTime === slot.time
                          ? "bg-[#bea456] text-white"
                          : "bg-white text-gray-700 hover:bg-[#bea4561a]"
                      )}
                    >
                      <div className="font-medium">{slot.label}</div>
                      <div className={cn(
                        "text-xs mt-1",
                        selectedTime === slot.time ? "text-[#bea45666]" :
                          slot.engagement === 'peak' ? "text-green-600" :
                            slot.engagement === 'high' ? "text-blue-600" :
                              "text-gray-500"
                      )}>
                        {slot.engagement === 'peak' && '🔥 Peak'}
                        {slot.engagement === 'high' && '📈 High'}
                        {slot.engagement === 'medium' && '📊 Medium'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scheduled Summary */}
          {scheduledDate && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Scheduled for
                  </p>
                  <p className="text-sm text-green-700">
                    {formatScheduledDate(scheduledDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Time Zone Notice */}
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </div>
        </div>
      )}

      {!isScheduled && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">
            Post will be published immediately
          </p>
          <p className="text-xs mt-1">
            Toggle the switch above to schedule for later
          </p>
        </div>
      )}
    </div>
  )
}