---
name: jira
description: >
  Search and read Jira issues, check sprint status, and see who's working on what.
  Use this skill whenever the user mentions Jira, asks about tickets, issues, sprints,
  or story points, references issue keys like PROJ-123, wants to know what someone is
  working on, asks about the current sprint, or says things like "check Jira",
  "what's the status of X", "find tickets about Y", "who's assigned to Z",
  "what's in the sprint", or "show me my open issues". Even if the user doesn't say
  "Jira" explicitly but mentions a ticket key or sprint, use this skill.
---

# Jira Integration

Read-only access to Jira Cloud via the REST API. All scripts are in
`scripts/` relative to this skill and use Node's built-in `fetch` (no extra dependencies).

## Setup

Three environment variables must be set:

- `JIRA_DOMAIN` — your Atlassian subdomain (e.g. `mycompany` for mycompany.atlassian.net)
- `JIRA_EMAIL` — your Atlassian account email
- `JIRA_API_TOKEN` — API token from https://id.atlassian.com/manage/api-tokens

No npm dependencies needed — the scripts use Node's native `fetch` and `Buffer`.

## Available Scripts

All scripts are `.mjs` files. Run them with `node <skill-path>/scripts/<script>.mjs`.

### search.mjs

Search issues using JQL (Jira Query Language). This is the most powerful script — nearly any question about tickets can be answered with the right JQL query.

```bash
# Issues assigned to current user in the active sprint
node scripts/search.mjs "assignee = currentUser() AND sprint in openSprints()"

# High priority bugs in a project
node scripts/search.mjs "project = PROJ AND issuetype = Bug AND priority = High"

# Recently updated issues
node scripts/search.mjs "project = PROJ AND updated >= -7d" --limit 50

# Text search in summary/description
node scripts/search.mjs "summary ~ 'login bug' OR description ~ 'login'"

# Unassigned issues
node scripts/search.mjs "project = PROJ AND assignee is EMPTY AND status != Done"

# Custom fields
node scripts/search.mjs "project = PROJ AND labels in (backend, urgent)" --fields summary,status,assignee,labels
```

**JQL quick reference** — these are the most commonly useful filters:

| Filter | Example |
|---|---|
| Project | `project = PROJ` |
| Status | `status = "In Progress"` or `status in ("To Do", "In Progress")` |
| Assignee | `assignee = "user@email.com"` or `assignee = currentUser()` |
| Sprint | `sprint in openSprints()` or `sprint = "Sprint 5"` |
| Priority | `priority = High` or `priority in (High, Highest)` |
| Type | `issuetype = Bug` |
| Labels | `labels = backend` |
| Date | `created >= -7d`, `updated >= "2025-01-01"` |
| Text | `summary ~ "search term"`, `description ~ "keyword"` |
| Unassigned | `assignee is EMPTY` |
| Order | append `ORDER BY priority DESC, updated DESC` |

Combine filters with `AND` / `OR`. Use parentheses for grouping.

### issue.mjs

Get full details of a specific issue — description, status, assignee, labels, and optionally comments.

```bash
# Basic issue details
node scripts/issue.mjs PROJ-123

# Include recent comments
node scripts/issue.mjs PROJ-123 --comments

# Limit comments shown
node scripts/issue.mjs PROJ-123 --comments --comments-limit 5
```

### sprint.mjs

See the current sprint — what's in it, grouped by status, with assignees. Great for standup-style overviews.

```bash
# Active sprint for a project
node scripts/sprint.mjs --project PROJ

# By board ID directly
node scripts/sprint.mjs --board-id 42

# See future sprints too
node scripts/sprint.mjs --project PROJ --state future
```

## Workflow Patterns

**"What's the status of ticket X?"** or user mentions an issue key:
1. `issue.mjs PROJ-123` to get the details
2. Add `--comments` if they want to see discussion

**"What's in the current sprint?"** or **"sprint status"**:
1. `sprint.mjs --project PROJ` — shows all issues grouped by status with assignees

**"What is person X working on?"**:
1. `search.mjs "assignee = 'user@email.com' AND status != Done ORDER BY updated DESC"` --limit 10

**"Find tickets about Y"** or **"search for Z"**:
1. `search.mjs "project = PROJ AND summary ~ 'Y' ORDER BY updated DESC"`
2. If the user wants more detail on a result, follow up with `issue.mjs`

**"Show me open bugs"** or any filtered search:
1. Build a JQL query combining the relevant filters from the table above
2. `search.mjs "<jql>" --limit 20`

## Tips

- JQL is case-insensitive for keywords (`AND`, `ORDER BY`) but field values may be case-sensitive
- Use `currentUser()` to refer to the authenticated user without knowing their email
- `sprint in openSprints()` catches all active sprints across boards
- When the user gives vague criteria, default to `ORDER BY updated DESC` so the most relevant issues appear first
- The `--fields` flag on search.mjs lets you include extra fields like `labels`, `sprint`, `comment` if needed
- Issue descriptions and comments use Atlassian Document Format (ADF) — the scripts extract plain text automatically
