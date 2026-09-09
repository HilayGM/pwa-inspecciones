import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function runTests() {
  const root = process.cwd();
  
  // Check manifest.webmanifest
  const manifestPath = resolve(root, "public/manifest.webmanifest");
  const manifestContent = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestContent);
  
  assert.ok(manifest.name, "Manifest should have a name");
  assert.equal(manifest.display, "standalone", "Display should be standalone");
  assert.ok(manifest.icons && manifest.icons.length > 0, "Manifest should have at least one icon");
  
  // Check next.config.mjs
  const nextConfigPath = resolve(root, "next.config.mjs");
  const nextConfigContent = await readFile(nextConfigPath, "utf8");
  
  assert.match(nextConfigContent, /@ducanh2912\/next-pwa/, "Should use next-pwa package");
  assert.match(nextConfigContent, /dest:\s*['"]public['"]/, "PWA destination should be public folder");
  
  console.log("manifest.spec.ts: PASS");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
