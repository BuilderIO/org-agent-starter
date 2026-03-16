#!/usr/bin/env node
// Tests issue.mjs by fetching a real issue.
// Usage: node test-issue.mjs <issue-key>
// Example: node test-issue.mjs PROJ-123

import { jiraFetch } from "../client.mjs";

const issueKey = process.argv[2];
if (!issueKey) {
  console.error("Usage: node test-issue.mjs <issue-key>");
  process.exit(1);
}

console.log(`Testing issue fetch for ${issueKey}...\n`);

// Test 1: Basic fields
try {
  const data = await jiraFetch(
    `/rest/api/3/issue/${issueKey}?fields=summary,status,assignee,priority,issuetype,labels,description,created,updated`
  );
  const f = data.fields;

  console.log("✓ Issue fetched successfully");
  console.log(`  Key:      ${data.key}`);
  console.log(`  Summary:  ${f.summary}`);
  console.log(`  Status:   ${f.status?.name}`);
  console.log(`  Assignee: ${f.assignee?.displayName || "Unassigned"}`);
  console.log(`  Type:     ${f.issuetype?.name}`);
  console.log(`  Priority: ${f.priority?.name}`);
  console.log(`  Labels:   ${f.labels?.length ? f.labels.join(", ") : "none"}`);
  console.log(`  Has desc: ${f.description ? "yes" : "no"}`);
} catch (e) {
  console.error(`✗ Failed to fetch issue: ${e.message}`);
  process.exit(1);
}

// Test 2: Comments
try {
  const data = await jiraFetch(`/rest/api/3/issue/${issueKey}/comment?maxResults=3`);
  console.log(`\n✓ Comments endpoint works (${data.total} total comments)`);
  for (const c of (data.comments || []).slice(0, 2)) {
    console.log(`  [${c.created?.slice(0, 10)}] ${c.author?.displayName}: ${c.body?.content?.[0]?.content?.[0]?.text?.slice(0, 80) || "(rich content)"}`);
  }
} catch (e) {
  console.error("✗ Comments fetch failed:", e.message);
}

console.log("\nIssue tests done.");
