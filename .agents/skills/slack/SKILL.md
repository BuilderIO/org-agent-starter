---
name: slack
description: >
  Interact with Slack workspaces — search messages, read channel history, browse threads,
  list channels, and find users. Use this skill whenever the user mentions Slack, asks about
  messages in a channel, wants to check what people said about a topic, look up Slack users,
  or references #channel-names. Also trigger when the user says things like "check Slack",
  "what's happening in #X", "find messages about Y", "who said Z", or any task involving
  reading from Slack. Even if the user doesn't say "Slack" explicitly but mentions a #channel,
  use this skill.
---

# Slack Integration

Read-only access to a Slack workspace via the Slack Web API. All scripts are in
`scripts/` relative to this skill and use `@slack/web-api`.

## Setup

The `SLACK_BOT_TOKEN` (or `SLACK_TOKEN`) environment variable must be set with a bot token
that has the necessary scopes (channels:read, channels:history, groups:read, groups:history,
users:read, search:read, etc.).

Dependencies (`@slack/web-api`) are declared in the root `package.json`. Run `npm install` at the repo root if not already done.

## Available Scripts

All scripts are `.mjs` files. Run them with `node <skill-path>/scripts/<script>.mjs`.

### search-messages.mjs
Search across all messages in the workspace. Supports Slack search modifiers like `in:#channel`, `from:@user`, `before:`, `after:`, etc.

```bash
node scripts/search-messages.mjs "deploy issue"
node scripts/search-messages.mjs "in:#engineering bug" --count 5
node scripts/search-messages.mjs "from:@alice after:2025-01-01" --sort timestamp
```

### channel-history.mjs
Read recent messages from a channel. Accepts channel name, ID, or Slack URL.

```bash
node scripts/channel-history.mjs general --limit 30
node scripts/channel-history.mjs #engineering --oldest 2025-03-01 --limit 50
node scripts/channel-history.mjs https://myworkspace.slack.com/archives/C01234ABCDE
```

### thread-replies.mjs
Read all replies in a thread. Accepts channel + timestamp, or a single Slack thread URL.

```bash
node scripts/thread-replies.mjs general 1234567890.123456
node scripts/thread-replies.mjs https://myworkspace.slack.com/archives/C01234ABCDE/p1234567890123456
```

### read-current-thread.mjs
Read the full thread you're currently responding in. Accepts channel ID + timestamp, or a Slack thread URL. Extract from your `channelId` (format: `slack/thread/{teamId}/{channelId}/{threadTs}`).

```bash
node scripts/read-current-thread.mjs C07ABC123 1234567890.123456
node scripts/read-current-thread.mjs https://myworkspace.slack.com/archives/C07ABC123/p1234567890123456
node scripts/read-current-thread.mjs C07ABC123 1234567890.123456 --limit 100
```

### list-channels.mjs
List channels, optionally filtered by name pattern.

```bash
node scripts/list-channels.mjs
node scripts/list-channels.mjs --filter eng
```

### channel-info.mjs
Get details about a channel (purpose, topic, member count). Accepts channel name, ID, or URL.

```bash
node scripts/channel-info.mjs general
node scripts/channel-info.mjs https://myworkspace.slack.com/archives/C01234ABCDE
```

### search-users.mjs
Search users by name, display name, or email.

```bash
node scripts/search-users.mjs john
node scripts/search-users.mjs engineering
```

## Workflow Patterns

When the user asks something like "check #channel for discussion about X":

1. First try `search-messages.mjs "in:#channel X"` — this is fastest
2. If search doesn't find enough, use `channel-history.mjs` with date filters to browse recent messages
3. For threads with interesting context, use `thread-replies.mjs` to get the full conversation

When the user asks "who works on X" or "find person Y":
1. Use `search-users.mjs` to find the person
2. Optionally use `search-messages.mjs "from:@username"` to see their recent activity

When you're responding to a Slack thread and need more context:
1. Check if `<slack_thread_context>` is already included in your prompt — this is injected automatically with the last ~20 messages
2. If you need older messages or the full thread, parse your `channelId` (`slack/thread/{teamId}/{channelId}/{threadTs}`) and use `read-current-thread.mjs`
3. Use `thread-replies.mjs` if you need to read a *different* thread (not the one you're in)

When exploring a workspace:
1. `list-channels.mjs` to discover channels
2. `channel-info.mjs` to understand a channel's purpose
3. `channel-history.mjs` to read recent activity

## Tips

- Slack search modifiers are powerful: `in:#channel`, `from:@user`, `has:link`, `has:reaction`, `before:YYYY-MM-DD`, `after:YYYY-MM-DD`, `during:month`
- Channel names can be passed with or without the `#` prefix
- Slack URLs are accepted anywhere a channel or thread is needed — paste the permalink directly
- Thread URLs look like `https://…/archives/C.../p{microseconds}` — the script converts them to API timestamps automatically
- The redirect URL `https://slack.com/app_redirect?channel=C...` is also supported
- Thread timestamps look like `1234567890.123456` — copy them from channel-history output
- All scripts print human-readable output to stdout, so you can read and summarize the results directly
