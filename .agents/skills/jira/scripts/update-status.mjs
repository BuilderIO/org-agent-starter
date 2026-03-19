#!/usr/bin/env node
// Transitions an existing Jira issue to a new workflow status.
//
// Usage:
//   node update-status.mjs <issue-key-or-url> "<target-status-or-transition>"
//   node update-status.mjs ENG-123 "In Progress"
//   node update-status.mjs https://mycompany.atlassian.net/browse/ENG-123 "In Progress"
//   node update-status.mjs ENG-123 --list           # prints available transitions
//
// The target is matched (case-insensitive, substring) against both the transition
// name and the destination status name. First match wins.

import { jiraFetch, baseUrl, parseJiraUrl } from "./client.mjs";

// ── Argument parsing ───────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (!args.length) {
  console.error(
    "Usage: node update-status.mjs <issue-key-or-url> \"<target-status>\"\n" +
    "       node update-status.mjs <issue-key-or-url> --list"
  );
  process.exit(1);
}

// Accept Jira issue URLs — extract the issue key
const parsed = parseJiraUrl(args[0]);
if (parsed?.issueKey) args[0] = parsed.issueKey;

const issueKey = args[0];
const listMode = args.includes("--list");
const target   = !listMode ? args.slice(1).join(" ").trim() : null;

if (!issueKey) {
  console.error("Error: An issue key is required (e.g. ENG-123).");
  process.exit(1);
}

if (!listMode && !target) {
  console.error("Error: Provide a target status name, or use --list to see available transitions.");
  process.exit(1);
}

// ── Fetch available transitions ────────────────────────────────────────────
const { transitions } = await jiraFetch(`/rest/api/3/issue/${issueKey}/transitions`);

if (!transitions || transitions.length === 0) {
  console.error(`No transitions found for ${issueKey}. Check the issue key and your permissions.`);
  process.exit(1);
}

// ── --list mode: just print and exit ──────────────────────────────────────
if (listMode) {
  console.log(`Available transitions for ${issueKey}:\n`);
  for (const t of transitions) {
    console.log(`  [${t.id}] "${t.name}" → status: "${t.to?.name || "?"}"`);
  }
  process.exit(0);
}

// ── Find matching transition ───────────────────────────────────────────────
const needle = target.toLowerCase();

const match = transitions.find(
  (t) =>
    t.name.toLowerCase().includes(needle) ||
    (t.to?.name || "").toLowerCase().includes(needle)
);

if (!match) {
  console.error(
    `No transition matching "${target}" found for ${issueKey}.\n` +
    `Run with --list to see available transitions.`
  );
  process.exit(1);
}

// ── Fetch current status (for the confirmation message) ────────────────────
const issueData = await jiraFetch(`/rest/api/3/issue/${issueKey}?fields=status`);
const fromStatus = issueData.fields?.status?.name || "?";

// ── Apply the transition ───────────────────────────────────────────────────
await jiraFetch(`/rest/api/3/issue/${issueKey}/transitions`, {
  method: "POST",
  body: JSON.stringify({ transition: { id: match.id } }),
});

const toStatus = match.to?.name || match.name;
const url = `${baseUrl}/browse/${issueKey}`;

console.log(`Transitioned ${issueKey}: "${fromStatus}" → "${toStatus}"`);
console.log(`URL: ${url}`);
