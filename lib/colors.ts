export type UserColor = {
  border: string;
  bg: string;
  text: string;
};

export const USER_PALETTE: UserColor[] = [
  { border: "#10b981", bg: "#ecfdf5", text: "#065f46" }, // emerald
  { border: "#3b82f6", bg: "#eff6ff", text: "#1e40af" }, // blue
  { border: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" }, // violet
  { border: "#f59e0b", bg: "#fffbeb", text: "#92400e" }, // amber
  { border: "#f43f5e", bg: "#fff1f2", text: "#9f1239" }, // rose
  { border: "#14b8a6", bg: "#f0fdfa", text: "#115e59" }, // teal
  { border: "#6366f1", bg: "#eef2ff", text: "#3730a3" }, // indigo
  { border: "#d946ef", bg: "#fdf4ff", text: "#86198f" }, // fuchsia
  { border: "#f97316", bg: "#fff7ed", text: "#9a3412" }, // orange
  { border: "#0ea5e9", bg: "#f0f9ff", text: "#075985" }, // sky
];

function hashStr(s: string): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function userColor(key: string): UserColor {
  return USER_PALETTE[hashStr(key) % USER_PALETTE.length];
}
