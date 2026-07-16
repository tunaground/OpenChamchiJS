export const ROLE = {
  ADMIN: "ADMIN",
  VERIFIED: "VERIFIED",
} as const;

export type GlobalRole = (typeof ROLE)[keyof typeof ROLE];

const BOARD_ADMIN_SUFFIX = ":ADMIN";

export function boardAdminRole(boardId: string): string {
  return `${boardId}${BOARD_ADMIN_SUFFIX}`;
}

export function isBoardAdminRole(role: string): boolean {
  return (
    role.endsWith(BOARD_ADMIN_SUFFIX) && role.length > BOARD_ADMIN_SUFFIX.length
  );
}

export function boardIdFromRole(role: string): string | null {
  if (!isBoardAdminRole(role)) return null;
  return role.slice(0, -BOARD_ADMIN_SUFFIX.length);
}
