#!/usr/bin/env node
// Tests that client.mjs authenticates and can reach the Jira instance.
// Usage: node test-client.mjs

import { jiraFetch } from "../client.mjs";

console.log("Testing Jira connection...\n");

try {
  const me = await jiraFetch("/rest/api/3/myself");
  console.log("✓ Authentication successful");
  console.log(`  Logged in as: ${me.displayName} (${me.emailAddress})`);
  console.log(`  Account ID: ${me.accountId}`);
} catch (e) {
  console.error("✗ Authentication failed — check JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN");
  process.exit(1);
}
