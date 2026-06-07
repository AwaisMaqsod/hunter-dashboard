/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mongoose", "nodemailer"],
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, net: false, tls: false }
    return config
  },
}

module.exports = nextConfig
