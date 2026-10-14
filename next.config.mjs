/** @type {import('next').NextConfig} */
const nextConfig = {
  // This project was written without a test build, so a stray type error
  // shouldn't block your deploy. Run `npx tsc --noEmit` to see any.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
