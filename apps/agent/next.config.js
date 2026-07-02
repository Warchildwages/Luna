/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@luna/shared', '@luna/blockchain'],
};

module.exports = nextConfig;
