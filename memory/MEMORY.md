# Org Agent Memory

This file is auto-loaded into the system prompt. Keep it concise (≤200 lines).
For deep dives, write a topic file in `memory/` and add a one-line pointer here.

---

## Per-Project Routing Guide

Each entry maps a project to the requests that should trigger `SpawnAgent` on it.
When a request matches keywords or examples below, use that `projectId` — don't ask to confirm unless genuinely ambiguous.

---

#### `<Project Name A>` — `<projectId-A>`

**What it owns:** `<e.g. "Main marketing site and landing pages">`
**Repo:** `<org/repo-a>` | **Stack:** `<e.g. Next.js, Builder.io CMS>`
**Keywords:** `<e.g. homepage, landing page, blog, marketing>`
**Spawn for:** "Update the hero copy", "fix the pricing page CTA", "publish the Q3 campaign"
**Not for:** `<e.g. API changes, backend, mobile>`

---

#### `<Project Name B>` — `<projectId-B>`

**What it owns:** `<e.g. "Customer-facing web app / dashboard">`
**Repo:** `<org/repo-b>` | **Stack:** `<e.g. React, TypeScript>`
**Keywords:** `<e.g. dashboard, settings, web app, user portal>`
**Spawn for:** "Fix the broken chart", "add dark mode to settings", "implement the Figma onboarding flow"
**Not for:** `<e.g. CMS content, backend services, mobile>`

---

### Ambiguity Resolution

When a request could match more than one project, apply these tie-breakers in order:

1. **Channel default** — if the request came from Slack, use that channel's configured default project
2. **Repo mentioned** — if the user names a repo or file path, match it to the owning project
3. **Stack cue** — if the user mentions a framework or file type, use it to narrow down
4. **Ask once** — if still ambiguous, ask a single clarifying question ("Are you referring to the web app or the marketing site?")

---

## Team Members

> Populate from BOOTSTRAP or org/ on first run.

| Name     | Role     | Handles                 |
| -------- | -------- | ----------------------- |
| `<name>` | `<role>` | `<projects or domains>` |

---

## Branch Creation Best Practices

- **Always provide branch link** (`builder.io/app/projects/*`) immediately after SpawnBranch
- Check if ticket is already assigned/in progress before spawning
- Use `builderUserId` parameter when spawning on behalf of a user

---

## Jira Search Best Practices

- Query for Fusion tickets: `project = ENG AND created >= -24h AND Pod = Fusion ORDER BY created DESC`
- Use `created` date not `updated` for "recent" queries
- Check assignment before spawning — don't duplicate in-flight work

---

## Memory Topic File Index

| File                                         | Contents |
| -------------------------------------------- | -------- |
| _(add topic files here as they are created)_ |          |
