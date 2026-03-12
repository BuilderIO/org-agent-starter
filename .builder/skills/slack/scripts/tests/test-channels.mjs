#!/usr/bin/env node
// Tests list-channels, channel-info, and channel-history.
// Usage: node test-channels.mjs [channel-name]

import { slack } from "../client.mjs";

const channelName = process.argv[2];

console.log("Testing channel operations...\n");

// Test 1: List channels
let firstChannel;
try {
  const result = await slack.conversations.list({ limit: 5, exclude_archived: true });
  const channels = result.channels || [];
  console.log(`✓ Listed channels (${channels.length} returned)`);
  for (const c of channels.slice(0, 3)) {
    console.log(`  #${c.name} (${c.id}) - ${c.num_members || 0} members`);
  }
  firstChannel = channelName
    ? channels.find(c => c.name === channelName.replace(/^#/, "")) || channels[0]
    : channels[0];
} catch (e) {
  console.error("✗ List channels failed:", e.message);
  process.exit(1);
}

if (!firstChannel) {
  console.log("\nNo channels found — skipping remaining tests.");
  process.exit(0);
}

// Test 2: Channel info
try {
  const result = await slack.conversations.info({ channel: firstChannel.id });
  const c = result.channel;
  console.log(`\n✓ Channel info for #${c.name}`);
  console.log(`  Purpose: ${c.purpose?.value?.slice(0, 80) || "none"}`);
  console.log(`  Members: ${c.num_members || "?"}`);
  console.log(`  Created: ${new Date(c.created * 1000).toISOString().slice(0, 10)}`);
} catch (e) {
  console.error("✗ Channel info failed:", e.message);
}

// Test 3: Channel history
try {
  const result = await slack.conversations.history({ channel: firstChannel.id, limit: 3 });
  const messages = result.messages || [];
  console.log(`\n✓ Channel history for #${firstChannel.name} (${messages.length} messages)`);
  for (const m of messages.slice(0, 2)) {
    const date = new Date(parseFloat(m.ts) * 1000).toISOString().slice(0, 16);
    console.log(`  [${date}] ${m.user || "bot"}: ${m.text?.slice(0, 100)}`);
  }
} catch (e) {
  console.error("✗ Channel history failed:", e.message);
}

console.log("\nChannel tests done.");
