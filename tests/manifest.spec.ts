import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

async function readPngSize(path: string) {
  const image = await readFile(path);

  assert.ok(image.subarray(0, 8).equals(PNG_SIGNATURE), `${path} must be a PNG file`);
  assert.equal(image.toString("ascii", 12, 16), "IHDR", `${path} must include a PNG IHDR chunk`);

  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
  };
}

async function runTests() {
  const root = process.cwd();
  const manifestPath = resolve(root, "public/manifest.webmanifest");
  const manifestContent = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestContent);

  assert.equal(typeof manifest.name, "string", "Manifest must have a name");
  assert.ok(manifest.name.trim(), "Manifest name must not be empty");
  assert.equal(manifest.start_url, "/", "Manifest start_url must point to the app root");
  assert.equal(manifest.display, "standalone", "Manifest display must be standalone");
  assert.equal(typeof manifest.theme_color, "string", "Manifest must declare a theme color");
  assert.equal(typeof manifest.background_color, "string", "Manifest must declare a background color");

  const expectedIcons = [
    { src: "/icons/icon-192x192.png", size: 192 },
    { src: "/icons/icon-512x512.png", size: 512 },
  ];
  assert.deepEqual(
    manifest.icons.map(({ src, sizes, type }: { src: string; sizes: string; type: string }) => ({ src, sizes, type })),
    expectedIcons.map(({ src, size }) => ({ src, sizes: `${size}x${size}`, type: "image/png" })),
    "Manifest must declare the two required PNG icons",
  );

  for (const { src, size } of expectedIcons) {
    const iconPath = resolve(root, "public", src.slice(1));
    const iconStats = await stat(iconPath);
    assert.ok(iconStats.isFile(), `${src} must be a file`);
    const dimensions = await readPngSize(iconPath);
    assert.deepEqual(dimensions, { width: size, height: size }, `${src} dimensions must match its manifest size`);
  }

  const nextConfigPath = resolve(root, "next.config.mjs");
  const nextConfigContent = await readFile(nextConfigPath, "utf8");

  assert.match(nextConfigContent, /@ducanh2912\/next-pwa/, "Next config must use next-pwa");
  assert.match(nextConfigContent, /dest:\s*['"]public['"]/, "PWA destination must be the public folder");

  console.log("manifest.spec.ts: PASS");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
