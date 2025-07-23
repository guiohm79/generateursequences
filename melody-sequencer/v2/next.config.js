/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporaire pour les tests
  },
  typescript: {
    ignoreBuildErrors: false, // Garder la vérification TypeScript
  },
};

module.exports = nextConfig;