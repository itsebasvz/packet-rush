import companions from "@/content/companions.json";

export const avatars = companions.avatars;
export const avatarColors = companions.colors;
export type Avatar = keyof typeof avatars;
export type AvatarColor = keyof typeof avatarColors;
export const avatarNames = Object.fromEntries(
  Object.entries(avatars).map(([id, companion]) => [id, companion.name]),
) as Record<Avatar, string>;

export function isAvatar(value: unknown): value is Avatar {
  return typeof value === "string" && Object.hasOwn(avatars, value);
}
export function isAvatarColor(value: unknown): value is AvatarColor {
  return typeof value === "string" && Object.hasOwn(avatarColors, value);
}
