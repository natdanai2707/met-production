/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // เวลาที่ build/deploy (Vercel stamp ให้ตอน build) ใช้แสดง "อัพเดตล่าสุด"
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ybukbfzltjjqxxqkfrdw.supabase.co' },
    ],
  },
}

export default nextConfig
