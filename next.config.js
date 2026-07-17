/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
};
module.exports = nextConfig;
import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
