import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@frontend/types', '@frontend/ui'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb' // Increase limit to 5MB for image uploads
    }
  }
}

export default nextConfig
