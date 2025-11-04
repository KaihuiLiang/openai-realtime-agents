import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
