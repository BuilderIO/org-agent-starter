#!/usr/bin/env node
// Usage: node sprint.mjs [--project KEY] [--board-id ID] [--state active|future|closed]
//        node sprint.mjs <jira-board-or-project-url>
// Example: node sprint.mjs --project PROJ
// Example: node sprint.mjs --board-id 42
// Example: node sprint.mjs https://mycompany.atlassian.net/jira/software/projects/PROJ/boards/42

import { jiraFetch, parseJiraUrl, jiraUrl } from "./client.mjs";

const args = process.argv.slice(2);

let project = "";
let boardId = "";
let state = "active";

// Accept a Jira board/project URL as the first positional argument
if (args[0] && !args[0].startsWith("--")) {
  const parsed = parseJiraUrl(args[0]);
  if (parsed) {
    if (parsed.boardId) boardId = parsed.boardId;
    if (parsed.projectKey) project = parsed.projectKey;
    args.shift();
  }
}

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--project" && args[i + 1]) { project = args[i + 1]; i++; }
  else if (args[i] === "--board-id" && args[i + 1]) { boardId = args[i + 1]; i++; }
  else if (args[i] === "--state" && args[i + 1]) { state = args[i + 1]; i++; }
}

// Step 1: Find board
if (!boardId) {
  const boardParams = project ? `?projectKeyOrId=${project}` : "";
  const boards = await jiraFetch(`/rest/agile/1.0/board${boardParams}`);
  if (!boards.values?.length) {
    console.error(project ? `No boards found for project "${project}"` : "No boards found");
    process.exit(1);
  }
  boardId = boards.values[0].id;
  console.log(`Using board: ${boards.values[0].name} (id: ${boardId})\n`);
}

// Step 2: Get sprints
const sprintData = await jiraFetch(`/rest/agile/1.0/board/${boardId}/sprint?state=${state}`);
const sprints = sprintData.values || [];

if (!sprints.length) {
  console.log(`No ${state} sprints found.`);
  process.exit(0);
}

for (const sprint of sprints) {
  console.log(`=== ${sprint.name} ===`);
  console.log(`State: ${sprint.state} | Start: ${sprint.startDate?.slice(0, 10) || "?"} | End: ${sprint.endDate?.slice(0, 10) || "?"}`);
  if (sprint.goal) console.log(`Goal: ${sprint.goal}`);

  // Step 3: Get issues in sprint
  const issueData = await jiraFetch(
    `/rest/agile/1.0/sprint/${sprint.id}/issue?fields=summary,status,assignee,priority,issuetype&maxResults=100`
  );
  const issues = issueData.issues || [];

  if (!issues.length) {
    console.log("  No issues in this sprint.\n");
    continue;
  }

  // Group by status
  const byStatus = {};
  for (const issue of issues) {
    const status = issue.fields.status?.name || "Unknown";
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(issue);
  }

  for (const [status, statusIssues] of Object.entries(byStatus)) {
    console.log(`\n  [${status}] (${statusIssues.length})`);
    for (const issue of statusIssues) {
      const f = issue.fields;
      const assignee = f.assignee?.displayName || "Unassigned";
      console.log(`    ${issue.key} ${f.summary} — ${assignee} (${jiraUrl(issue.key)})`);
    }
  }
  console.log();
}
