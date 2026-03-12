#!/usr/bin/env node
// Usage: node list-channels.mjs [--filter pattern] [--limit N]
// Example: node list-channels.mjs --filter eng

import { slack } from "./client.mjs";

const args = process.argv.slice(2);
let filter = "", limit = 100;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--filter" && args[i + 1]) { filter = args[i + 1].toLowerCase(); i++; }
  else if (args[i] === "--limit" && args[i + 1]) { limit = parseInt(args[i + 1]); i++; }
}

let all = [];
let cursor;
do {
  const result = await slack.conversations.list({ limit: 200, exclude_archived: true, cursor });
  all.push(...result.channels);
  cursor = result.response_metadata?.next_cursor;
} while (cursor && all.length < 1000);

if (filter) all = all.filter(c => c.name.toLowerCase().includes(filter));
all = all.slice(0, limit);

console.log(`${all.length} channels${filter ? ` matching "${filter}"` : ""}:\n`);
for (const c of all) {
  const members = c.num_members || 0;
  console.log(`#${c.name} (${c.id}) - ${members} members${c.topic?.value ? ` | ${c.topic.value.slice(0, 80)}` : ""}`);
}
