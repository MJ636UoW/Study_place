/**
 * Policy Launch Blocker Verification Engine
 *
 * Scans legal charters, house policies, and terms for unfinished placeholder text.
 * Any detected placeholder is flagged as a strict LAUNCH_BLOCKER.
 */

export const LAUNCH_BLOCKER_PATTERNS = [
  /\[TODO[^\]]*\]/i,
  /\[TBD[^\]]*\]/i,
  /\[REPLACE[^\]]*\]/i,
  /\[INSERT[^\]]*\]/i,
  /<INSERT[^>]*>/i,
  /Lorem ipsum/i,
  /\bInsert Legal Name\b/i,
  /\bInsert Company Name\b/i,
  /\bInsert Address\b/i,
  /\bInsert Date\b/i,
];

export interface PolicyCheckResult {
  hasBlockers: boolean;
  blockers: string[];
}

export function checkPolicyLaunchBlockers(content: string): PolicyCheckResult {
  const found: string[] = [];

  for (const pattern of LAUNCH_BLOCKER_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      found.push(match[0]);
    }
  }

  return {
    hasBlockers: found.length > 0,
    blockers: found,
  };
}
