'use client'

import { useState } from 'react'
import logo from "@/assets/logo.png"

export function UsernameClaim() {
  const [username, setUsername] = useState('')

  return (
    <div>
      <div className="flex items-stretch justify-center gap-3 max-w-xl mx-auto">
        <div className="flex items-center gap-2 flex-1 bg-white rounded-lg px-4 h-14 shadow-sm overflow-hidden">
          <img
            src={logo.src}
            alt="elevate.social"
            className="h-8 flex-shrink-0"
          />
          <span className="font-semibold text-lg flex-shrink-0">elevate.social</span>
          <span className="text-purple-500 font-semibold text-lg flex-shrink-0">/</span>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
            className="min-w-0 flex-1 outline-none text-purple-500 text-lg placeholder-purple-300 font-medium"
          />
        </div>

        <button className="bg-purple-500 text-white px-6 h-14 rounded-lg font-semibold whitespace-nowrap text-[18px]">
          Claim your username
        </button>
      </div>
    </div>
  )
}