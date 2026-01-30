/**
 * CICOP Name Extractor – compliance-safe greeting
 *
 * Rules:
 * 1. Use display name (from email metadata) if it looks like a real name
 * 2. Fallback: try to extract from email body signature
 * 3. Fallback: "Team" for generic/corporate senders or unknown
 * 4. NEVER derive name from email address (compliance risk)
 */

const GENERIC_PATTERNS = [
  /^claims?@/i,
  /^info@/i,
  /^support@/i,
  /^admin@/i,
  /^no-?reply@/i,
  /^team@/i,
  /^service@/i,
  /^hello@/i,
];

const GENERIC_NAMES = new Set([
  'claims',
  'claim',
  'team',
  'support',
  'admin',
  'info',
  'service',
  'help',
  'noreply',
  'no-reply',
  'hello',
  'contact',
  'sales',
  'enquiries',
]);

const COMMON_FIRST_NAMES = new Set([
  'john',
  'jane',
  'james',
  'mary',
  'michael',
  'sarah',
  'david',
  'emma',
  'chris',
  'katie',
  'daniel',
  'lisa',
  'matt',
  'anna',
  'tom',
  'emily',
  'mark',
  'lucy',
  'joanna',
  'kayla',
  'mat',
]);

function isGenericEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return GENERIC_PATTERNS.some((p) => p.test(lower));
}

function isGenericName(name: string): boolean {
  const lower = name.toLowerCase();
  return [...GENERIC_NAMES].some((g) => lower.includes(g));
}

function looksLikeRealName(name: string): boolean {
  const lower = name.toLowerCase();
  if (COMMON_FIRST_NAMES.has(lower)) return true;
  if (!/^[A-Za-z][a-z]{1,19}$/.test(name)) return false;
  return !isGenericName(name);
}

function extractFromDisplayName(displayName: string | null | undefined): string | null {
  if (!displayName || !displayName.trim()) return null;

  let name = displayName
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/["']/g, '')
    .trim();

  if (!name || isGenericName(name)) return null;

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;

  const first = parts[0];
  if (parts.length === 1) {
    return looksLikeRealName(first) ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : null;
  }

  if (looksLikeRealName(first)) {
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return null;
}

const SIGNATURE_PATTERNS = [
  /(?:regards|thanks|cheers|best),?\s*\n?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  /(?:from|sent by):?\s*\n?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
];

function extractFromSignature(body: string | null | undefined): string | null {
  if (!body || !body.trim()) return null;

  for (const pattern of SIGNATURE_PATTERNS) {
    const match = body.match(pattern);
    if (match) {
      const name = match[1].trim();
      if (isGenericName(name)) continue;
      const parts = name.split(/\s+/);
      if (parts.length > 0 && looksLikeRealName(parts[0])) {
        const first = parts[0];
        return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
      }
    }
  }
  return null;
}

/**
 * Get the greeting recipient for template: "John" or "Team".
 * Used as customer_name in "Dear {{customer_name}}".
 * NEVER derived from email address.
 */
export function getGreetingRecipient(
  senderEmail: string,
  displayName: string | null | undefined,
  emailBody: string | null | undefined
): string {
  if (isGenericEmail(senderEmail)) return 'Team';

  const fromDisplay = extractFromDisplayName(displayName);
  if (fromDisplay) return fromDisplay;

  const fromSignature = extractFromSignature(emailBody);
  if (fromSignature) return fromSignature;

  return 'Team';
}

/**
 * Full greeting line for templates that use {{greeting}}: "Dear John" or "Dear Team".
 */
export function getGreeting(
  senderEmail: string,
  displayName: string | null | undefined,
  emailBody: string | null | undefined
): string {
  const recipient = getGreetingRecipient(senderEmail, displayName, emailBody);
  return `Dear ${recipient}`;
}
