import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ybukbfzltjjqxxqkfrdw.supabase.co' }
    ]
  }
}

export default nextConfig
