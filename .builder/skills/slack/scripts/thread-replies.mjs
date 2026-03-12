#!/usr/bin/env node
// Usage: node thread-replies.mjs <channel-name-or-id> <thread-ts>
// Example: node thread-replies.mjs general 1234567890.123456

import { slack } from "./client.mjs";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node thread-replies.mjs <channel-name-or-id> <thread-ts>");
  process.exit(1);
}

let channelInput = args[0];
const threadTs = args[1];

// Resolve channel name to ID
let channelId = channelInput;
if (!channelInput.match(/^[A-Z0-9]+$/i) || channelInput.length < 9) {
  const name = channelInput.replace(/^#/, "");
  let cursor;
  do {
    const list = await slack.conversations.list({ limit: 200, exclude_archived: true, cursor });
    const ch = list.channels.find(c => c.name === name);
    if (ch) { channelId = ch.id; break; }
    cursor = list.response_metadata?.next_cursor;
  } while (cursor);
}

const result = await slack.conversations.replies({ channel: channelId, ts: threadTs, limit: 100 });
const messages = result.messages || [];

console.log(`${messages.length} messages in thread:\n`);

for (const m of messages) {
  const date = new Date(parseFloat(m.ts) * 1000).toISOString().slice(0, 16);
  console.log(`[${date}] ${m.user || "bot"}: ${m.text?.slice(0, 500)}`);
}
