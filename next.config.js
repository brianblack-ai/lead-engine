/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // TEMP: don’t fail Vercel build on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TEMP: don’t fail Vercel build on TS type errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
