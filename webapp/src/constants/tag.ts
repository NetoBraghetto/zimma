import type { CSSProperties } from "react";

// Tag colors are stored as "#rrggbb"; the API validates the same format.
export const DEFAULT_TAG_COLOR = "#2563eb";

// Picks black or white text for the best contrast against the tag color.
export function tagBadgeStyle(color: string): CSSProperties {
  const hex = /^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_TAG_COLOR;
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return { backgroundColor: hex, color: luminance > 0.6 ? "#000000" : "#ffffff" };
}
