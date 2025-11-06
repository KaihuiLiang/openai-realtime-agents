import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR and dev requests from the public domain(s) that reverse-proxy
  // to the local Next dev server (prevents cross-origin dev-time errors).
  // Include any domains you access the dev server through (with scheme).
  allowedDevOrigins: [
    "https://cbs-voicechatbot.duckdns.org",
    "https://cbs-voicechat.duckdns.org",
    "http://localhost:3000",
  ],
  async redirects() {
    return [
      {
        source: "/experimenter/prompts",
        destination: "/experimenter/agents",
        permanent: true,
      },
      {
        source: "/experimenter/prompts/new",
        destination: "/experimenter/agents/new",
        permanent: true,
      },
      {
        source: "/experimenter/prompts/:id/edit",
        destination: "/experimenter/agents/:id/edit",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
