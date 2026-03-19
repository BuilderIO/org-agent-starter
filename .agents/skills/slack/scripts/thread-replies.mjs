#!/usr/bin/env node
// Usage: node thread-replies.mjs <channel-name-or-id> <thread-ts>
//        node thread-replies.mjs <slack-thread-url>
// Example: node thread-replies.mjs general 1234567890.123456
// Example: node thread-replies.mjs https://myworkspace.slack.com/archives/C01234ABCDE/p1234567890123456

import { slack, parseSlackUrl, slackUrl } from "./client.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node thread-replies.mjs <channel-name-or-id> <thread-ts>");
  console.error("       node thread-replies.mjs <slack-thread-url>");
  process.exit(1);
}

let channelInput = args[0];
let threadTs = args[1];

// Accept a single Slack thread URL — extracts both channel and ts
const parsed = parseSlackUrl(channelInput);
if (parsed?.channelId) {
  channelInput = parsed.channelId;
  if (parsed.threadTs) threadTs = parsed.threadTs;
}

if (!threadTs) {
  console.error("Error: thread timestamp is required (or pass a full thread URL)");
  process.exit(1);
}

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

const threadLink = await slackUrl(channelId, threadTs);
console.log(`${messages.length} messages in thread (${threadLink}):\n`);

for (const m of messages) {
  const date = new Date(parseFloat(m.ts) * 1000).toISOString().slice(0, 16);
  console.log(`[${date}] ${m.user || "bot"}: ${m.text?.slice(0, 500)}`);
}
