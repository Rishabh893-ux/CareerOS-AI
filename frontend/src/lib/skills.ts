/**
 * A profile's skills are stored in two lists: ones the person typed and ones
 * pulled from their resume. Everything that shows or edits skills uses the
 * merged, de-duplicated list (mirrors getMergedSkills on the backend).
 */
export function mergeSkills(profile?: { skills?: string[]; resumeExtractedSkills?: string[] } | null): string[] {
  return [...new Set([...(profile?.skills || []), ...(profile?.resumeExtractedSkills || [])])];
}
