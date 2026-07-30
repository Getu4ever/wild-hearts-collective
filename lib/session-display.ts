/** Public label for a session — custom display title, or the class type title. */
export function sessionPublicTitle(session: {
  displayTitle?: string | null;
  class?: { title?: string | null } | null;
  classTitle?: string | null;
}): string {
  const custom = session.displayTitle?.trim();
  if (custom) return custom;
  return session.class?.title?.trim() || session.classTitle?.trim() || "Class";
}
