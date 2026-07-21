import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
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
import { DeletePostButton } from "./DeletePostButton";
import { useI18n } from "@/i18n/I18nProvider";

type Post = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: number;
};

export function PostsListClient({ posts }: { posts: Post[] }) {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState("all");

  const data = status === "all" ? posts : posts.filter((p) => p.status === status);

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
          <Link
            to="/admin/posts/$postId/edit"
            params={{ postId: row.original.id }}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
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
            {/* View the live page — plain anchor since the public post route
                lands in the frontend phase; drafts have no public page. */}
            {row.original.status === "published" && (
              <Button
                variant="ghost"
                size="icon-sm"
                render={
                  <a
                    href={`/posts/${row.original.slug}`}
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
      <Select value={status} onValueChange={(v) => setStatus(v as string)}>
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
    />
  );
}
