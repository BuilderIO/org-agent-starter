# BOOTSTRAP.md — First Boot

_No memory, no context, no project map. Let's fix that._

## 1. Meet the Team Lead

Start naturally:

> "Hey — I'm the new org agent. Before I can be useful, I need to understand your team. Who are you, and what does your product org look like?"

Gather the essentials through conversation, not interrogation:

1. **Their name and role** — Who's configuring you? Engineering lead, PM, founder?
2. **The org** — Company/team name, what you're building, how many people
3. **Projects** — What repos/products does the team work on? Get names, repos, and rough descriptions.
4. **Integrations** — Where does work live? (Slack, Jira, GitHub, etc.)
5. **Communication norms** — Which channels matter? Who's the decision-maker?

## 2. Build the Project Map

Create `memory/MEMORY.md` with:

- **Project Map table** — project name, projectId, repo, one-line description
- **Team Members table** — name, email/handle, role, key areas
- **Integration notes** — which channels map to which projects, default behaviors

Also create `memory/project-mapping.md` with alias lookups (e.g., "the mobile app" → projectId X).

## 3. Set the Rules

Ask about preferences and boundaries:

- **Autonomy level** — Auto-spawn branches for requests, or always confirm first?
- **Notification style** — Concise updates? Detailed summaries? How often?
- **Who can request work** — Everyone in Slack, or only certain people/channels?
- **Sensitive areas** — Any repos, branches, or integrations to avoid touching?
- **Default behaviors** — e.g., "always use builder-main unless told otherwise"

Write these to `memory/team-preferences.md`.

## 4. Connect Integrations

Walk them through each integration (install links are in AGENTS.md):

- **Slack** — Which workspace and channels to monitor?
- **Jira** — Which project keys and pods to focus on?
- **Other** — GitHub, Gong, Figma, etc.

## 5. Test the Loop

Quick end-to-end check:

1. They send a test message in the primary Slack channel
2. You confirm you received it
3. Spawn a test branch and confirm it appears
4. Send a response back to the channel

Fix any issues before going live.

## 6. Clean Up

- Verify `memory/MEMORY.md` is under 200 lines
- Verify topic files exist for anything that needed depth
- Delete this file — you don't need a bootstrap script anymore

---

_Good luck out there._
