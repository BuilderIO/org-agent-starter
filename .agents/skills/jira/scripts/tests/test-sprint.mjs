#!/usr/bin/env node
// Tests sprint.mjs by fetching boards and active sprints.
// Usage: node test-sprint.mjs [project-key]
// Example: node test-sprint.mjs PROJ

import { jiraFetch } from "../client.mjs";

const project = process.argv[2];

console.log("Testing sprint/agile API...\n");

// Test 1: List boards
let boardId;
try {
  const boardParams = project ? `?projectKeyOrId=${project}` : "";
  const boards = await jiraFetch(`/rest/agile/1.0/board${boardParams}`);
  console.log(`✓ Found ${boards.total} boards`);
  for (const b of (boards.values || []).slice(0, 3)) {
    console.log(`  ${b.id}: ${b.name} (${b.type})`);
  }
  boardId = boards.values?.[0]?.id;
} catch (e) {
  console.error("✗ Board listing failed:", e.message);
  process.exit(1);
}

if (!boardId) {
  console.log("\nNo boards found — skipping sprint tests.");
  process.exit(0);
}

// Test 2: Active sprints
try {
  const sprints = await jiraFetch(`/rest/agile/1.0/board/${boardId}/sprint?state=active`);
  const active = sprints.values || [];
  console.log(`\n✓ Found ${active.length} active sprint(s)`);
  for (const s of active) {
    console.log(`  ${s.name} (${s.startDate?.slice(0, 10)} → ${s.endDate?.slice(0, 10)})`);

    // Test 3: Issues in sprint
    const issues = await jiraFetch(
      `/rest/agile/1.0/sprint/${s.id}/issue?fields=summary,status,assignee&maxResults=5`
    );
    console.log(`  ✓ Sprint has ${issues.total} issues (showing ${Math.min(5, issues.issues?.length || 0)})`);
    for (const i of (issues.issues || []).slice(0, 5)) {
      console.log(`    ${i.key}: ${i.fields.summary} [${i.fields.status?.name}] — ${i.fields.assignee?.displayName || "Unassigned"}`);
    }
  }
} catch (e) {
  console.error("✗ Sprint fetch failed:", e.message);
}

console.log("\nSprint tests done.");
