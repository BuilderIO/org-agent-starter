---
name: jira
description: >
  Search, read, create, and update Jira issues, check sprint status, and see who's
  working on what. Use this skill whenever the user mentions Jira, asks about tickets,
  issues, sprints, or story points, references issue keys like PROJ-123, wants to know
  what someone is working on, asks about the current sprint, or says things like "check
  Jira", "what's the status of X", "find tickets about Y", "who's assigned to Z",
  "what's in the sprint", or "show me my open issues". Also use this skill when the user
  asks to create, file, open, or log a Jira ticket, or to move, transition, update, or
  change the status of an existing issue. Trigger phrases include "create a Jira ticket",
  "file a bug", "open an issue", "log a task in Jira", "mark PROJ-123 as done", "move
  the ticket to In Progress", "close ENG-456", or "transition the issue to Review".
---

# Jira Integration

Full access to Jira Cloud via the REST API. All scripts are in
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

Get full details of a specific issue — description, status, assignee, labels, and optionally comments. Accepts an issue key or a Jira URL (including custom domains).

```bash
# Basic issue details
node scripts/issue.mjs PROJ-123

# From a URL (atlassian.net or custom domain)
node scripts/issue.mjs https://mycompany.atlassian.net/browse/PROJ-123 --comments

# Limit comments shown
node scripts/issue.mjs PROJ-123 --comments --comments-limit 5
```

### sprint.mjs

See the current sprint — what's in it, grouped by status, with assignees. Great for standup-style overviews. Accepts `--project`, `--board-id`, or a Jira board/project URL.

```bash
# Active sprint for a project
node scripts/sprint.mjs --project PROJ

# By board ID directly
node scripts/sprint.mjs --board-id 42

# From a board URL
node scripts/sprint.mjs https://mycompany.atlassian.net/jira/software/projects/PROJ/boards/42

# See future sprints too
node scripts/sprint.mjs --project PROJ --state future
```

### create-ticket.mjs

Create a new Jira issue.

```bash
node scripts/create-ticket.mjs \
  --project PROJ \
  --type "Bug" \
  --summary "Login page crashes on Safari 17" \
  --description "Steps to reproduce: ..." \
  --priority "High" \
  --assignee "user@example.com"
```

| Flag | Required | Description |
|---|---|---|
| `--project` | **Yes** | Project key (e.g. `ENG`, `PROJ`) |
| `--summary` | **Yes** | One-line title of the ticket |
| `--type` | No | `Bug`, `Task`, `Story`, `Epic` (default: `Task`) |
| `--description` | No | Longer description (plain text) |
| `--priority` | No | `Highest`, `High`, `Medium`, `Low`, `Lowest` (default: `Medium`) |
| `--assignee` | No | Email address of the person to assign |

On success prints the new issue key and URL:
```
Created: ENG-4821
URL: https://mycompany.atlassian.net/browse/ENG-4821
```

### update-status.mjs

Transition an existing Jira issue to a new workflow status. Accepts an issue key or URL.

```bash
# Transition by status name (case-insensitive, fuzzy match)
node scripts/update-status.mjs ENG-123 "In Progress"

# From a URL
node scripts/update-status.mjs https://mycompany.atlassian.net/browse/ENG-123 "In Progress"

# List all available transitions for a ticket
node scripts/update-status.mjs ENG-123 --list
```

| Argument | Required | Description |
|---|---|---|
| Issue key | **Yes** | The ticket to update, e.g. `ENG-123` |
| Status / transition | **Yes** (unless `--list`) | Target status or transition name |
| `--list` | No | Print all valid transitions instead of applying one |

On success prints a confirmation:
```
Transitioned ENG-123: "To Do" → "In Progress"
URL: https://mycompany.atlassian.net/browse/ENG-123
```

The script fetches all available transitions, matches the user-supplied name against both the transition name and the destination status name (case-insensitive, substring match), and applies the first match found. Use `--list` when unsure of the exact name.

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

**"Create a bug ticket for the login crash":**
1. Gather: project key, summary, optional description/priority/assignee from context
2. `create-ticket.mjs --project ENG --type Bug --summary "..." --priority High`
3. Report the new issue key and URL back to the user

**"File a task for the team to review the onboarding flow":**
1. `create-ticket.mjs --project PROJ --type Task --summary "Review onboarding flow"`
2. Optionally `--assignee` if the user names someone

**"Mark ENG-456 as done":**
1. `update-status.mjs ENG-456 "Done"`
2. Report back: "ENG-456 is now Done."

**"Move the login bug to In Progress":**
1. Resolve the ticket key from context or ask (`search.mjs "summary ~ 'login bug'"`)
2. `update-status.mjs ENG-123 "In Progress"`

**"What statuses can I move PROJ-99 to?":**
1. `update-status.mjs PROJ-99 --list` — prints all available transitions
2. Show the user the list and ask which one to apply

**"Close out all the tickets in this sprint that are done":**
1. `search.mjs "sprint in openSprints() AND status = Done"` to list candidates
2. Loop: `update-status.mjs <key> "Closed"` for each

## Tips

- Jira URLs are accepted anywhere an issue key is needed — paste the browser URL directly; works for both `*.atlassian.net` and custom domains
- Board/project URLs are accepted by `sprint.mjs` to identify the board without knowing its ID
- JQL is case-insensitive for keywords (`AND`, `ORDER BY`) but field values may be case-sensitive
- Use `currentUser()` to refer to the authenticated user without knowing their email
- `sprint in openSprints()` catches all active sprints across boards
- When the user gives vague criteria, default to `ORDER BY updated DESC` so the most relevant issues appear first
- The `--fields` flag on search.mjs lets you include extra fields like `labels`, `sprint`, `comment` if needed
- Issue descriptions and comments use Atlassian Document Format (ADF) — the scripts extract plain text automatically
- Always confirm the **project key** before creating a ticket; if not specified, ask or look it up via `search.mjs`
- The `--type` value for create-ticket must match an issue type that exists in the target project
- Status names vary by project workflow — if a name doesn't match `update-status`, run `--list` to see valid transitions
- Common transition targets: `To Do`, `In Progress`, `In Review`, `Done`, `Closed`, `Blocked` — but your project may differ
- Transitions are workflow-gated: you can only move to statuses the current status allows; report valid options if blocked
