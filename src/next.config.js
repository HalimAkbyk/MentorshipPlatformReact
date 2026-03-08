/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_LINKEDIN_CLIENT_ID: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '77j3ve8vc9ir2a',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    NEXT_PUBLIC_MICROSOFT_CLIENT_ID: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '',
    NEXT_PUBLIC_APPLE_CLIENT_ID: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '',
  },
  webpack: (config, { isServer }) => {
    // @netless/fastboard-react -> appliance-plugin -> markmap-view -> markmap-common
    // markmap-common is missing from the dependency tree. Stub it to avoid build failure.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'markmap-common': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
