#!/usr/bin/env node
// Runs all Jira tests in sequence.
// Usage: node run-all.mjs [project-key] [issue-key]
// Example: node run-all.mjs PROJ PROJ-123

import { execFileSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const project = process.argv[2];
const issueKey = process.argv[3];

const tests = [
  { name: "client", script: "test-client.mjs", args: [] },
  { name: "search", script: "test-search.mjs", args: project ? [project] : [] },
  { name: "issue", script: "test-issue.mjs", args: issueKey ? [issueKey] : [], skip: !issueKey },
  { name: "sprint", script: "test-sprint.mjs", args: project ? [project] : [] },
];

let passed = 0;
let failed = 0;
let skipped = 0;

for (const t of tests) {
  if (t.skip) {
    console.log(`\n⊘ Skipping ${t.name} (no issue key provided)\n`);
    skipped++;
    continue;
  }

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
console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
console.log("=".repeat(50));
process.exit(failed > 0 ? 1 : 0);
