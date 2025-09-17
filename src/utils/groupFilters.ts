// Centralized filters for groups by name
// Use semantic, case-insensitive matching for exact blocked titles

export const BLOCKED_GROUP_TITLES = [
  'join group chat on telegram'
];

export const isBlockedGroupName = (name?: string): boolean => {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return BLOCKED_GROUP_TITLES.some(blocked => normalized === blocked);
};

export const filterBlockedGroups = <T extends { name?: string }>(groups: T[]): T[] => {
  return groups.filter(g => !isBlockedGroupName(g.name));
};
