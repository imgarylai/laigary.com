// Social profile settings store bare handles/slugs; profile URLs are derived.
// The admin form shows these prefixes in front of the input, and the settings
// mutation normalizes whatever gets pasted (full URL, @handle, …) down to the
// bare handle so the stored value is always canonical.

export const SOCIAL_PREFIXES = {
  author_github: "github.com/",
  author_twitter: "x.com/",
  author_linkedin: "linkedin.com/in/",
} as const;

export type SocialKey = keyof typeof SOCIAL_PREFIXES;

export function isSocialKey(key: string): key is SocialKey {
  return key in SOCIAL_PREFIXES;
}

// Hosts accepted per field when a full URL is pasted.
const HOSTS: Record<SocialKey, string[]> = {
  author_github: ["github.com/"],
  author_twitter: ["x.com/", "twitter.com/"],
  author_linkedin: ["linkedin.com/in/", "linkedin.com/"],
};

/** `https://x.com/@gary/` / `@gary` / `gary` all normalize to `gary`. */
export function normalizeSocialHandle(key: SocialKey, value: string): string {
  let v = value.trim();
  v = v.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  for (const host of HOSTS[key]) {
    if (v.toLowerCase().startsWith(host)) {
      v = v.slice(host.length);
      break;
    }
  }
  v = v.replace(/^@/, "");
  v = v.replace(/[/?#].*$/, "");
  return v;
}

/** Absolute profile URL for a stored handle, or null when unset. */
export function socialUrl(key: SocialKey, handle: string): string | null {
  const clean = handle.trim();
  return clean ? `https://${SOCIAL_PREFIXES[key]}${clean}` : null;
}
