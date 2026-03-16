import { WebClient } from "@slack/web-api";

const token = process.env.SLACK_BOT_TOKEN || process.env.SLACK_TOKEN;
if (!token) {
  console.error("Error: Set SLACK_BOT_TOKEN or SLACK_TOKEN environment variable");
  process.exit(1);
}

export const slack = new WebClient(token);
