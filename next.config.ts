import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  env: {
    THE_ODDS_API_KEY: process.env.THE_ODDS_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ADMIN_KEY: process.env.SUPABASE_ADMIN_KEY
  }
};

export default nextConfig;
