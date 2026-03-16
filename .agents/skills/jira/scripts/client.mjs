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
