// "Report a mistake" opens a pre-filled GitHub issue, so reports are public and reviewable (PLAN.md §5.3).
export const REPO_URL = "https://github.com/Jakeclur/Language";

export function reportUrl(what: string, details: string): string {
  const title = `Content report: ${what}`;
  const body = `**What's wrong?**\n<!-- e.g. wrong translation, wrong register/rudeness level, spelling, unnatural sentence -->\n\n\n**Suggested correction**\n\n\n---\n${details}\n`;
  return `${REPO_URL}/issues/new?labels=content-report&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
