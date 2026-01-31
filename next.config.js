/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  // Webpack configuration for React-PDF
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure React-PDF works correctly on the server
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
