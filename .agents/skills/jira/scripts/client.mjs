const domain = process.env.JIRA_DOMAIN; // e.g. "mycompany" for mycompany.atlassian.net
const email = process.env.JIRA_EMAIL;
const token = process.env.JIRA_API_TOKEN;

if (!domain || !email || !token) {
  console.error(
    "Error: Set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.\n" +
    "  JIRA_DOMAIN = your Atlassian subdomain (e.g. 'mycompany' for mycompany.atlassian.net)\n" +
    "  JIRA_EMAIL  = your Atlassian account email\n" +
    "  JIRA_API_TOKEN = API token from https://id.atlassian.com/manage/api-tokens"
  );
  process.exit(1);
}

const baseUrl = `https://${domain}.atlassian.net`;
const auth = Buffer.from(`${email}:${token}`).toString("base64");

export async function jiraFetch(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Jira API error ${res.status}: ${body}`);
    process.exit(1);
  }
  return res.json();
}

export { baseUrl };

export function jiraUrl(issueKey) {
  return `${baseUrl}/browse/${issueKey}`;
}

// Parses Jira URLs into { issueKey, projectKey, boardId, type }
//
// Supported formats:
//   https://{domain}.atlassian.net/browse/{PROJ-123}           → issue
//   https://{custom-domain}/browse/{PROJ-123}                  → issue (custom domain)
//   https://{domain}/jira/software/projects/{PROJ}/boards/{id} → board
//   https://{domain}/jira/software/projects/{PROJ}             → project
//
// Returns null if the input is not a recognizable Jira URL.
export function parseJiraUrl(input) {
  if (typeof input !== "string") return null;
  if (!input.startsWith("http://") && !input.startsWith("https://")) return null;

  let url;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);

  // /browse/{ISSUE-KEY}  — works for both atlassian.net and custom domains
  const browseIdx = parts.indexOf("browse");
  if (browseIdx !== -1 && parts[browseIdx + 1]) {
    return { issueKey: parts[browseIdx + 1], projectKey: null, boardId: null, type: "issue" };
  }

  // /jira/software/projects/{PROJECT}/boards/{boardId}[/...]
  const boardsIdx = parts.indexOf("boards");
  if (boardsIdx !== -1) {
    const boardId = parts[boardsIdx + 1] ? String(parts[boardsIdx + 1]) : null;
    const projectsIdx = parts.indexOf("projects");
    const projectKey = projectsIdx !== -1 ? parts[projectsIdx + 1] : null;
    return { issueKey: null, projectKey: projectKey || null, boardId, type: "board" };
  }

  // /jira/software/projects/{PROJECT}
  const projectsIdx = parts.indexOf("projects");
  if (projectsIdx !== -1 && parts[projectsIdx + 1]) {
    return { issueKey: null, projectKey: parts[projectsIdx + 1], boardId: null, type: "project" };
  }

  return null;
}
