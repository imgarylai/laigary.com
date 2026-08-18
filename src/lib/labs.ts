// The /labs registry: the npm packages that have a demo page here.
//
// Deliberately a hand-written list rather than anything derived from
// package.json — a demo page is bespoke code, so adding one is always a manual
// act. This exists so the index listing, the ⌘K palette and the sitemap agree
// on what /labs contains instead of each keeping its own copy.
//
// No version field on purpose: a pinned version string here would rot the day
// the package publishes. The npm link shows the current version, and the
// version the demo actually runs is whatever this repo's package.json resolves
// — Renovate keeps that current and `pnpm typecheck` fails if an upgrade breaks
// the playground.

export interface Lab {
  slug: string;
  /** Route path — a literal so the typed router accepts `<Link to={lab.to}>`. */
  to: `/labs/${string}`;
  /** npm package name — also the GitHub repo name for all of these. */
  pkg: string;
  /** One line, shown in the /labs listing. */
  tagline: string;
  /** `hook` renders UI state, `lib` is a plain function call. Shown as the listing's meta column. */
  kind: "react hook" | "lib" | "lib + cli";
  /** Published API reference, when the repo has one. */
  docs?: string;
}

export const LABS = [
  {
    slug: "use-tw-zipcode",
    to: "/labs/use-tw-zipcode",
    pkg: "use-tw-zipcode",
    tagline: "台灣縣市／鄉鎮市區連動選單，自動帶出郵遞區號",
    kind: "react hook",
  },
  {
    slug: "taiwan-validator",
    to: "/labs/taiwan-validator",
    pkg: "taiwan-validator",
    tagline: "身分證、統編、發票、車牌⋯⋯台灣各種號碼的驗證與解析",
    kind: "lib",
    docs: "https://imgarylai.github.io/taiwan-validator/",
  },
  {
    slug: "use-country-list-zh",
    to: "/labs/use-country-list-zh",
    pkg: "use-country-list-zh",
    tagline: "中文國家選單，可以打英文搜尋",
    kind: "react hook",
  },
  {
    slug: "use-wg",
    to: "/labs/use-wg",
    pkg: "use-wg",
    tagline: "中文轉威妥瑪拼音，也能產生 URL slug",
    kind: "lib + cli",
    docs: "https://imgarylai.github.io/use-wg/",
  },
] as const satisfies readonly Lab[];

export function npmUrl(pkg: string): string {
  return `https://www.npmjs.com/package/${pkg}`;
}

export function repoUrl(pkg: string): string {
  return `https://github.com/imgarylai/${pkg}`;
}
