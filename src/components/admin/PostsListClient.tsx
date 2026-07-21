import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeletePostButton } from "./DeletePostButton";
import { useI18n } from "@/i18n/I18nProvider";

type Post = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: number;
};

export function PostsListClient({
  posts,
  q,
  status: statusProp,
}: {
  posts: Post[];
  q: string;
  status: string;
}) {
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  const [query, setQuery] = useState(q);
  const [status, setStatus] = useState(statusProp || "all");

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Debounce search / filter changes into the route search params, which
  // re-runs the list loader. Page resets to 1 on any filter change.
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate({
        to: "/admin/posts",
        search: {
          q: query || undefined,
          status: status !== "all" ? (status as "draft" | "published") : undefined,
          page: undefined,
        },
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, status, navigate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("postList.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
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
      </div>

      {posts.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{t("common.noPostsFound")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("postList.title")}</TableHead>
              <TableHead>{t("postList.status")}</TableHead>
              <TableHead>{t("postList.updated")}</TableHead>
              <TableHead className="text-right">{t("postList.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(post.updatedAt)}
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link to="/admin/posts/$postId/edit" params={{ postId: post.id }} />}
                  >
                    {t("postList.edit")}
                  </Button>
                  <DeletePostButton postId={post.id} postTitle={post.title} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
