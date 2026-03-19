#!/usr/bin/env node
// Usage: node channel-history.mjs <channel-name-or-id-or-url> [--limit N] [--oldest YYYY-MM-DD] [--latest YYYY-MM-DD]
// Example: node channel-history.mjs general --limit 10
// Example: node channel-history.mjs C01234ABCDE --oldest 2025-01-01 --limit 50
// Example: node channel-history.mjs https://myworkspace.slack.com/archives/C01234ABCDE

import { slack, parseSlackUrl, slackUrl } from "./client.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node channel-history.mjs <channel-name-or-id-or-url> [--limit N] [--oldest YYYY-MM-DD] [--latest YYYY-MM-DD]");
  process.exit(1);
}

let channelInput = args[0];

// Accept Slack URLs — extract the channel ID
const parsed = parseSlackUrl(channelInput);
if (parsed?.channelId) channelInput = parsed.channelId;
let limit = 20;
let oldest, latest;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--limit" && args[i + 1]) { limit = parseInt(args[i + 1]); i++; }
  else if (args[i] === "--oldest" && args[i + 1]) { oldest = (new Date(args[i + 1]).getTime() / 1000).toString(); i++; }
  else if (args[i] === "--latest" && args[i + 1]) { latest = (new Date(args[i + 1]).getTime() / 1000).toString(); i++; }
}

// Resolve channel name to ID if needed
let channelId = channelInput;
if (!channelInput.match(/^[A-Z0-9]+$/i) || channelInput.length < 9) {
  const name = channelInput.replace(/^#/, "");
  let cursor;
  let found = false;
  do {
    const list = await slack.conversations.list({ limit: 200, exclude_archived: true, cursor });
    const ch = list.channels.find(c => c.name === name);
    if (ch) { channelId = ch.id; found = true; break; }
    cursor = list.response_metadata?.next_cursor;
  } while (cursor);
  if (!found) { console.error(`Channel "${channelInput}" not found`); process.exit(1); }
}

const opts = { channel: channelId, limit };
if (oldest) opts.oldest = oldest;
if (latest) opts.latest = latest;

const result = await slack.conversations.history(opts);
const messages = result.messages || [];

const channelLink = await slackUrl(channelId);
console.log(`${messages.length} messages from channel ${channelInput} (${channelLink}):\n`);

for (const m of messages.reverse()) {
  const date = new Date(parseFloat(m.ts) * 1000).toISOString().slice(0, 16);
  console.log(`[${date}] ${m.user || "bot"}: ${m.text?.slice(0, 500)}`);
  if (m.reply_count) {
    const threadLink = await slackUrl(channelId, m.ts);
    console.log(`  (${m.reply_count} replies — ${threadLink})`);
  }
}
