// Shared geometry for the header, generated icons and Satori social cards.
export const BRAND_INK = "#684832";
export const BRAND_CANVAS = "#faf6ed";

// Cream and milk-green layers meet at a soft curved surface inside the cup.
const ink = "#414640";
const outline = {
  stroke: ink,
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const cup = "M15 17 19 51Q19.3 54 22 54H34Q36.7 54 37 51L41 17Z";
export const BUBBLE_TEA_SHAPES = [
  { type: "path", props: { d: cup, fill: BRAND_CANVAS } },
  {
    type: "path",
    props: { ...outline, d: "M31 17 24.333 37", fill: "none" },
  },
  {
    type: "path",
    props: {
      d: "M17 34C24 28 31 40 39 34L37 51Q36.7 54 34 54H22Q19.3 54 19 51Z",
      fill: "#ccd8b8",
    },
  },
  { type: "path", props: { ...outline, d: cup, fill: "none" } },
  {
    type: "path",
    props: { ...outline, d: "M35 5 31 17M12 17H44", fill: "none" },
  },
  ...(
    [
      [24, 45, 2],
      [32, 44, 2],
      [28, 50, 2],
    ] as const
  ).map(([cx, cy, r]) => ({
    type: "circle" as const,
    props: { cx, cy, r, fill: ink },
  })),
] as const;

export const BUBBLE_TEA_BACKGROUND = [
  { type: "rect", props: { width: 64, height: 64, rx: 14, fill: "#b7c4a4" } },
  { type: "path", props: { d: "M14 0H46L0 38V14Q0 0 14 0Z", fill: "#cbd5bb" } },
  { type: "path", props: { d: "M64 28V50Q64 64 50 64H25Z", fill: "#a4b58f" } },
] as const;
