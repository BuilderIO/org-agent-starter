#!/usr/bin/env node
// Creates a new Jira issue via the REST API.
//
// Usage:
//   node create-ticket.mjs --project PROJ --summary "Title here"
//   node create-ticket.mjs --project ENG --type Bug --summary "Login crash" --description "Steps..." --priority High --assignee user@example.com
//
// Required flags: --project, --summary
// Optional flags: --type (default: Task), --description, --priority (default: Medium), --assignee

import { jiraFetch, baseUrl } from "./client.mjs";

// ── Argument parsing ────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function getFlag(name) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

const project     = getFlag("--project");
const summary     = getFlag("--summary");
const issueType   = getFlag("--type")        || "Task";
const description = getFlag("--description") || null;
const priority    = getFlag("--priority")    || "Medium";
const assigneeEmail = getFlag("--assignee")  || null;

if (!project || !summary) {
  console.error(
    "Usage: node create-ticket.mjs --project <KEY> --summary \"<title>\" \\\n" +
    "         [--type Bug|Task|Story|Epic] [--description \"...\"] \\\n" +
    "         [--priority Highest|High|Medium|Low|Lowest] [--assignee user@example.com]"
  );
  process.exit(1);
}

// ── Optional: resolve assignee account ID from email ───────────────────────
async function resolveAccountId(email) {
  try {
    const params = new URLSearchParams({ query: email, maxResults: 1 });
    const data = await jiraFetch(`/rest/api/3/user/search?${params}`);
    if (Array.isArray(data) && data.length > 0) return data[0].accountId;
  } catch {
    // If lookup fails, skip assignee rather than crashing
  }
  return null;
}

// ── Build ADF document for description ────────────────────────────────────
function makeAdf(text) {
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

// ── Create the issue ───────────────────────────────────────────────────────
const fields = {
  project:   { key: project.toUpperCase() },
  summary,
  issuetype: { name: issueType },
  priority:  { name: priority },
};

if (description) {
  fields.description = makeAdf(description);
}

if (assigneeEmail) {
  const accountId = await resolveAccountId(assigneeEmail);
  if (accountId) {
    fields.assignee = { accountId };
  } else {
    console.warn(`Warning: Could not find Jira user for email "${assigneeEmail}". Ticket will be unassigned.`);
  }
}

const result = await jiraFetch("/rest/api/3/issue", {
  method: "POST",
  body: JSON.stringify({ fields }),
});

const key = result.key;
const url = `${baseUrl}/browse/${key}`;

console.log(`Created: ${key}`);
console.log(`URL:     ${url}`);
