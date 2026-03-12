#!/usr/bin/env node
// Runs all Slack tests in sequence.
// Usage: node run-all.mjs [channel-name] [search-query]
// Example: node run-all.mjs general "deploy issue"

import { execFileSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const channel = process.argv[2];
const searchQuery = process.argv[3];

const tests = [
  { name: "client", script: "test-client.mjs", args: [] },
  { name: "channels", script: "test-channels.mjs", args: channel ? [channel] : [] },
  { name: "search", script: "test-search.mjs", args: searchQuery ? [searchQuery] : [] },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Running: ${t.name}`);
  console.log("=".repeat(50));

  try {
    execFileSync("node", [join(dir, t.script), ...t.args], { stdio: "inherit" });
    passed++;
  } catch {
    failed++;
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=".repeat(50));
process.exit(failed > 0 ? 1 : 0);
