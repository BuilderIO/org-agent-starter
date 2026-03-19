#!/usr/bin/env node
// Usage: node issue.mjs <issue-key-or-url> [--comments] [--comments-limit N]
// Example: node issue.mjs PROJ-123
// Example: node issue.mjs https://mycompany.atlassian.net/browse/PROJ-123 --comments
// Example: node issue.mjs https://jira.company.com/browse/PROJ-123 --comments-limit 5

import { jiraFetch, parseJiraUrl, jiraUrl } from "./client.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node issue.mjs <issue-key-or-url> [--comments] [--comments-limit N]");
  process.exit(1);
}

// Accept Jira issue URLs — extract the issue key
const parsed = parseJiraUrl(args[0]);
if (parsed?.issueKey) args[0] = parsed.issueKey;

const issueKey = args[0];
let showComments = false;
let commentsLimit = 10;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--comments") showComments = true;
  else if (args[i] === "--comments-limit" && args[i + 1]) { commentsLimit = parseInt(args[i + 1]); i++; }
}

const data = await jiraFetch(
  `/rest/api/3/issue/${issueKey}?fields=summary,status,assignee,reporter,priority,issuetype,labels,description,created,updated,sprint,comment`
);

const f = data.fields;

console.log(`=== ${data.key}: ${f.summary} ===`);
console.log(`URL: ${jiraUrl(data.key)}\n`);
console.log(`Type:     ${f.issuetype?.name || "?"}`);
console.log(`Status:   ${f.status?.name || "?"}`);
console.log(`Priority: ${f.priority?.name || "?"}`);
console.log(`Assignee: ${f.assignee?.displayName || "Unassigned"} ${f.assignee?.emailAddress ? `(${f.assignee.emailAddress})` : ""}`);
console.log(`Reporter: ${f.reporter?.displayName || "?"}`);
console.log(`Labels:   ${f.labels?.length ? f.labels.join(", ") : "none"}`);
console.log(`Created:  ${f.created?.slice(0, 16).replace("T", " ") || "?"}`);
console.log(`Updated:  ${f.updated?.slice(0, 16).replace("T", " ") || "?"}`);

if (f.sprint) {
  console.log(`Sprint:   ${f.sprint.name} (${f.sprint.state})`);
}

// Description (ADF -> plain text extraction)
if (f.description?.content) {
  console.log(`\n--- Description ---`);
  printAdf(f.description);
}

// Comments
if (showComments) {
  const comments = f.comment?.comments || [];
  const recent = comments.slice(-commentsLimit);
  console.log(`\n--- Comments (${recent.length} of ${comments.length}) ---`);
  for (const c of recent) {
    const date = c.created?.slice(0, 16).replace("T", " ") || "?";
    const author = c.author?.displayName || "?";
    console.log(`\n[${date}] ${author}:`);
    if (c.body?.content) printAdf(c.body);
    else console.log("  (no text)");
  }
}

// Simple ADF to plain text
function printAdf(doc) {
  for (const node of doc.content || []) {
    if (node.type === "paragraph" || node.type === "heading") {
      const text = extractText(node);
      if (text) console.log(`  ${text}`);
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      for (const item of node.content || []) {
        const text = extractText(item);
        if (text) console.log(`  - ${text}`);
      }
    } else if (node.type === "codeBlock") {
      const text = extractText(node);
      if (text) console.log(`  \`\`\`\n  ${text}\n  \`\`\``);
    } else {
      const text = extractText(node);
      if (text) console.log(`  ${text}`);
    }
  }
}

function extractText(node) {
  if (node.type === "text") return node.text || "";
  if (node.type === "mention") return `@${node.attrs?.text || "user"}`;
  if (node.type === "hardBreak") return "\n";
  if (node.type === "inlineCard" || node.type === "blockCard") return node.attrs?.url || "";
  return (node.content || []).map(extractText).join("");
}
