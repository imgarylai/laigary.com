import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { siteMetaFn } from "@/server/public";

// Public site shell (a pathless layout). Simple shadcn-styled header + footer,
// theme toggle. This is a plain interim design reusing the admin design system;
// the terminal-aesthetic redesign replaces it later.
export const Route = createFileRoute("/_site")({
  loader: () => siteMetaFn(),
  component: SiteLayout,
});

const navLink = "text-sm text-muted-foreground transition-colors hover:text-foreground";

function SiteLayout() {
  const { siteName } = Route.useLoaderData();

  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4">
            <Link to="/" className="font-semibold tracking-tight">
              {siteName}
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/posts" className={navLink}>
                Posts
              </Link>
              <Link to="/tags" className={navLink}>
                Tags
              </Link>
              <Link to="/interview" className={navLink}>
                Interview
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
          <Outlet />
        </main>

        <footer className="border-t">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-muted-foreground">
            © {siteName}
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
