import { useMemo } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { PushPinIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumnDef } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import type { PostStatus } from "@/routes/admin/posts/-list-search";
import { PostRowActions } from "./PostRowActions";
import { useI18n } from "@/i18n/I18nProvider";
import { fmtRelativeFromUnix } from "@/lib/date";
import { PublishDateCell } from "./PublishDateCell";

type Post = {
  id: string;
  slug: string;
  title: string;
  status: string;
  pinned: boolean;
  publishedAt: number | null;
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

  const columns = useMemo<DataTableColumnDef<Post>[]>(() => {
    function absoluteDate(ts: number): string {
      return new Date(ts * 1000).toLocaleString(locale, { dateStyle: "long", timeStyle: "short" });
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
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        // The list mirrors the archive's order, so the date it shows is the one
        // it is sorted by. "Updated" used to sit here and answer a question
        // nobody was asking of a post list.
        accessorKey: "publishedAt",
        header: t("postList.published"),
        cell: ({ row }) => <PublishDateCell publishedAt={row.original.publishedAt} />,
      },
      {
        accessorKey: "updatedAt",
        header: t("postList.updated"),
        cell: ({ row }) => (
          // Relative, because in a working list almost everything is recent and
          // "3 hours ago" is the distinction being scanned for. The exact
          // timestamp stays one hover away.
          <span className="text-muted-foreground" title={absoluteDate(row.original.updatedAt)}>
            {fmtRelativeFromUnix(row.original.updatedAt, locale)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { headClassName: "w-10", cellClassName: "w-10 text-right" },
        cell: ({ row }) => (
          <PostRowActions
            postId={row.original.id}
            postSlug={row.original.slug}
            postTitle={row.original.title}
            published={row.original.status === "published"}
          />
        ),
      },
    ];
  }, [t, locale]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("postList.all") },
      { value: "draft", label: t("postForm.draft") },
      { value: "published", label: t("postForm.published") },
    ],
    [t],
  );

  const toolbar = (
    <>
      {/* `items` as well as the rendered options: Base UI resolves the
          trigger's label from the popup, which is not mounted until it opens,
          so without it a closed filter reads the raw English "draft". */}
      <Select
        value={status ?? "all"}
        items={statusOptions}
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
          {statusOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button nativeButton={false} render={<Link to="/admin/posts/new" />}>
        {t("admin.newPost")}
      </Button>
    </>
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder={t("postList.searchPlaceholder")}
      toolbar={toolbar}
      emptyMessage={t("common.noPostsFound")}
      onRowActivate={(post) =>
        navigate({ to: "/admin/posts/$postId/edit", params: { postId: post.id } })
      }
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
