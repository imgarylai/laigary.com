import { useRouterState } from "@tanstack/react-router";
import { breadcrumbForPath } from "@/lib/fsmap";

// Absolute hrefs resolved server-side (pickSocial in server/public.ts, built
// on lib/social); null means the setting is unset and the link is skipped.
export type FooterSocial = {
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  email: string | null;
};

// min-h/min-w + centering give each social link a >=24x24 tap target (WCAG
// touch-target min) without visibly changing the compact status-line look.
const EXT_LINK =
  "inline-flex min-h-[24px] min-w-[24px] items-center justify-center px-1 text-tm-muted no-underline hover:text-tm-accent";

// tmux-style status line. Not viewport-fixed: TerminalShell lays the page out
// as a min-h-dvh flex column with <main> at flex-1, so on short pages this bar
// sits flush at the bottom of the window, and on long pages it follows the
// content like a normal footer.
//
// Plain <a> is intentional throughout: every href here is either an external
// profile URL or the /feed.xml document endpoint — none are SPA routes, so the
// router's <Link> has nothing to do.
export function TmFooter({ siteName, social }: { siteName: string; social: FooterSocial }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const entries: [label: string, href: string | null][] = [
    ["github", social.github],
    ["x", social.twitter],
    ["linkedin", social.linkedin],
    ["mail", social.email],
  ];
  const links = entries.filter((entry): entry is [string, string] => entry[1] !== null);

  return (
    <footer className="flex h-8 items-center justify-between gap-3 overflow-hidden whitespace-nowrap border-t border-tm-border bg-tm-subtle px-3.5 text-[calc(0.8125rem*var(--tm-fs))]">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 bg-tm-accent px-1.5 py-px font-semibold text-tm-bg">
          {siteName.toLowerCase()}
        </span>
        <span className="min-w-0 overflow-hidden text-ellipsis text-tm-muted max-sm:hidden">
          0:~/{breadcrumbForPath(pathname)}*
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-tm-muted">
        {links.map(([label, href]) => (
          <a
            key={label}
            href={href}
            target={label === "mail" ? undefined : "_blank"}
            rel="noreferrer"
            className={EXT_LINK}
          >
            {label}
          </a>
        ))}
        <a href="/feed.xml" className={EXT_LINK}>
          rss
        </a>
        <span className="text-tm-dim">│ © {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
