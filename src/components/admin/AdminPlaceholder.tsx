import { T } from "@/i18n/T";

// Shell-stage stand-in for admin section pages. Each section (posts, tags,
// pages, interview, settings) and the dashboard's real content are built in
// their own sub-issues (#27–#30); this keeps the nav fully navigable now.
export function AdminPlaceholder({ titleKey }: { titleKey: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        <T k={titleKey} />
      </h1>
      <p className="text-muted-foreground">
        <T k="admin.comingSoon" />
      </p>
    </div>
  );
}
