import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "rbgclmxhpwbaqazrkkwm.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/avatars/**",
      },
    ],
  },
  serverExternalPackages: ['puppeteer-extra', 'puppeteer-extra-plugin-stealth'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'puppeteer-extra': 'commonjs puppeteer-extra',
        'puppeteer-extra-plugin-stealth': 'commonjs puppeteer-extra-plugin-stealth',
      });
    }
    return config;
  },
};

export default nextConfig;
