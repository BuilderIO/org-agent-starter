import { WebClient } from "@slack/web-api";

const token = process.env.SLACK_BOT_TOKEN || process.env.SLACK_TOKEN;
if (!token) {
  console.error("Error: Set SLACK_BOT_TOKEN or SLACK_TOKEN environment variable");
  process.exit(1);
}

export const slack = new WebClient(token);

// Parses Slack URLs into { channelId, threadTs, type }
//
// Supported formats:
//   https://{workspace}.slack.com/archives/{channelId}
//   https://{workspace}.slack.com/archives/{channelId}/p{microsecondTs}
//   https://slack.com/app_redirect?channel={channelId}[&message_ts={ts}]
//   https://app.slack.com/client/{teamId}/{channelId}
//
// Returns null if the input is not a recognizable Slack URL.
// threadTs is in the standard Slack API format: "1234567890.123456"
export function parseSlackUrl(input) {
  if (typeof input !== "string") return null;
  if (!input.startsWith("http://") && !input.startsWith("https://")) return null;

  let url;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  // https://slack.com/app_redirect?channel=C1234567890[&message_ts=1234567890.123456]
  if (url.hostname === "slack.com" && url.pathname === "/app_redirect") {
    const channelId = url.searchParams.get("channel");
    const messageTs = url.searchParams.get("message_ts");
    if (channelId) {
      return {
        channelId,
        threadTs: messageTs || null,
        type: messageTs ? "thread" : "channel",
      };
    }
  }

  // https://app.slack.com/client/{teamId}/{channelId}
  if (url.hostname === "app.slack.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "client" && parts[2]) {
      return { channelId: parts[2], threadTs: null, type: "channel" };
    }
  }

  // https://{workspace}.slack.com/archives/{channelId}[/p{microsecondTs}]
  if (url.hostname.endsWith(".slack.com")) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "archives" && parts[1]) {
      const channelId = parts[1];
      if (parts[2]?.startsWith("p")) {
        // Convert p1609459200123456 → 1609459200.123456 (insert dot 6 chars from the end)
        const raw = parts[2].slice(1);
        const threadTs = raw.slice(0, -6) + "." + raw.slice(-6);
        return { channelId, threadTs, type: "thread" };
      }
      return { channelId, threadTs: null, type: "channel" };
    }
  }

  return null;
}

// Builds a Slack URL for a channel or message/thread permalink.
// Lazily calls auth.test() once to discover the workspace URL.
// - slackUrl(channelId)       → channel URL
// - slackUrl(channelId, ts)   → message/thread permalink
let _workspaceUrl = null;
export async function slackUrl(channelId, ts) {
  if (!_workspaceUrl) {
    const auth = await slack.auth.test();
    _workspaceUrl = auth.url; // e.g. "https://myworkspace.slack.com/"
  }
  const base = `${_workspaceUrl}archives/${channelId}`;
  if (!ts) return base;
  // Convert "1234567890.123456" → "p1234567890123456"
  const p = "p" + ts.replace(".", "").padEnd(16, "0");
  return `${base}/${p}`;
}
