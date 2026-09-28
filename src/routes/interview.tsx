import { createFileRoute, Outlet } from "@tanstack/react-router";
import { interviewShellFn } from "@/server/public";
import { PublicShell } from "@/features/public-site/PublicShell";
import { TmNotFound } from "@/features/terminal";

// Preserve the route boundary and loader contract while sharing the public UI.
export const Route = createFileRoute("/interview")({
  loader: () => interviewShellFn(),
  component: InterviewLayout,
  notFoundComponent: TmNotFound,
});
function InterviewLayout() {
  const data = Route.useLoaderData();
  return (
    <PublicShell social={data.social} sections={data.sections}>
      <Outlet />
    </PublicShell>
  );
}
