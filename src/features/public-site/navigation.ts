import { linkOptions } from "@tanstack/react-router";

// Phase 2 will point Writing at /writing. Keep the mapping here so the header,
// mobile menu, search and primary home CTA move together without changing URLs.
export const WRITING_LINK = linkOptions({ to: "/posts" });
export const PUBLIC_NAV = linkOptions([
  { ...WRITING_LINK, labelKey: "public.writing" },
  { to: "/works", labelKey: "public.work" },
  { to: "/$slug", params: { slug: "about" }, labelKey: "public.about" },
]);
