#!/usr/bin/env node
// Usage: node search-users.mjs <name-or-email-pattern>
// Example: node search-users.mjs john
// Example: node search-users.mjs @engineering

import { slack } from "./client.mjs";

const query = process.argv.slice(2).join(" ").toLowerCase();
if (!query) {
  console.error("Usage: node search-users.mjs <name-or-email-pattern>");
  process.exit(1);
}

let all = [];
let cursor;
do {
  const result = await slack.users.list({ limit: 200, cursor });
  all.push(...result.members);
  cursor = result.response_metadata?.next_cursor;
} while (cursor);

const matches = all.filter(u =>
  !u.deleted && !u.is_bot &&
  (u.name?.toLowerCase().includes(query) ||
   u.real_name?.toLowerCase().includes(query) ||
   u.profile?.display_name?.toLowerCase().includes(query) ||
   u.profile?.email?.toLowerCase().includes(query))
);

console.log(`${matches.length} users matching "${query}":\n`);
for (const u of matches) {
  console.log(`${u.real_name || u.name} (@${u.name}, ${u.id})${u.profile?.email ? ` - ${u.profile.email}` : ""}${u.profile?.title ? ` | ${u.profile.title}` : ""}`);
}
