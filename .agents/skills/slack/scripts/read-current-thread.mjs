#!/usr/bin/env node
// Usage: node read-current-thread.mjs <channel-id> <thread-ts> [--limit N]
//        node read-current-thread.mjs <slack-thread-url> [--limit N]
// Reads the full thread context for a given Slack thread.
// Designed for the agent to call when it needs deeper context from its origin thread.
//
// The channel-id and thread-ts can be extracted from the channelId format:
//   slack/thread/{teamId}/{channelId}/{threadTs}
//   slack/dm/{teamId}/{userId}
//
// Example: node read-current-thread.mjs C07ABC123 1234567890.123456
// Example: node read-current-thread.mjs https://myworkspace.slack.com/archives/C07ABC123/p1234567890123456

import { slack, parseSlackUrl, slackUrl } from "./client.mjs";

const args = process.argv.slice(2);
let limit = 50;

// Parse --limit flag
const limitIdx = args.indexOf("--limit");
if (limitIdx !== -1) {
  limit = parseInt(args[limitIdx + 1], 10) || 50;
  args.splice(limitIdx, 2);
}

// Accept a single Slack thread URL as the only argument
const parsed = parseSlackUrl(args[0]);
if (parsed?.channelId && parsed?.threadTs) {
  args[0] = parsed.channelId;
  args[1] = parsed.threadTs;
} else if (parsed?.channelId) {
  args[0] = parsed.channelId;
}

if (args.length < 2) {
  console.error(
    "Usage: node read-current-thread.mjs <channel-id> <thread-ts> [--limit N]",
  );
  console.error("       node read-current-thread.mjs <slack-thread-url> [--limit N]");
  console.error("");
  console.error("Extract channel-id and thread-ts from your channelId:");
  console.error("  slack/thread/{teamId}/{channelId}/{threadTs}");
  process.exit(1);
}

const channelId = args[0];
const threadTs = args[1];

const result = await slack.conversations.replies({
  channel: channelId,
  ts: threadTs,
  limit,
});
const messages = result.messages || [];

if (messages.length === 0) {
  console.log("No messages found in this thread.");
  process.exit(0);
}

const threadLink = await slackUrl(channelId, threadTs);
console.log(`${messages.length} messages in thread (${threadLink}):\n`);

for (const m of messages) {
  const date = new Date(parseFloat(m.ts) * 1000).toISOString().slice(0, 16);
  const user = m.user || (m.bot_id ? `bot:${m.bot_id}` : "unknown");
  const text = m.text || "";
  console.log(`[${date}] ${user}: ${text}`);
  if (m.files?.length) {
    console.log(`  (${m.files.length} file(s) attached)`);
  }
  console.log();
}
