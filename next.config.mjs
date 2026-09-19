import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Week 3 uses the explicit worker in public/sw.js. Keeping next-pwa's
  // generated worker disabled prevents it from overwriting that source file
  // during production builds.
  disable: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default withPWA(nextConfig);
