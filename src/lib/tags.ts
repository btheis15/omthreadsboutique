/**
 * Printed tags (made in the Om Threads admin, src/tags.js there): each piece's packaging has a QR code
 * for https://<this site>/p/<code>, where the code is that option's (or the piece's) id in 22 letters
 * (base64url of its 16 bytes). The id never changes when a piece is renamed, so old tags keep working.
 */

/** The id in a tag code, or null when it isn't one. */
export function tagId(code: string): string | null {
  if (!/^[A-Za-z0-9_-]{22}$/.test(code)) return null;
  const hex = Buffer.from(code, "base64url").toString("hex");
  if (hex.length !== 32) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
