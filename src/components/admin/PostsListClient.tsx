import { useMemo } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowSquareOutIcon, PushPinIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "./DataTable";
import type { PostStatus } from "@/routes/admin/posts/-list-search";
import { DeletePostButton } from "./DeletePostButton";
import { useI18n } from "@/i18n/I18nProvider";

type Post = {
  id: string;
  slug: string;
  title: string;
  status: string;
  pinned: boolean;
  updatedAt: number;
};

const route = getRouteApi("/admin/posts/");

export function PostsListClient({ posts }: { posts: Post[] }) {
  const { t, locale } = useI18n();
  // Filters live in the URL (see list-search.ts) so leaving the list and
  // coming back — or reloading — restores the filtered view.
  const { q, status, page } = route.useSearch();
  const navigate = route.useNavigate();

  // Memoized so the filtered array keeps a stable identity across renders —
  // otherwise react-table sees "new data" every render and resets the page.
  const data = useMemo(
    () => (status === undefined ? posts : posts.filter((p) => p.status === status)),
    [posts, status],
  );

  const columns = useMemo<ColumnDef<Post, unknown>[]>(() => {
    function formatDate(ts: number): string {
      return new Date(ts * 1000).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    return [
      {
        accessorKey: "title",
        header: t("postList.title"),
        // Title → edit (the primary click target for a row).
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            {row.original.pinned && (
              <PushPinIcon weight="fill" className="size-4 shrink-0 text-muted-foreground" />
            )}
            <Link
              to="/admin/posts/$postId/edit"
              params={{ postId: row.original.id }}
              className="font-medium hover:underline"
            >
              {row.original.title}
            </Link>
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("postList.status"),
        cell: ({ row }) => (
          <Badge variant={row.original.status === "published" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: t("postList.updated"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
        ),
      },
      {
        id: "actions",
        header: t("postList.actions"),
        enableSorting: false,
        meta: { headClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {/* View the live page in a new tab; drafts have no public page. */}
            {row.original.status === "published" && (
              <Button
                variant="ghost"
                size="icon-sm"
                render={
                  <Link
                    to="/posts/$slug"
                    params={{ slug: row.original.slug }}
                    target="_blank"
                    rel="noreferrer"
                    title={t("postList.view")}
                  />
                }
              >
                <ArrowSquareOutIcon className="size-4" />
              </Button>
            )}
            <DeletePostButton postId={row.original.id} postTitle={row.original.title} />
          </div>
        ),
      },
    ];
  }, [t, locale]);

  const toolbar = (
    <>
      <Select
        value={status ?? "all"}
        onValueChange={(v) =>
          navigate({
            search: (prev) => ({ ...prev, status: v === "all" ? undefined : (v as PostStatus) }),
            replace: true,
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("postList.all")}</SelectItem>
          <SelectItem value="draft">{t("postForm.draft")}</SelectItem>
          <SelectItem value="published">{t("postForm.published")}</SelectItem>
        </SelectContent>
      </Select>
      <Button render={<Link to="/admin/posts/new" />}>{t("admin.newPost")}</Button>
    </>
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder={t("postList.searchPlaceholder")}
      toolbar={toolbar}
      emptyMessage={t("common.noPostsFound")}
      globalFilter={q ?? ""}
      onGlobalFilterChange={(v) =>
        navigate({ search: (prev) => ({ ...prev, q: v || undefined }), replace: true })
      }
      pageIndex={(page ?? 1) - 1}
      onPageChange={(idx) =>
        navigate({
          search: (prev) => ({ ...prev, page: idx === 0 ? undefined : idx + 1 }),
          replace: true,
        })
      }
    />
  );
}
