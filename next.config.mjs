/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/', destination: '/landing.html' },
      { source: '/demo', destination: '/demo/index.html' },
    ];
  },
  async headers() {
    return [{
      source: '/app/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'same-origin' },
        { key: 'Cache-Control', value: 'no-store' },
      ],
    }];
  },
};
export default nextConfig;
