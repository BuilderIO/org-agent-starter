#!/usr/bin/env node
// Tests that client.mjs authenticates and can reach the Slack workspace.
// Usage: node test-client.mjs

import { slack } from "../client.mjs";

console.log("Testing Slack connection...\n");

try {
  const result = await slack.auth.test();
  console.log("✓ Authentication successful");
  console.log(`  Team: ${result.team} (${result.team_id})`);
  console.log(`  Bot: ${result.user} (${result.user_id})`);
  console.log(`  URL: ${result.url}`);
} catch (e) {
  console.error("✗ Authentication failed — check SLACK_BOT_TOKEN or SLACK_TOKEN");
  console.error(`  ${e.message}`);
  process.exit(1);
}
