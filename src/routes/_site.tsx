import { createFileRoute, Outlet } from "@tanstack/react-router";
import { blogShellFn } from "@/server/public";
import { PublicShell } from "@/features/public-site/PublicShell";
import { TmNotFound } from "@/features/terminal";

// Preserve the route boundary and loader contract while sharing the public UI.
export const Route = createFileRoute("/_site")({
  loader: () => blogShellFn(),
  component: SiteLayout,
  notFoundComponent: TmNotFound,
});
function SiteLayout() {
  const data = Route.useLoaderData();
  return (
    <PublicShell social={data.social}>
      <Outlet />
    </PublicShell>
  );
}
