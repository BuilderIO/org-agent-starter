#!/usr/bin/env node
// Usage: node search.mjs <jql-query> [--limit N] [--fields field1,field2]
// Example: node search.mjs "project = PROJ AND status = 'In Progress'"
// Example: node search.mjs "assignee = currentUser() AND sprint in openSprints()" --limit 50
// Example: node search.mjs "labels = backend AND priority = High" --fields summary,status,assignee,priority

import { jiraFetch, jiraUrl } from "./client.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node search.mjs <jql-query> [--limit N] [--fields field1,field2]");
  process.exit(1);
}

let jql = "";
let maxResults = 30;
let fields = "summary,status,assignee,priority,issuetype,updated";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--limit" && args[i + 1]) { maxResults = parseInt(args[i + 1]); i++; }
  else if (args[i] === "--fields" && args[i + 1]) { fields = args[i + 1]; i++; }
  else { jql += (jql ? " " : "") + args[i]; }
}

const params = new URLSearchParams({ jql, maxResults, fields });
const data = await jiraFetch(`/rest/api/3/search/jql?${params}`);
const issues = data.issues || [];

console.log(`Found ${data.total || 0} issues (showing ${issues.length}):\n`);

for (const issue of issues) {
  const f = issue.fields;
  const status = f.status?.name || "?";
  const assignee = f.assignee?.displayName || "Unassigned";
  const priority = f.priority?.name || "?";
  const type = f.issuetype?.name || "?";
  const updated = f.updated ? f.updated.slice(0, 16).replace("T", " ") : "?";

  console.log(`${issue.key} [${type}] ${f.summary}`);
  console.log(`  Status: ${status} | Assignee: ${assignee} | Priority: ${priority} | Updated: ${updated}`);
  console.log(`  URL: ${jiraUrl(issue.key)}`);
  console.log();
}
