import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const serviceWorkerPath = resolve(root, "public/sw.js");

const serviceWorkerStats = await stat(serviceWorkerPath);
assert.ok(serviceWorkerStats.isFile(), "public/sw.js must be a file");

const serviceWorker = await readFile(serviceWorkerPath, "utf8");

assert.match(serviceWorker, /const\s+CACHE_NAME\s*=\s*[^;]*v\d+/, "Service Worker must use a versioned cache");
assert.match(serviceWorker, /addEventListener\(["']install["']/, "Service Worker must handle install");
assert.match(serviceWorker, /addEventListener\(["']activate["']/, "Service Worker must handle activate");
assert.match(serviceWorker, /addEventListener\(["']fetch["']/, "Service Worker must handle fetch");
assert.match(serviceWorker, /request\.mode\s*===\s*["']navigate["']/, "Navigations must have a strategy");
assert.match(serviceWorker, /startsWith\(NEXT_STATIC_PATH\)/, "Next static assets must have a strategy");
assert.match(serviceWorker, /startsWith\(["']\/api\/["']\)[\s\S]*?return;/, "API requests must be excluded");
assert.match(serviceWorker, /request\.method\s*!==\s*["']GET["'][\s\S]*?return;/, "Non-GET requests must be excluded");
assert.match(serviceWorker, /caches\.keys\(\)[\s\S]*?caches\.delete\(/, "Old caches must be cleaned up");

console.log("service-worker.spec.ts: PASS");