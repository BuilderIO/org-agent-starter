#!/usr/bin/env node
// Usage: node channel-info.mjs <channel-name-or-id-or-url>
// Example: node channel-info.mjs general
// Example: node channel-info.mjs https://myworkspace.slack.com/archives/C01234ABCDE

import { slack, parseSlackUrl, slackUrl } from "./client.mjs";

let channelInput = process.argv[2];
if (!channelInput) {
  console.error("Usage: node channel-info.mjs <channel-name-or-id-or-url>");
  process.exit(1);
}

// Accept Slack URLs — extract the channel ID
const parsed = parseSlackUrl(channelInput);
if (parsed?.channelId) channelInput = parsed.channelId;

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

const result = await slack.conversations.info({ channel: channelId });
const c = result.channel;

console.log(`#${c.name} (${c.id})`);
console.log(`URL:      ${await slackUrl(c.id)}`);
console.log(`Purpose: ${c.purpose?.value || "none"}`);
console.log(`Topic: ${c.topic?.value || "none"}`);
console.log(`Members: ${c.num_members || "?"}`);
console.log(`Created: ${new Date(c.created * 1000).toISOString().slice(0, 10)}`);
console.log(`Archived: ${c.is_archived}`);
