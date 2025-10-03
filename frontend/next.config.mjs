/** @type {import('next').NextConfig} */
// Compute basePath/assetPrefix from environment variables for GitHub Pages
const rawBasePath = (process.env.BASE_PATH || "").trim();
const computedBasePath = rawBasePath === "" ? undefined : rawBasePath;
const rawAssetPrefix = (process.env.ASSET_PREFIX || rawBasePath || "").trim();
const computedAssetPrefix = rawAssetPrefix === "" ? undefined : rawAssetPrefix;

const nextConfig = {
  reactStrictMode: true,
  experimental: { turbo: { rules: {} } },
  // Static export for GitHub Pages
  output: "export",
  images: { unoptimized: true },
  // Only set when non-empty to avoid Next.js warnings
  basePath: computedBasePath,
  assetPrefix: computedAssetPrefix,
};

export default nextConfig;


