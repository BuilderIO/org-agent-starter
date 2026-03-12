#!/usr/bin/env node
// Tests search-messages and search-users.
// Usage: node test-search.mjs [search-query]

import { slack } from "../client.mjs";

const query = process.argv[2] || "hello";

console.log("Testing search operations...\n");

// Test 1: Search messages
try {
  const result = await slack.search.messages({ query, count: 3, sort: "timestamp", sort_dir: "desc" });
  const matches = result.messages?.matches || [];
  console.log(`✓ Message search for "${query}" (${result.messages?.total || 0} total, showing ${matches.length})`);
  for (const m of matches.slice(0, 2)) {
    const date = new Date(parseFloat(m.ts) * 1000).toISOString().slice(0, 16);
    console.log(`  [${date}] #${m.channel?.name || "?"} | ${m.username || "?"}: ${m.text?.slice(0, 100)}`);
  }
} catch (e) {
  console.error("✗ Message search failed:", e.message);
  console.error("  (Note: search requires a user token, not a bot token)");
}

// Test 2: List users
try {
  const result = await slack.users.list({ limit: 5 });
  const users = (result.members || []).filter(u => !u.deleted && !u.is_bot);
  console.log(`\n✓ User listing works (${users.length} active users in first page)`);
  for (const u of users.slice(0, 3)) {
    console.log(`  ${u.real_name || u.name} (@${u.name})${u.profile?.email ? ` - ${u.profile.email}` : ""}`);
  }
} catch (e) {
  console.error("✗ User listing failed:", e.message);
}

console.log("\nSearch tests done.");
