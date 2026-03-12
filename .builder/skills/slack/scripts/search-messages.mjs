#!/usr/bin/env node
// Usage: node search-messages.mjs <query> [--count N] [--sort timestamp|score]
// Example: node search-messages.mjs "deploy issue" --count 5
// Example: node search-messages.mjs "in:#general bug report"

import { slack } from "./client.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node search-messages.mjs <query> [--count N] [--sort timestamp|score]");
  process.exit(1);
}

let query = "";
let count = 20;
let sort = "timestamp";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--count" && args[i + 1]) { count = parseInt(args[i + 1]); i++; }
  else if (args[i] === "--sort" && args[i + 1]) { sort = args[i + 1]; i++; }
  else { query += (query ? " " : "") + args[i]; }
}

const result = await slack.search.messages({ query, count, sort, sort_dir: "desc" });
const matches = result.messages?.matches || [];

console.log(`Found ${result.messages?.total || 0} results (showing ${matches.length}):\n`);

for (const m of matches) {
  const date = new Date(parseFloat(m.ts) * 1000).toISOString().slice(0, 16);
  console.log(`[${date}] #${m.channel?.name || "?"} | ${m.username || m.user || "unknown"}:`);
  console.log(`  ${m.text?.slice(0, 300)}`);
  console.log(`  permalink: ${m.permalink || "n/a"}`);
  console.log();
}
