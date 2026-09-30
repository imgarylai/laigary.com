import { createElement } from "react";
import { BUBBLE_TEA_SHAPES } from "@/lib/brand";

/** Decorative beside the accessible Gary Lai wordmark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      width="36"
      height="36"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(4 2)">
        {BUBBLE_TEA_SHAPES.map(({ type, props }, index) =>
          createElement(type, { ...props, key: index }),
        )}
      </g>
    </svg>
  );
}
