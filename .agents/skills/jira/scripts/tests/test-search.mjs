#!/usr/bin/env node
// Tests search.mjs with a simple JQL query.
// Usage: node test-search.mjs [project-key]

import { jiraFetch } from "../client.mjs";

const project = process.argv[2];

console.log("Testing JQL search...\n");

// Test 1: Basic search (recent issues)
try {
  const jql = project
    ? `project = ${project} ORDER BY updated DESC`
    : "ORDER BY updated DESC";
  const params = new URLSearchParams({ jql, maxResults: 5, fields: "summary,status,assignee" });
  const data = await jiraFetch(`/rest/api/3/search/jql?${params}`);

  console.log(`✓ Search returned ${data.total} total issues (fetched ${data.issues?.length || 0})`);
  for (const issue of (data.issues || []).slice(0, 3)) {
    console.log(`  ${issue.key}: ${issue.fields.summary} [${issue.fields.status?.name}]`);
  }
} catch (e) {
  console.error("✗ Search failed:", e.message);
  process.exit(1);
}

// Test 2: Search with filters
try {
  const jql = "status != Done ORDER BY updated DESC";
  const params = new URLSearchParams({ jql, maxResults: 1, fields: "summary,status" });
  const data = await jiraFetch(`/rest/api/3/search/jql?${params}`);
  console.log(`\n✓ Filtered search works (${data.total} open issues found)`);
} catch (e) {
  console.error("✗ Filtered search failed:", e.message);
}

// Test 3: currentUser() function
try {
  const jql = "assignee = currentUser() ORDER BY updated DESC";
  const params = new URLSearchParams({ jql, maxResults: 1, fields: "summary" });
  const data = await jiraFetch(`/rest/api/3/search/jql?${params}`);
  console.log(`✓ currentUser() works (${data.total} issues assigned to you)`);
} catch (e) {
  console.error("✗ currentUser() query failed:", e.message);
}

console.log("\nSearch tests done.");
