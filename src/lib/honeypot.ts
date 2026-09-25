// Hidden form field name. Real users never see or fill it; bots that
// autofill every input do, which is how we quietly drop their submissions.
export const HONEYPOT_FIELD = "company_website";

export function isBot(body: Record<string, unknown>): boolean {
  const value = body[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim().length > 0;
}
